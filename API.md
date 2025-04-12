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

```json
{
  "hydra:member": [
    {
      "id": 1,
      "title": "Titre de la note de frais",
      "status": "draft",
      "createdAt": "2024-03-15T10:00:00+00:00",
      "updatedAt": "2024-03-15T10:00:00+00:00"
    }
  ],
  "hydra:totalItems": 1
}
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
- Les refresh tokens sont valides plus longtemps
- Toutes les requêtes doivent être effectuées en HTTPS
- Les tokens sont stockés dans des cookies httpOnly

## Bonnes pratiques

1. Toujours vérifier le statut de la réponse HTTP
2. Gérer les erreurs d'authentification (401) en redirigeant vers la page de login
3. Utiliser le refresh token quand le token JWT expire
4. Ne jamais stocker les tokens en clair côté client
5. Toujours utiliser HTTPS pour les requêtes 