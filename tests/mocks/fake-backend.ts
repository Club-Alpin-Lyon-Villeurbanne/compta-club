/**
 * Faux backend Symfony pour les tests E2E.
 *
 * Next.js appelle l'API côté serveur (vérification de session dans le layout privé,
 * routes /api/*) : ces appels ne passent pas par le navigateur, donc page.route() ne
 * peut pas les intercepter. Playwright lance ce serveur et Next.js pointe dessus via
 * NEXT_PUBLIC_API_URL.
 *
 * Le serveur est sans état : un PATCH renvoie la note modifiée sans la sauvegarder,
 * pour que les tests lancés en parallèle ne se gênent pas.
 */

import http from 'node:http';
import { mockAuthResponse, mockExpenseReports, mockRefreshResponse } from './fixtures';

export const E2E_CREDENTIALS = { email: 'admin@clubalpinlyon.top', password: 'admin123' };

const VALID_TOKENS = new Set([mockAuthResponse.token, mockRefreshResponse.token]);

// Assez de notes comptabilisées pour avoir plusieurs pages (le front demande 30 notes par page).
const archivedReports = Array.from({ length: 31 }, (_, i) => ({
  ...mockExpenseReports[3],
  id: 1000 + i,
  sortie: { ...mockExpenseReports[3].sortie, id: 1000 + i, titre: `Sortie archivée ${i + 1}` },
}));

const allReports = [...mockExpenseReports, ...archivedReports];

type Report = (typeof allReports)[number];

function filterReports(params: URLSearchParams): Report[] {
  let reports = allReports;

  const event = params.get('event');
  if (event) reports = reports.filter((r) => String(r.sortie.id) === event);

  const status = params.get('status');
  if (status) reports = reports.filter((r) => r.status === status);

  const title = params.get('event.titre')?.toLowerCase();
  if (title) reports = reports.filter((r) => r.sortie.titre.toLowerCase().includes(title));

  const lastname = params.get('user.lastname')?.toLowerCase();
  if (lastname) reports = reports.filter((r) => r.utilisateur.nom.toLowerCase().includes(lastname));

  const refundRequired = params.get('refundRequired');
  if (refundRequired) reports = reports.filter((r) => String(r.refundRequired) === refundRequired);

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

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const isAuthorized = VALID_TOKENS.has((req.headers.authorization ?? '').replace('Bearer ', ''));

  if (req.method === 'POST' && url.pathname === '/auth') {
    const { email, password } = await readJson(req);
    if (email === E2E_CREDENTIALS.email && password === E2E_CREDENTIALS.password) {
      return send(res, 200, mockAuthResponse);
    }
    return send(res, 401, { message: 'Invalid credentials.' });
  }

  if (req.method === 'POST' && url.pathname === '/token/refresh') {
    const { refresh_token } = await readJson(req);
    if (refresh_token === mockAuthResponse.refresh_token) return send(res, 200, mockRefreshResponse);
    return send(res, 401, { message: 'Invalid refresh token.' });
  }

  if (url.pathname === '/admin/notes-de-frais') {
    if (!isAuthorized) return send(res, 401, { message: 'JWT Token not found' });
    if (req.method === 'HEAD') return send(res, 200);

    const reports = filterReports(url.searchParams);
    if (url.searchParams.get('pagination') === 'false') return send(res, 200, { data: reports });

    const page = Number(url.searchParams.get('page') ?? '1');
    const perPage = Number(url.searchParams.get('itemsPerPage') ?? '30');
    return send(res, 200, {
      data: reports.slice((page - 1) * perPage, page * perPage),
      meta: { page, perPage, total: reports.length, pages: Math.max(1, Math.ceil(reports.length / perPage)) },
    });
  }

  const patchMatch = url.pathname.match(/^\/notes-de-frais\/(\d+)$/);
  if (req.method === 'PATCH' && patchMatch) {
    if (!isAuthorized) return send(res, 401, { message: 'JWT Token not found' });
    const report = allReports.find((r) => r.id === Number(patchMatch[1]));
    if (!report) return send(res, 404, { detail: 'Not Found' });
    return send(res, 200, { ...report, ...(await readJson(req)) });
  }

  return send(res, 404, { detail: `No fake route for ${req.method} ${url.pathname}` });
}

export function startFakeBackend(port: number): Promise<() => Promise<void>> {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => send(res, 500, { detail: String(error) }));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(() => new Promise<void>((done) => server.close(() => done())));
    });
  });
}
