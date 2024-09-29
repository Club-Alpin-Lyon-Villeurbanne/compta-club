# Outil de compta du Club Alpin de Lyon

Cette application est un outil de gestion des notes de frais de l'association Club Alpin de Lyon.



## Démarrage

1. Clonez ce repo:
`git clone https://github.com/Club-Alpin-Lyon-Villeurbanne/compta-club.git`
2. Installez les dépendances:
`npm install`
3. Créez un fichier `.env` à la racine du projet avec les variables d'environnement suivantes:
```
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000/api
NEXTAUTH_URL=http://locahost:3000
NEXTAUTH_SECRET=topsecret
NEXT_PUBLIC_WEBSITE_BASE_URL=https://www.clubalpinlyon.top
```
4. Lancez le serveur de développement:
`npm run dev`
5. Accédez à l'application à l'adresse suivante: http://localhost:3000
