# AIME MÉTAMORPHOSE — Sécurité et périmètre V0.1

## Réalisé
- Champ Point Zéro pour une URL HTTPS publique.
- Scanner serveur du HTML initial de 1 à 5 pages sur une même origine (3 par défaut).
- Fragments issus des sections HTML, titres, images déclarées et métadonnées.
- Contrôles indicatifs : langue déclarée, H1, attributs alt, liens mentions/CGV/confidentialité, marqueur de cookies.
- Grille réorganisable, agrandissement, verrous, recadrage des images et notes.
- Trois modes de mise en page, trois palettes, aperçu iframe ou lien externe.
- Persistance locale et export JSON.

## Non encore réalisé
- Capture pixel-à-pixel ou scanner après exécution JavaScript.
- Audit juridique RGPD/e-commerce, consentement réel, contrôle complet d'accessibilité.
- Correction d'un site tiers, déploiement de code, connexion GitHub pour les patches.
- Authentification, base de données, preuves certifiées, workflow avocat, impression PDF.
- Découpes booléennes et coins polygonaux.

## Règles de prudence
Les niveaux P1 et P2 sont des priorités de revue : ils ne constituent pas une qualification juridique. L'absence de détection n'atteste jamais la conformité. Un lien non détecté dans le HTML initial peut exister dans la version rendue.

Le scanner doit être réservé aux sites sur lesquels le demandeur dispose de droits ou d'une autorisation d'audit.

## Sécurité
- HTTPS uniquement, résolution DNS préalable, rejet d'adresses privées/réservées courantes et des IP littérales, connexion DNS épinglée.
- Redirections limitées à la même origine.
- Maximum 5 pages, 1,5 Mo/page, timeout de 8,5 secondes/requête.
- Aucun paiement ni connexion à des sessions utilisateur.

Avant lancement public/commercial : durcir les listes IANA d'IP interdites et le filtrage egress, implémenter quotas par utilisateur/domaine, limitation de débit, file d'attente, consentement au scan, politique de conservation et isolation du navigateur automatisé. Un scanner exposé sans ces mesures serait vulnérable aux abus.

## Local
Installer Node 20+, exécuter npm install puis npm run dev, ouvrir http://127.0.0.1:5173.

## Vercel
Projet Other / output directory public ; API Serverless dans api/scan.mjs ; vercel.json inclus.

## Suite
Moteur de captures Playwright, opérations de découpe, stockage projet, revues humaines/juridiques et propositions de PR GitHub.