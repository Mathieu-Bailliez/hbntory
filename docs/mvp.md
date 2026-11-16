# MVP — HBntory

Le MVP (Minimum Viable Product) couvre toutes les exigences obligatoires du sujet, sans fonctionnalité superflue.
Les sections 1 et 2 sont obligatoires et indiquent l'ordre de réalisation. La section 3 est optionnelle.

---

## 1. Ce que nous implémentons en premier

*Objectif : un système qui fonctionne de bout en bout, même de façon minimale.*

- **Infrastructure :** Docker Compose qui lance la base de données et la Product API.
- **Base de données :** tables des utilisateurs, des branches et du stock (branche, identifiant produit, quantité).
- **Backoffice — connexion :** authentification avec mot de passe haché, distinction entre l'admin et les utilisateurs communs.
- **Backoffice — stock :** un utilisateur commun consulte, ajoute et retire du stock dans sa branche.
- **Product MCP Server :** deux outils, lister les produits et obtenir le détail d'un produit.
- **AI Query Service :** un agent qui répond à une question simple sur un produit.
- **Client Web Interface :** une page avec un champ de question ; la réponse arrive en un seul message par WebSocket.

## 2. Ce que nous laissons pour plus tard

*Obligatoire, mais réalisé une fois le socle de la section 1 en place.*

- **Admin :** lister, créer, modifier et supprimer (soft delete) les utilisateurs ; changer leur mot de passe et leur branche.
- **Règles de sécurité :** un utilisateur commun ne peut pas agir sur une autre branche ; l'admin ne gère pas le stock ; ces règles sont vérifiées côté serveur.
- **Validation du stock :** la quantité demandée est vérifiée et le stock ne devient jamais négatif.
- **Stock pour l'agent :** l'agent accède aux quantités en stock pour répondre aux questions sur les branches.
- **Questions complexes :** plusieurs produits et plusieurs branches dans une même question.
- **Fiabilité des réponses :** l'agent indique clairement quand l'information est indisponible, au lieu d'inventer.
- **Streaming :** affichage progressif de la réponse. Ce n'est pas une exigence du sujet, mais un engagement de l'équipe : il justifie le choix de WebSocket (voir `decisions.md`, décision 2).
- **Finalisation :** tests, README et documentation.

## 3. Ce que nous tenterons seulement si le temps le permet

*Non demandé par le sujet. Aucun de ces points ne retarde les sections 1 et 2.*

- Historique des mouvements de stock.
- Recherche et filtres dans la liste du stock.
- Mise en forme soignée des interfaces.
- Historique de conversation dans le chat.
