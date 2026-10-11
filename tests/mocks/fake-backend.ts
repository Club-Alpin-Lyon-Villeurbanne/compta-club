/**
 * Faux backend Symfony pour les tests E2E.
 *
 * Next.js appelle l'API côté serveur (middleware, layout privé, routes /api/*) : ces appels ne
 * passent pas par le navigateur, donc page.route() ne peut pas les intercepter. Playwright lance
 * ce serveur et Next.js pointe dessus via NEXT_PUBLIC_API_URL.
 *
 * Il reproduit ce que le front doit gérer en production (plateforme-club-alpin) :
 * - JWT avec date d'expiration (1 h) et refresh token ;
 * - `details` renvoyé en chaîne JSON, dates avec fuseau horaire ;
 * - `pagination=false` renvoie un tableau nu, sinon `{ data, meta }` ;
 * - erreurs au format application/problem+json ;
 * - transitions de statut d'un gestionnaire, refusées (422) sur sa propre note ;
 * - notes hors sortie (achat, formation) : ni brouillon ni note qu'un responsable doit encore
 *   valider dans la liste, `status` et `type` à une ou plusieurs valeurs, recherche et date de la
 *   sortie sans effet sur elles.
 *
 * Chaque connexion ouvre une session isolée (identifiant `sid` porté par les jetons) : les
 * changements de statut et les requêtes reçues sont propres à un test, même en parallèle.
 * Les routes /__e2e/* permettent à un test de lire ce que le backend a reçu, de provoquer
 * une erreur ou d'ajouter les notes hors sortie à sa session (les tests des notes de sortie
 * gardent ainsi leurs données).
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mockExpenseReports, mockNotesHorsSortie } from './fixtures';

export const E2E_CREDENTIALS = { email: 'tresorier@clubalpinlyon.top', password: 'tresorier123' };

// Le gestionnaire connecté pendant les tests. Il n'est l'auteur que de la note « Via ferrata ».
const MANAGER = { id: 6, prenom: 'Claire', nom: 'Fontaine' };

const ACCESS_TOKEN_TTL_SECONDS = 3600;
const SIGNATURE = 'e2e-signature';

/** Jetons d'une session, valides ou déjà expirés (pour tester le rafraîchissement). */
export function createE2eTokens(sid: string = randomUUID(), expiresInSeconds = ACCESS_TOKEN_TTL_SECONDS) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return {
    token: `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ username: E2E_CREDENTIALS.email, sid, exp })}.${SIGNATURE}`,
    refresh_token: `refresh.${sid}`,
  };
}

function sessionIdFromAccessToken(header: string | undefined): string | null {
  const [, payload, signature] = (header ?? '').replace('Bearer ', '').split('.');
  if (signature !== SIGNATURE) return null;
  try {
    const { sid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp > Date.now() / 1000 ? sid : null;
  } catch {
    return null;
  }
}

type Event = (typeof mockExpenseReports)[number]['sortie'];

type Report = {
  id: number;
  status: string;
  type?: string;
  refundRequired: boolean;
  utilisateur: { id: number; prenom: string; nom: string };
  sortie: Event | null;
  dateCreation: string;
  commentaireStatut: string | null;
  details: Record<string, unknown>;
  valideurs?: unknown[];
  [field: string]: unknown;
};

const ownReport = {
  ...mockExpenseReports[0],
  id: 6,
  utilisateur: MANAGER,
  sortie: {
    ...mockExpenseReports[0].sortie,
    id: 106,
    titre: 'Via ferrata Chamechaude',
    code: 'SORTIE-2025-006',
    heureRendezVous: '2025-02-08T08:00:00',
    heureRetour: '2025-02-08T17:00:00',
  },
  dateCreation: '2025-02-09T10:00:00',
  details: { transport: { type: 'PUBLIC_TRANSPORT', ticketPrice: 90 }, accommodations: [], others: [] },
} as Report;

// Assez de notes comptabilisées pour avoir plusieurs pages (le front demande 30 notes par page).
// La dernière n'apparaît qu'en page 2 : seul un filtrage côté serveur peut la faire remonter.
const archivedReports = Array.from({ length: 31 }, (_, i) => {
  const report = {
    ...mockExpenseReports[3],
    id: 1000 + i,
    sortie: { ...mockExpenseReports[3].sortie, id: 1000 + i, titre: `Sortie archivée ${i + 1}` },
  };
  if (i < 30) return report;
  return {
    ...report,
    utilisateur: { id: 7, prenom: 'Paul', nom: 'Girard' },
    refundRequired: false,
    sortie: { ...report.sortie, heureRendezVous: '2025-03-01T08:00:00', heureRetour: '2025-03-01T18:00:00' },
  };
}) as Report[];

const allReports: Report[] = [...(mockExpenseReports as Report[]), ownReport, ...archivedReports];
const notesHorsSortie = mockNotesHorsSortie as Report[];

const MANAGER_TRANSITIONS: Record<string, string[]> = {
  submitted: ['approved', 'rejected'],
  approved: ['accounted'],
};

interface Session {
  changes: Map<number, Partial<Report>>;
  received: { method: string; path: string; body: unknown }[];
  failNextList: number | null;
  notesHorsSortie: boolean;
}

const sessions = new Map<string, Session>();

function getSession(sid: string): Session {
  if (!sessions.has(sid)) {
    sessions.set(sid, { changes: new Map(), received: [], failNextList: null, notesHorsSortie: false });
  }
  return sessions.get(sid)!;
}

function reportsSeenBy(session: Session): Report[] {
  const reports = session.notesHorsSortie ? [...allReports, ...notesHorsSortie] : allReports;
  return reports.map((r) => ({ ...r, ...session.changes.get(r.id) }));
}

const typeOf = (report: Report) => report.type ?? 'sortie';

// La trésorerie ne voit d'une note hors sortie ni le brouillon, ni l'envoi qu'un responsable doit encore valider.
function inTreasuryList(report: Report): boolean {
  if (typeOf(report) === 'sortie') return true;
  return report.status !== 'draft' && !(report.status === 'submitted' && (report.valideurs ?? []).length > 0);
}

const withOffset = (date: string) => (/(Z|[+-]\d\d:\d\d)$/.test(date) ? date : `${date}+01:00`);

// Format de l'API en production : details en chaîne JSON, dates avec fuseau. Une note de sortie
// porte aussi les champs des notes hors sortie, vides ; les montants que la plateforme calcule
// pour elle ne sont pas reproduits, compta-club ne les lit pas.
function toApi(report: Report) {
  const api = { ...report, details: JSON.stringify(report.details), dateCreation: withOffset(report.dateCreation) };
  if (!report.sortie) return api;
  return {
    type: 'sortie',
    commission: null,
    objet: null,
    dateDepense: null,
    lienFormation: null,
    motPourResponsable: null,
    ...api,
    sortie: {
      ...report.sortie,
      heureRendezVous: withOffset(report.sortie.heureRendezVous),
      heureRetour: withOffset(report.sortie.heureRetour),
    },
  };
}

// `status=a` ou `status[]=a&status[]=b`, comme API Platform
const valuesOf = (params: URLSearchParams, name: string) => [...params.getAll(name), ...params.getAll(`${name}[]`)];

function filterReports(reports: Report[], params: URLSearchParams): Report[] {
  const event = params.get('event');
  if (event) reports = reports.filter((r) => String(r.sortie?.id) === event);

  // Une valeur inconnue donne une liste vide.
  const statuses = valuesOf(params, 'status');
  if (statuses.length) reports = reports.filter((r) => statuses.includes(r.status));
  const types = valuesOf(params, 'type');
  if (types.length) reports = reports.filter((r) => types.includes(typeOf(r)));

  // La recherche et la date ne portent que sur les notes de sortie : une note hors sortie reste.
  const title = params.get('event.titre')?.toLowerCase();
  if (title) reports = reports.filter((r) => !r.sortie || r.sortie.titre.toLowerCase().includes(title));

  const lastname = params.get('user.lastname')?.toLowerCase();
  if (lastname) reports = reports.filter((r) => r.utilisateur.nom.toLowerCase().includes(lastname));

  const refundRequired = params.get('refundRequired');
  if (refundRequired) reports = reports.filter((r) => String(r.refundRequired) === refundRequired);

  const after = params.get('event.startDate[after]');
  if (after) reports = reports.filter((r) => !r.sortie || r.sortie.heureRendezVous >= after);
  const before = params.get('event.startDate[before]');
  if (before) reports = reports.filter((r) => !r.sortie || r.sortie.heureRendezVous <= before);

  return reports;
}

async function readJson(req: http.IncomingMessage): Promise<any> {
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function send(res: http.ServerResponse, status: number, body?: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

// Erreurs d'API Platform
function problem(res: http.ServerResponse, status: number, detail: string) {
  res.writeHead(status, { 'Content-Type': 'application/problem+json' });
  res.end(JSON.stringify({ type: `/errors/${status}`, title: 'An error occurred', status, detail }));
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/auth') {
    const { email, password } = await readJson(req);
    if (email === E2E_CREDENTIALS.email && password === E2E_CREDENTIALS.password) {
      return send(res, 200, createE2eTokens());
    }
    return send(res, 401, { code: 401, message: 'Invalid credentials.' });
  }

  if (req.method === 'POST' && url.pathname === '/token/refresh') {
    const { refresh_token } = await readJson(req);
    const sid = typeof refresh_token === 'string' && refresh_token.startsWith('refresh.') ? refresh_token.slice(8) : '';
    if (!sid) return send(res, 401, { code: 401, message: 'JWT Refresh Token Not Found' });
    return send(res, 200, createE2eTokens(sid));
  }

  const sid = sessionIdFromAccessToken(req.headers.authorization);
  if (!sid) return send(res, 401, { code: 401, message: 'Invalid JWT Token' });
  const session = getSession(sid);

  if (url.pathname === '/__e2e/received') return send(res, 200, session.received);
  if (req.method === 'POST' && url.pathname === '/__e2e/fail-next-list') {
    session.failNextList = (await readJson(req)).status;
    return send(res, 204);
  }
  if (req.method === 'POST' && url.pathname === '/__e2e/notes-hors-sortie') {
    session.notesHorsSortie = true;
    return send(res, 204);
  }

  if (url.pathname === '/admin/notes-de-frais') {
    if (req.method === 'HEAD') return send(res, 200);

    const reports = filterReports(reportsSeenBy(session).filter(inTreasuryList), url.searchParams);
    if (url.searchParams.get('pagination') === 'false') return send(res, 200, reports.map(toApi));

    if (session.failNextList) {
      const status = session.failNextList;
      session.failNextList = null;
      return problem(res, status, 'Internal Server Error');
    }
    const page = Number(url.searchParams.get('page') ?? '1');
    const perPage = Number(url.searchParams.get('itemsPerPage') ?? '30');
    return send(res, 200, {
      data: reports.slice((page - 1) * perPage, page * perPage).map(toApi),
      meta: { page, perPage, total: reports.length, pages: Math.max(1, Math.ceil(reports.length / perPage)) },
    });
  }

  const patchMatch = url.pathname.match(/^\/notes-de-frais\/(\d+)$/);
  if (req.method === 'PATCH' && patchMatch) {
    const body = await readJson(req);
    session.received.push({ method: 'PATCH', path: url.pathname, body });

    const report = reportsSeenBy(session).find((r) => r.id === Number(patchMatch[1]));
    if (!report) return problem(res, 404, 'Not Found');

    // Un gestionnaire ne décide pas de sa propre note : aucune transition ne lui est permise.
    const isOwner = report.utilisateur.id === MANAGER.id;
    const allowed = isOwner ? [] : MANAGER_TRANSITIONS[report.status] ?? [];
    if (body.status !== report.status && !allowed.includes(body.status)) {
      return problem(res, 422, `status: Invalid status transition from "${report.status}" to "${body.status}".`);
    }

    const change = { status: body.status, commentaireStatut: body.commentaireStatut ?? report.commentaireStatut };
    session.changes.set(report.id, { ...session.changes.get(report.id), ...change });
    return send(res, 200, toApi({ ...report, ...change }));
  }

  return problem(res, 404, `No fake route for ${req.method} ${url.pathname}`);
}

export function startFakeBackend(port: number): Promise<() => Promise<void>> {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      // Réponse déjà partie : on coupe la connexion plutôt que de faire planter tout le run.
      if (res.headersSent) return res.destroy(error);
      problem(res, 500, String(error));
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolve(() => new Promise<void>((done) => server.close(() => done())));
    });
  });
}
