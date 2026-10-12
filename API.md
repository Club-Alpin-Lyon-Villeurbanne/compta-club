# Documentation API

## Référence complète

La documentation complète de l'API de la plateforme Club Alpin Lyon se trouve dans le repo principal :

👉 **[Documentation API complète](https://github.com/Club-Alpin-Lyon-Villeurbanne/plateforme-club-alpin/blob/main/docs/api.md)**

## Endpoints utilisés par Compta Club

Cette application utilise uniquement les endpoints suivants de l'API backend :

### Authentification

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth` | POST | Authentification utilisateur (email/password → JWT + refresh token) |
| `/token/refresh` | POST | Renouvellement du JWT via refresh token |

### Notes de frais

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/admin/notes-de-frais` | GET | Liste les notes de frais (admins et gestionnaires des notes de frais) : les notes de sortie, et les notes hors sortie (formation, achat) qui attendent la trésorerie ou qu'elle a traitées. Un `HEAD` sur cet endpoint sert aussi à vérifier la connexion |
| `/notes-de-frais/{id}` | GET | Lit une note par son identifiant : la page d'une note hors sortie |
| `/notes-de-frais/{id}` | PATCH | Met à jour le statut d'une note (approved, rejected, accounted) |

#### Filtres de la liste

| Paramètre | Utilisé pour |
|-----------|--------------|
| `status` | Une valeur, ou plusieurs : « À valider » envoie `status[]=submitted&status[]=preapproved` |
| `type` | `sortie`, `formation` ou `autre` (achat) |
| `refundRequired` | Don (`false`) ou remboursement (`true`) |
| `user.lastname` | Nom du demandeur |
| `event.titre`, `event.startDate[after]`, `event.startDate[before]` | Recherche et date de la sortie. L'API laisse alors les notes hors sortie dans la liste : compta-club demande aussi `type=sortie`, et désactive recherche et date pour les formations et les achats |

#### Statuts

`submitted` (soumise), `preapproved` (note hors sortie validée par le responsable de sa commission : elle attend la trésorerie), `approved`, `rejected`, `accounted`.

Le montant affiché d'une note de sortie est calculé par compta-club ; celui d'une note hors sortie est son `totalDeclare`, figé par la plateforme, avec dessous son `totalRemboursable` quand il est plus bas. La date de soumission d'une note hors sortie est son dernier envoi (`dateEnvoi`).

#### Page d'une note hors sortie

Une note hors sortie (formation, achat) s'ouvre depuis la liste sur sa page, `/note-de-frais/note/{id}` ; une note de sortie se traite sur la page de sa sortie, `/note-de-frais/{idSortie}`. La page lit `GET /notes-de-frais/{id}` et montre les champs de la note hors sortie : `utilisateur`, `type`, `commission`, `objet`, `dateDepense`, `lienFormation` (lien seulement en http ou https), `motPourResponsable`, `validationResponsable`, `lignesAffichees` avec le justificatif de chaque ligne (`piecesJointes`, par `expenseId`), `totalDeclare`, `totalRemboursable`, `avertissements`, `refundRequired`, `libelleComptable`.

- En tête, à côté du titre : le montant à payer (`totalRemboursable`, « À rembourser » ou « Don »), l'écart avec `totalDeclare` (« au-delà des plafonds du club »), le libellé comptable et les actions.
- Refus : le bloc rouge du refus en cours seulement si la note est `rejected` (`derniereDecision`, sinon `commentaireStatut`). Une note refusée puis renvoyée (`derniereDecision` encore un refus, `dateEnvoi` plus récente) garde un rappel neutre : « Refusée par la trésorerie le JJ/MM, corrigée et renvoyée le JJ/MM : « message » ». Un `commentaireStatut` sur une note qui n'est pas refusée n'est jamais montré comme un refus.
- Décisions signées selon `derniereDecision.niveau` : « la trésorerie » (jamais le nom de son compte), ou le nom du responsable de commission. Une note approuvée ou comptabilisée affiche « Approuvée par la trésorerie le … ».
- Une note encore chez son responsable (`submitted` avec des `valideurs`) affiche qui elle attend ; une note `submitted` sans valideur, que sa commission n'a pas de responsable.

Actions, comme l'API les permet à un gestionnaire :

| Statut de la note | Actions |
|-------------------|---------|
| `preapproved` | Approuver (`approved`), Rejeter (`rejected`, avec un commentaire obligatoire) |
| `submitted` sans `valideurs` | Approuver, Rejeter |
| `submitted` avec des `valideurs` | aucune : la note attend son responsable de commission |
| `approved` | Comptabiliser (`accounted`) |

Une seule action à la fois : pendant l'envoi, les boutons sont désactivés (le hook des actions bloque aussi tout second envoi sur la page d'une sortie). Après une action réussie, la page relit la note et annonce « Note approuvée. Prénom NOM a été prévenu par mail. » (refusée, comptabilisée). « Cette demande a déjà été traitée. » (422, note décidée entre-temps) fait relire la note et ouvre la fenêtre d'information « Note déjà traitée », avec son nouveau statut ; un autre refus de l'API s'affiche tel quel sous le message d'erreur.

## Routes internes

Le navigateur n'appelle que les routes de compta-club, derrière la session (cookie httpOnly) ; elles appellent l'API avec le jeton de la session.

| Route | Méthode | Appel à l'API |
|-------|---------|---------------|
| `/api/expense-reports` | GET | `GET /admin/notes-de-frais`, avec les paramètres reçus |
| `/api/expense-reports/{idSortie}` | GET | `GET /admin/notes-de-frais?event={idSortie}&pagination=false` : les notes d'une sortie |
| `/api/expense-reports/{id}` | PATCH | `PATCH /notes-de-frais/{id}`, avec `status` et `commentaireStatut` |
| `/api/expense-reports/note/{id}` | GET | `GET /notes-de-frais/{id}` |

- L'identifiant d'une note (`PATCH /api/expense-reports/{id}`, `GET /api/expense-reports/note/{id}`) doit être un entier positif : sinon 400 « Identifiant de note invalide », sans appel à l'API.
- Une erreur garde le statut de l'API et renvoie `{ "error": "…" }`, jamais la trace ni le détail technique.
  - `PATCH /api/expense-reports/{id}` est la seule route qui transmet le message de l'API : pour un refus (4xx), les messages des `violations`, sinon `detail` ; pour une erreur serveur, un message générique.
  - `GET /api/expense-reports/note/{id}` a ses propres messages : « Note de frais introuvable » pour un 404, un message générique sinon. La page montre « Cette adresse ne correspond à aucune note de frais. » pour un identifiant invalide ou inconnu.

## Architecture

```
Client (Browser)
    │
    ▼
Next.js API Routes (/api/*)
    │
    ▼
Backend Symfony (clubalpinlyon.fr/api)
```

Les tokens JWT sont stockés dans des cookies httpOnly par les routes API Next.js.
Le client n'a jamais accès directement aux tokens.

## Configuration

L'URL de l'API backend est configurée via la variable d'environnement :

```env
NEXT_PUBLIC_API_URL=https://www.clubalpinlyon.fr/api
```

| Environnement | URL de l'API |
|---------------|--------------|
| Production | `https://www.clubalpinlyon.fr/api` |
| Préprod | `https://www.clubalpinlyon.top/api` |
| Local | `http://localhost:8000/api` |
