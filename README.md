# AIME MÉTAMORPHOSE

**Une URL. Une grille. Des transformations. Des preuves.**

MVP expérimental : atelier de décomposition visuelle, catalogue de fragments, grille responsive, diagnostic technique assisté et export JSON.

## État

Le projet démarre en mode démonstration et inclut une API de lecture contrôlée des pages publiques. Les constats automatisés ne constituent pas une certification de conformité ou un avis juridique.

## Démarrage

`npm install && npm run dev`

## Architecture

- `index.html` : point d'entrée de l'atelier
- `public/app.css`, `public/app.js` : interface et composition
- `api/scan.mjs` : analyse serveur des pages publiques
- `docs/SECURITE.md` : limites, sécurité et développement ultérieur

Les analyses de sites tiers doivent être effectuées dans un périmètre autorisé. Toute proposition de correction nécessite une validation avant publication.
