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
| `/notes-de-frais/{id}` | PATCH | Met à jour le statut d'une note (approved, rejected, accounted) |

#### Filtres de la liste

| Paramètre | Utilisé pour |
|-----------|--------------|
| `status` | Une valeur, ou plusieurs : « À valider » envoie `status[]=submitted&status[]=preapproved` |
| `type` | `sortie`, `formation` ou `autre` (achat) |
| `refundRequired` | Don (`false`) ou remboursement (`true`) |
| `user.lastname` | Nom du demandeur |
| `event.titre`, `event.startDate[after]`, `event.startDate[before]` | Recherche et date de la sortie : sans effet sur les notes hors sortie, qui restent dans la liste |

#### Statuts

`submitted` (soumise), `preapproved` (note hors sortie validée par le responsable de sa commission : elle attend la trésorerie), `approved`, `rejected`, `accounted`.

Le montant affiché d'une note de sortie est calculé par compta-club ; celui d'une note hors sortie est son `totalDeclare`, figé par la plateforme.

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
