# Outil de Compta du Club Alpin de Lyon

Cette application permet aux gestionnaires des notes de frais du Club Alpin de Lyon de les traiter : validation, rejet et comptabilisation. Elle est réservée aux administrateurs et aux gestionnaires des notes de frais.
Les notes de frais sont soumises par les encadrants sur le site web du Club Alpin de Lyon.

> ⚠️ **Note importante** :
> - Cette application s'appuie sur [l'API du site web du Club Alpin de Lyon](https://www.clubalpinlyon.fr/api) pour récupérer les données et gérer l'authentification.
> - Pour plus de détails sur les endpoints et leur usage, consultez la [documentation de l'API](./API.md).

![Capture d'écran de l'application de comptabilité](./capture-compta-club.png)

## **✨ Fonctionnalités principales**

- 👀 Visualisation des notes de frais déposées par les encadrants, avec filtres et recherche.
- ✅ Validation, rejet et comptabilisation des notes de frais par les gestionnaires.
- 📜 Visualisation de l'historique des frais.
- 📄 Export PDF des notes de frais approuvées/comptabilisées.

## **🚀 Prérequis**

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :
- **Node.js** 24.x (fixée dans `engines` du `package.json`, utilisée par Vercel et la CI)
- **pnpm**
- Un accès fonctionnel à l'API backend du site web du Club Alpin de Lyon.

## **⚙️ Installation**

### **💻 En local**

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club.git
   cd compta-club
   ```

2. Installez les dépendances :
   ```bash
   pnpm install
   ```

3. Configurez les variables d'environnement en créant un fichier `.env.local` à la racine du projet à partir de `.env.exemple` :
   ```bash
   cp .env.exemple .env.local
   ```
   
   Puis modifiez `.env.local` selon vos besoins :
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api  # préprod : https://www.clubalpinlyon.top/api
   NEXT_PUBLIC_CLUB_NAME="Nom de votre club"  # Optionnel, par défaut "CLUB ALPIN DE LYON"
   ```

   > 💡 **Astuce :** Assurez-vous que l'API backend est opérationnelle à l'URL spécifiée dans `NEXT_PUBLIC_API_URL`.

4. Lancez le serveur de développement :
   ```bash
   pnpm dev
   ```

5. Accédez à l'application à l'adresse suivante :  
   [http://localhost:3000](http://localhost:3000)

6. Connectez-vous avec un compte administrateur ou gestionnaire des notes de frais du backend utilisé : en local, le compte admin décrit dans la [documentation d'installation du site](https://github.com/Club-Alpin-Lyon-Villeurbanne/plateforme-club-alpin/blob/main/docs/installation.md) ; sur la préprod, votre compte sur [l'environnement de test du site web du Club Alpin de Lyon](https://www.clubalpinlyon.top/).

### **🚀 Déploiement sur Vercel**

Le déploiement se fait sur vercel automatiquement lorsque des modifications sont poussées sur la branche `main`. Vérifiez que le projets build correctement en lancant `pnpm build` et en vérifiant que le build se passe sans erreur.

## **🤝 Contribution**

Nous accueillons volontiers les contributions ! Voici comment vous pouvez aider :

### **📝 Processus de contribution**

1. **Forkez** ce dépôt.
2. Créez une nouvelle branche pour votre fonctionnalité ou correction :
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```
3. Faites vos modifications et testez-les localement.
4. Commitez vos changements avec un message clair :
   ```bash
   git commit -m "Ajout : nouvelle fonctionnalité pour X"
   ```
5. Poussez votre branche vers votre dépôt forké :
   ```bash
   git push origin feature/ma-nouvelle-fonctionnalite
   ```
6. Ouvrez une **pull request** depuis GitHub.

### **📋 Conventions**

- Respectez les bonnes pratiques de code.
- Assurez-vous que vos modifications passent tous les tests existants.
- Suivez les conventions de nommage des branches (`feature/`, `fix/`, etc.).

## **🧪 Tests**

### **Tests unitaires avec Vitest**

```bash
# Lancer les tests unitaires
pnpm test:unit

# Mode watch (relance automatique)
pnpm test:unit:watch
```

Les tests unitaires couvrent :
- Routes API (auth, expense-reports)
- Utilitaires fetch (client/serveur)
- Fonctions d'authentification
- Helpers et store Zustand

### **Tests E2E avec Playwright**

Les tests end-to-end sont implémentés avec Playwright. Ils n'ont besoin ni du backend ni d'identifiants : Playwright construit l'application en mode production, la sert sur le port 3100 et la branche sur un faux backend (`tests/mocks/fake-backend.ts`, données dans `tests/mocks/fixtures.ts`) qui reproduit les formats de l'API de production. Le build écrase `.next` : ne lancez pas `pnpm dev` en même temps.

1. Lancez les tests avec la commande :
   ```bash
   pnpm test:e2e
   ```

2. Pour lancer les tests avec l'interface utilisateur de Playwright :
   ```bash
   pnpm test:e2e:ui
   ```

Les tests E2E vérifient le flux d'authentification et d'autres fonctionnalités principales de l'application.

## **🏗️ Architecture technique**

### **🛠️ Technologies utilisées**
- **Frontend** : Next.js 15 (App Router)
- **Authentification** : JSON Web Tokens (JWT) via cookies httpOnly gérés par des routes API Next.js
- **Backend** : API du site web du Club Alpin de Lyon (https://www.clubalpinlyon.fr/api)
- **State Management** : Zustand
- **Styling** : Tailwind CSS + shadcn/ui
- **PDF Generation** : jsPDF + jspdf-autotable
- **Monitoring** : Sentry (production)

### **📁 Structure du projet**
- `/app` : Code source Next.js (App Router)
  - `/(public)`  : Pages accessibles sans authentification (home, à propos, aide)
  - `/(private)` : Pages protégées (gestion des notes de frais)
  - `/api`     : Routes API internes (auth, expense-reports)
  - `/components` : Composants spécifiques à l'application
  - `/lib`      : Utilitaires partagés (fetchClient, fetchServer, auth, constants)
  - `/store`    : Zustand store (état des filtres & pagination)
  - `/enums`, `/interfaces` : Types TypeScript (ExpenseReport, User, etc.)
  - `/utils`    : Utilitaires (helper, pdfGenerator)
- `/components/ui` : Composants UI réutilisables (tables, formulaires...)  
- `/public`       : Assets statiques (images, favicon, etc.)
- `/tests`        : Tests (unit avec Vitest, E2E avec Playwright)

## **🔧 Scripts disponibles**

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build production |
| `pnpm start` | Serveur production |
| `pnpm lint` | Linter ESLint |
| `pnpm test:unit` | Tests unitaires (Vitest) |
| `pnpm test:e2e` | Tests E2E (Playwright) |

## **🤖 Outils de développement**

- **Claude Code** : Le fichier [CLAUDE.md](./CLAUDE.md) contient les instructions pour utiliser Claude Code sur ce projet.
- **CI/CD** : GitHub Actions exécute lint, tests unitaires et build sur chaque PR.
- **CodeRabbit** : Review automatique des PRs.
- **Vercel** : Déploiement automatique + preview sur chaque PR.

## **📬 Contact**

Pour toute question, suggestion ou problème, vous pouvez :
- 🐛 Ouvrir une issue sur [GitHub](https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club/issues).
- 📧 Contacter l'équipe via [numerique@clubalpinlyon.fr](mailto:numerique@clubalpinlyon.fr).

## **📄 Documentation complémentaire**

- [CLAUDE.md](./CLAUDE.md) - Instructions pour Claude Code
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guide de contribution détaillé
- [API.md](./API.md) - Endpoints API utilisés par cette application