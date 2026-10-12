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

Une note hors sortie (formation, achat) s'ouvre depuis la liste sur sa page, `/note-de-frais/note/{id}` ; une note de sortie se traite sur la page de sa sortie, `/note-de-frais/{idSortie}`. La page lit `GET /notes-de-frais/{id}` et montre les champs de la note hors sortie : `utilisateur`, `type`, `commission`, `objet`, `dateDepense`, `lienFormation` (lien seulement en http ou https), `motPourResponsable`, `validationResponsable`, `lignesAffichees` avec le justificatif de chaque ligne (`piecesJointes`, par `expenseId`), `totalDeclare`, `totalRemboursable`, `avertissements`, `refundRequired`, `libelleComptable`, et le dernier refus (`derniereDecision` quand elle est un refus, sinon `commentaireStatut`).

Actions, comme l'API les permet à un gestionnaire :

| Statut de la note | Actions |
|-------------------|---------|
| `preapproved` | Approuver (`approved`), Rejeter (`rejected`, avec un commentaire obligatoire) |
| `submitted` sans `valideurs` | Approuver, Rejeter |
| `submitted` avec des `valideurs` | aucune : la note attend son responsable de commission |
| `approved` | Comptabiliser (`accounted`) |

Après une action, la page relit la note. Un refus de l'API (422, par exemple « Cette demande a déjà été traitée. » quand la note a été décidée entre-temps) s'affiche tel quel, puis la page relit la note.

## Routes internes

Le navigateur n'appelle que les routes de compta-club, derrière la session (cookie httpOnly) ; elles appellent l'API avec le jeton de la session.

| Route | Méthode | Appel à l'API |
|-------|---------|---------------|
| `/api/expense-reports` | GET | `GET /admin/notes-de-frais`, avec les paramètres reçus |
| `/api/expense-reports/{idSortie}` | GET | `GET /admin/notes-de-frais?event={idSortie}&pagination=false` : les notes d'une sortie |
| `/api/expense-reports/{id}` | PATCH | `PATCH /notes-de-frais/{id}`, avec `status` et `commentaireStatut` |
| `/api/expense-reports/note/{id}` | GET | `GET /notes-de-frais/{id}` |

- L'identifiant d'une note (`PATCH /api/expense-reports/{id}`, `GET /api/expense-reports/note/{id}`) doit être un entier positif : sinon 400 « Identifiant de note invalide », sans appel à l'API.
- Une erreur garde le statut de l'API et renvoie `{ "error": "…" }`. Pour un refus (4xx), le message est celui de l'API : les messages des `violations`, sinon `detail`. Pour une erreur serveur, un message générique : jamais la trace ni le détail technique. `GET /api/expense-reports/note/{id}` répond « Note de frais introuvable » à un 404.

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
