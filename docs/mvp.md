# MVP — HBntory

Contexte : équipe de 2 personnes, 12 jours de projet.

Notre MVP contient toutes les exigences obligatoires du sujet, et rien de plus.
Le principal risque identifié est une intégration ratée en fin de projet :
des composants qui fonctionnent seuls mais ne communiquent pas entre eux.
Nous commençons donc par une **tranche verticale** : faire traverser tous les
composants par un cas simple, avant de compléter chaque composant.

Règle de tri :
- **D'abord** : obligatoire, et nécessaire au fonctionnement des autres composants.
- **Plus tard** : obligatoire, mais aucun autre composant n'en dépend.
- **Si on a le temps** : non demandé par le sujet.
- **Hors périmètre** : explicitement exclu par le sujet.

---

## 1. D'abord — le squelette qui traverse tout le système

**Infrastructure**
- `docker-compose.yml` qui lance : base PostgreSQL, API Produits, Backoffice,
  serveur MCP, service IA.

**Base de données (Tâche 1)**
- Tables `users`, `branches`, `stock` (agence + identifiant produit + quantité).
- Aucune donnée produit stockée localement.
- Script d'initialisation : un admin (mot de passe haché), deux agences,
  du stock d'exemple.
- Règles : quantité jamais négative, quantités entières positives.

**Backoffice**
- Connexion avec mot de passe haché et session.
- Vérification du rôle et de l'agence côté serveur.
- Utilisateur commun : consulter, ajouter et retirer du stock dans son agence.

**Côté public**
- Serveur MCP avec les outils `list_products` et `get_product` (API Produits).
- Un premier outil de stock en lecture seule (stock d'un produit par agence).
- Service IA : une route REST qui reçoit une question et renvoie la réponse de l'agent.
- Client web : une page avec un champ de texte, un bouton et la zone de réponse.

**Objectif de fin de phase :** la question « Quelle agence a le produit 15 ? »
traverse Client web, Service IA, serveur MCP, API Produits et base de données,
et reçoit une réponse correcte.

---

## 2. Plus tard — le reste des obligations

**Backoffice : utilisateur commun**
- Lister les produits en stock de son agence, avec leurs noms récupérés
  depuis l'API Produits.
- Vérifier que l'identifiant produit existe dans l'API avant un ajout de stock.

**Backoffice : admin**
- Lister les utilisateurs.
- Créer un utilisateur commun et l'assigner à une agence.
- Modifier un utilisateur.
- Changer le mot de passe d'un utilisateur.
- Changer l'agence d'un utilisateur.
- Suppression douce (soft-delete) d'un utilisateur.
- Interdire à l'admin toute action sur le stock.

**Service IA**
- Outil MCP « produits disponibles dans une agence ».
- Questions à plusieurs produits (« 3 unités de X, 2 de Y, 4 de Z : quelle agence ? »).
- Réponse « information indisponible » quand les outils ne renvoient rien,
  sans invention.

**Finalisation**
- Tests, README et documentation (Tâche 8).
- Préparation de la présentation (Tâche 9).

---

## 3. Si on a le temps — non demandé par le sujet

- Affichage progressif de la réponse (streaming), voir décision 2.
- Interface plus soignée (CSS travaillé).
- Historique de conversation sur la page publique.
- Recherche ou filtres dans les listes du Backoffice.

---

## 4. Hors périmètre — exclu par le sujet

- Création d'autres administrateurs.
- HTTPS / TLS.
- Gestion du stock par l'admin (interdite par le sujet).
