# Guide de contribution

Merci de votre intérêt pour contribuer à Compta Club !

## Prérequis

- Node.js 20+
- pnpm 9+
- Un compte GitHub

## Mise en place

```bash
# Fork le repo sur GitHub, puis :
git clone https://github.com/VOTRE-USERNAME/compta-club.git
cd compta-club
pnpm install
```

## Workflow de développement

### 1. Créer une branche

```bash
git checkout main
git pull origin main
git checkout -b type/description-courte
```

**Conventions de nommage des branches :**
- `feature/` - Nouvelle fonctionnalité
- `fix/` - Correction de bug
- `refactor/` - Refactoring sans changement fonctionnel
- `docs/` - Documentation
- `test/` - Ajout/modification de tests
- `chore/` - Maintenance (dépendances, CI, etc.)

### 2. Développer

```bash
# Lancer le serveur de dev
pnpm dev

# Vérifier le linting
pnpm lint

# Lancer les tests unitaires
pnpm test:unit

# Vérifier que le build passe
pnpm build
```

### 3. Commiter

Utilisez des messages de commit clairs et descriptifs :

```
type: description courte

Corps optionnel avec plus de détails.
```

**Types de commit :**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `refactor` - Refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
- `perf` - Optimisation de performance
- `ci` - CI/CD

**Exemples :**
```
feat: add PDF export for approved expenses
fix: resolve token refresh race condition
docs: update README with test instructions
```

### 4. Pousser et créer une PR

```bash
git push origin votre-branche
```

Puis créez une Pull Request sur GitHub.

## Processus de review

La branche `main` est protégée : les push directs sont interdits. Toutes les modifications passent par une PR.

**Ce qui se passe automatiquement sur chaque PR :**

1. **GitHub Actions CI** - Exécute lint, tests unitaires et build
2. **CodeRabbit** - Review automatique du code par IA (suggestions, bugs potentiels, style)
3. **Vercel** - Déploie une preview de la PR pour tester visuellement

**Pour merger une PR :**
- La CI doit passer (lint + tests + build)
- Adresser les commentaires CodeRabbit pertinents
- Au moins une approbation d'un mainteneur (si applicable)

## Checklist avant PR

- [ ] Le code compile (`pnpm build`)
- [ ] Le linter passe (`pnpm lint`)
- [ ] Les tests passent (`pnpm test:unit`)
- [ ] Les nouveaux fichiers ont des tests si applicable
- [ ] La PR a une description claire

## Structure du code

```
app/
├── (public)/          # Pages sans auth
├── (private)/         # Pages avec auth
├── api/               # Routes API Next.js
│   ├── auth/          # Login, logout, check
│   └── expense-reports/
├── components/        # Composants React
├── lib/               # Utilitaires
│   ├── fetchClient.ts # Fetch côté client (avec retry 401)
│   ├── fetchServer.ts # Fetch côté serveur
│   ├── auth.client.ts # Auth côté client
│   └── auth.server.ts # Auth côté serveur
├── store/             # Zustand store
└── utils/             # Helpers (formatage, calculs, PDF)

tests/
├── unit/              # Tests Vitest
│   ├── api/           # Tests des routes API
│   ├── lib/           # Tests des utilitaires
│   └── helpers/       # Helpers de test
└── e2e/               # Tests Playwright
```

## Conventions de code

### TypeScript
- Utiliser des types explicites pour les props et retours de fonction
- Éviter `any`, préférer `unknown` si nécessaire

### React
- Server Components par défaut
- Client Components uniquement si nécessaire (interactivité, hooks)
- Utiliser `React.memo` pour les composants dans des listes

### CSS
- Tailwind CSS uniquement
- Pas de CSS custom sauf cas exceptionnel

### Tests
- Un fichier de test par module (`module.test.ts`)
- Nommer les tests clairement : `it('returns 401 when token is expired')`
- Mocker les dépendances externes (fetch, cookies)

## Flow d'authentification

```
Client                    Next.js API                   Backend Symfony
  │                           │                                │
  │─── POST /api/auth/login ──│                                │
  │                           │─── POST /auth ─────────────────│
  │                           │←── {token, refresh} ───────────│
  │←── Set-Cookie (httpOnly) ─│                                │
  │                           │                                │
  │─── GET /api/expense-reports                                │
  │    (avec cookie)          │─── GET /admin/notes-de-frais ──│
  │                           │    (Bearer token)              │
```

## Besoin d'aide ?

- Ouvrez une issue sur GitHub
- Consultez le [CLAUDE.md](./CLAUDE.md) pour utiliser Claude Code
- Contactez [numerique@clubalpinlyon.fr](mailto:numerique@clubalpinlyon.fr)
