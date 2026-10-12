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

| Statut | Libellé dans compta-club | Sens |
|--------|--------------------------|------|
| `submitted` | Soumis | Note de sortie envoyée ; note hors sortie sans valideur, venue directement à la trésorerie (celle qui attend encore son responsable n'est pas dans la liste) |
| `preapproved` | Validée par le responsable | Note hors sortie validée sur le site par le responsable de sa commission : elle attend la trésorerie. Jamais sur une note de sortie |
| `approved` | Approuvé | Validée par la trésorerie |
| `rejected` | Rejeté | Refusée, par la trésorerie ou, pour une note hors sortie, par son responsable. Une fois corrigée, une note hors sortie repasse par son responsable, s'il y en a un |
| `accounted` | Comptabilisé | Comptabilisée |

Le montant affiché d'une note de sortie est calculé par compta-club ; celui d'une note hors sortie est son `totalDeclare`, figé par la plateforme, avec dessous son `totalRemboursable` quand il est plus bas. La date de soumission d'une note hors sortie est son dernier envoi (`dateEnvoi`).

#### Page d'une note hors sortie

Une note hors sortie (formation, achat) s'ouvre depuis la liste sur sa page, `/note-de-frais/note/{id}` ; une note de sortie se traite sur la page de sa sortie, `/note-de-frais/{idSortie}`. La page lit `GET /notes-de-frais/{id}` et montre les champs de la note hors sortie : `utilisateur`, `type`, `commission`, `objet`, `dateDepense`, `lienFormation` (lien seulement en http ou https), `motPourResponsable`, `validationResponsable`, `lignesAffichees` avec le justificatif de chaque ligne (`piecesJointes`, par `expenseId`), `totalDeclare`, `totalRemboursable`, `avertissements`, `refundRequired`, `libelleComptable`.

- En tête, à côté du titre : le montant à payer (`totalRemboursable`, « À rembourser » ou « Don »), l'écart avec `totalDeclare` (« au-delà des plafonds du club »), le libellé comptable et les actions.
- Refus : le bloc rouge du refus en cours seulement si la note est `rejected` (`derniereDecision`, sinon `commentaireStatut`). Une note refusée puis renvoyée (`derniereDecision` encore un refus, `dateEnvoi` plus récente) garde un rappel neutre : « Refusée par la trésorerie le JJ/MM, corrigée et renvoyée le JJ/MM : « message » ». Un `commentaireStatut` sur une note qui n'est pas refusée n'est jamais montré comme un refus.
- Décisions signées selon `derniereDecision.niveau` : « la trésorerie » (jamais le nom de son compte), ou le nom du responsable de commission. Une note approuvée ou comptabilisée affiche « Approuvée par la trésorerie le … ».
- Une note encore chez son responsable (`submitted` avec des `valideurs`) affiche qui elle attend.
- Une note venue droit à la trésorerie, c'est-à-dire `submitted` sans valideur, ou décidée par la trésorerie (`derniereDecision.niveau`) sans `validationResponsable` (elle ne décide directement que d'une note sans valideur), affiche « Validation du responsable : Aucune : la note va directement à la trésorerie. » (« … est allée … » une fois décidée), et « Directement à la trésorerie » sous son objet dans la liste. La phrase ne dit pas que la commission n'a pas de responsable : le demandeur peut être lui-même le seul responsable de sa commission, et il n'est jamais son propre valideur.

Actions, comme l'API les permet à un gestionnaire :

| Statut de la note | Actions |
|-------------------|---------|
| `preapproved` | Approuver (`approved`), Rejeter (`rejected`, avec un commentaire obligatoire) |
| `submitted` sans `valideurs` | Approuver, Rejeter |
| `submitted` avec des `valideurs` | aucune : la note attend son responsable de commission |
| `approved` | Comptabiliser (`accounted`) |

Une note `approved` ou `accounted` se télécharge aussi en PDF, depuis sa page ou depuis la liste. Le bouton de la page est désactivé pendant l'envoi d'une action.

Une seule action à la fois : pendant l'envoi, les boutons sont désactivés (le hook des actions bloque aussi tout second envoi sur la page d'une sortie). Autour de l'envoi, la page relit la note :

- juste avant : si elle a changé depuis l'affichage (traitée dans un autre onglet), rien ne part. L'API répond 200, sans effet ni mail, à une comptabilisation déjà faite ;
- juste après : « Note approuvée. Un mail a été envoyé à Prénom NOM. » (refusée, comptabilisée) seulement si la note relue a bien le statut demandé ;
- après tout refus de l'API (4xx) : la page montre la note telle qu'elle est.

Une note qui a changé, ou « Cette demande a déjà été traitée. » (422), ouvre la fenêtre d'information « Note déjà traitée » avec le statut relu (« Elle est maintenant : approuvée. ») ; un autre refus de l'API s'affiche tel quel sous le message d'erreur.

#### PDF d'une note hors sortie

Son propre modèle, généré dans le navigateur (jsPDF), celui des notes de sortie ne change pas :

- en-tête : nom du club (`NEXT_PUBLIC_CLUB_NAME`), statut ;
- en tête du document, comme sur la page : « Note n° <id> », « À rembourser : X € » ou « Don : X € », l'écart dû aux plafonds (« Y € déclarés, dont Z € au-delà des plafonds du club ») et le libellé comptable ;
- informations générales : demandeur, type, commission, objet, date de la formation ou de la dépense ;
- dépenses : `lignesAffichees` (libellé, détail comme « 240 km × 0,26 € », montant), puis `totalDeclare` et `totalRemboursable`. Les montants sont ceux figés par la plateforme, jamais recalculés ;
- validation : celle du responsable (ou « Aucune : la note est allée directement à la trésorerie. ») et la décision de la trésorerie.

Les phrases sont celles de la page. Un caractère que les polices du PDF ne savent pas écrire (espace fine des nombres de la plateforme, lettre hors du jeu Windows-1252, émoji) est remplacé, pour que le reste de la ligne reste lisible ; un caractère de format invisible (espace sans largeur, liant, sélecteur de variante) est retiré.

Nom du fichier : `note-de-frais-<achat|formation>-<id>-<NOM>.pdf`, par exemple `note-de-frais-formation-202-PETIT.pdf` ; le nom du demandeur est mis en majuscules sans accents, tout autre caractère devient un tiret (un nom sans lettre latine disparaît), et le nom du fichier est coupé à 80 caractères avant `.pdf`.

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
