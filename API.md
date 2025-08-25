# Documentation de l'API Compta Club

## Configuration

L'API est accessible à l'URL : `https://www.clubalpinlyon.top/api`

## Authentification

L'API utilise un système d'authentification basé sur JWT (JSON Web Tokens) avec refresh token.

### Login

Authentifie un utilisateur et retourne un token JWT et un refresh token.

```bash
curl -X POST https://www.clubalpinlyon.top/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "votre_mot_de_passe"
  }'
```

#### Réponse réussie (200)

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "fe6bebe54c503f2775951f38b20661030358b685bb353f94b697aaa7d929fcd822da76fc2278c21b758c60c08a0782ff59a28b0666c252192e7661781fca52e7"
}
```

#### Réponse d'erreur (401)

```json
{
  "error": "Identifiants invalides"
}
```

### Refresh Token

Permet de rafraîchir un token JWT expiré en échangeant un refresh_token.

```bash
curl -X POST https://www.clubalpinlyon.top/api/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "votre_refresh_token"
  }'
```

#### Réponse attendue (200)

```json
{
  "token": "nouveau_token_jwt",
  "refresh_token": "nouveau_refresh_token"
}
```

### Utilisation des tokens

Pour les requêtes authentifiées, incluez le token JWT dans le header `Authorization` :

```bash
curl -X GET https://www.clubalpinlyon.top/api/notes-de-frais \
  -H "Authorization: Bearer votre_token_jwt"
```

## Notes de frais

### Liste des notes de frais

Récupère la liste des notes de frais de l'utilisateur connecté.

```bash
curl -X GET https://www.clubalpinlyon.top/api/notes-de-frais \
  -H "Authorization: Bearer votre_token_jwt"
```

#### Réponse réussie (200)

**Note importante** : L'API retourne maintenant les données dans un format structuré avec pagination :

```json
{
  "data": [
    {
  {
    "id": 1,
    "status": "submitted",
    "refundRequired": true,
    "utilisateur": { "id": 12, "prenom": "Jean", "nom": "Dupont" },
    "sortie": {
      "id": 5,
      "commission": { "id": 2, "name": "Escalade" },
      "dateDebut": "2024-03-15T10:00:00+00:00",
      "dateFin": "2024-03-16T18:00:00+00:00",
      "titre": "Stage escalade printemps",
      "code": "ESC-2024-01",
      "lieuRendezVous": "Lyon",
      "participationsCount": 10,
      "status": 1,
      "statusLegal": 1
    },
    "dateCreation": "2024-03-17T14:23:00+00:00",
    "commentaireStatut": null,
    "details": {
      "transport": { "type": "train", "ticketPrice": 50 },
      "accommodations": [],
      "others": []
    },
      "piecesJointes": []
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 10,
    "pages": 1
  }
}
```

### Mise à jour du statut d'une note de frais

Permet de mettre à jour le statut d'une note de frais spécifique (ex : approuver, rejeter, comptabiliser, etc.).

#### Endpoint

```http
PATCH https://www.clubalpinlyon.top/api/notes-de-frais/{id}
```

- Remplacez `{id}` par l'identifiant de la note de frais à mettre à jour.
- Le champ `status` peut prendre différentes valeurs selon la logique métier (ex : `approved`, `rejected`, `accounted`).
- Pour le rejet (`rejected`), le champ `statusComment` est requis.

#### Exemple : Approuver une note de frais

```bash
curl -X PATCH https://www.clubalpinlyon.top/api/notes-de-frais/1 \
  -H "Authorization: Bearer votre_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

#### Exemple : Rejeter une note de frais

```bash
curl -X PATCH https://www.clubalpinlyon.top/api/notes-de-frais/1 \
  -H "Authorization: Bearer votre_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "commentaireStatut": "Justificatif manquant"
  }'
```

#### Body attendu

- Pour approuver ou comptabiliser :

```json
{
  "status": "approved"
}
```

- Pour rejeter :

```json
{
  "status": "rejected",
  "statusComment": "Motif du rejet obligatoire"
}
```

#### Réponse réussie (200)

Retourne l'objet `ExpenseReport` mis à jour :

```json
{
  "id": 1,
  "status": "approved",
  // ... autres champs comme dans la réponse de la liste
}
```

#### Réponse d'erreur (400, 401, 403, 404)

```json
{
  "error": "Statut ou commentaire invalide, ou accès non autorisé"
}
```

#### Codes HTTP
- 200 : Succès, note de frais mise à jour
- 400 : Statut ou commentaire fourni invalide
- 401 : Non authentifié
- 403 : Non autorisé à modifier cette note de frais
- 404 : Note de frais non trouvée

## Gestion des erreurs

L'API utilise les codes HTTP standards :

- 200 : Succès
- 401 : Non authentifié
- 403 : Non autorisé
- 404 : Ressource non trouvée
- 500 : Erreur serveur

## Format des dates

Les dates sont au format ISO 8601 : `YYYY-MM-DDTHH:mm:ss+00:00`

## Sécurité

- Les tokens JWT expirent après 1 heure
- Les refresh tokens sont valides 5 jours (https://github.com/Club-Alpin-Lyon-Villeurbanne/caflyon/blob/173280da6f8296279165709f1ace69e2d74ca1aa/config/packages/gesdinet_jwt_refresh_token.yaml#L3)
- Toutes les requêtes doivent être effectuées en HTTPS
- Les tokens sont stockés dans des cookies httpOnly

## Bonnes pratiques

1. Toujours vérifier le statut de la réponse HTTP
2. Gérer les erreurs d'authentification (401) en redirigeant vers la page de login
3. Utiliser le refresh token quand le token JWT expire
4. Ne jamais stocker les tokens en clair côté client
5. Toujours utiliser HTTPS pour les requêtes 