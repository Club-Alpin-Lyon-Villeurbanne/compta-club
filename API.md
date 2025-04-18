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
curl -X GET https://www.clubalpinlyon.top/api/expense-reports \
  -H "Authorization: Bearer votre_token_jwt"
```

## Notes de frais

### Liste des notes de frais

Récupère la liste des notes de frais de l'utilisateur connecté.

```bash
curl -X GET https://www.clubalpinlyon.top/api/expense-reports \
  -H "Authorization: Bearer votre_token_jwt"
```

#### Réponse réussie (200)

Retourne un tableau d'objets `ExpenseReport` contenant toutes les informations de chaque note de frais :

```json
[
  {
    "id": 1,
    "status": "submitted",
    "refundRequired": true,
    "user": { "id": 12, "firstname": "Jean", "lastname": "Dupont" },
    "event": {
      "id": 5,
      "commission": { "id": 2, "name": "Escalade" },
      "tsp": "2024-03-15T10:00:00+00:00",
      "tspEnd": "2024-03-16T18:00:00+00:00",
      "titre": "Stage escalade printemps",
      "code": "ESC-2024-01",
      "rdv": "Lyon",
      "participationsCount": 10,
      "status": 1,
      "statusLegal": 1
    },
    "createdAt": "2024-03-17T14:23:00+00:00",
    "statusComment": null,
    "details": {
      "transport": { "type": "train", "ticketPrice": 50 },
      "accommodations": [],
      "others": []
    },
    "attachments": []
  }
]
```

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