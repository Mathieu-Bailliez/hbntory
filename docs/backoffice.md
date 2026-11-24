# Backoffice : approche interface et serveur

## 1. Approche : Server-Side Rendering (SSR)

On utilise le SSR avec Flask et Jinja : le serveur fabrique la page HTML complète avec les vraies données (`render_template`), puis l'envoie au navigateur, qui ne fait que l'afficher.

**Pourquoi :** je suis plus à l'aise en Python, et tout le Backoffice est en Python (Flask, SQLAlchemy, authentification), ce qui permet de rester cohérent sans compliquer. Tout est au même endroit : la vérification des droits, l'accès à la base et la construction des pages sont dans une seule application. La connexion est aussi plus simple : Flask garde l'utilisateur connecté avec une session par cookie, sans jeton à gérer en JavaScript (décision 1).

**Limite :** on est obligé de recharger la page à chaque action (chaque formulaire envoyé). L'interface est moins fluide, ce qui est acceptable puisque le sujet demande une interface simple et fonctionnelle.

**Alternative écartée :** une API JSON avec une application JavaScript dans le navigateur : deux parties à écrire et à garder synchronisées, trop pour notre délai.


## 2. Rôle des fichiers (`backoffice/`)

| Fichier | Rôle |
|---|---|
| `config.py` | Lit les réglages du projet dans les variables d'environnement (`.env`) : adresse de la base, clé secrète, adresse de l'API Produits. Sans adresse de base ou sans clé, le Backoffice refuse de démarrer. |
| `app.py` | Notre application Flask : se connecte à la base et gère les différentes routes, avec leurs vérifications (quantités, agence prise dans le compte, produit existant dans l'API). |
| `models.py` | Représente les tables (`branches`, `users`, `stock`) en Python, avec leurs contraintes : c'est le plan des tables pour SQLAlchemy. |
| `seed.py` | Remplit la base avec les données de départ (agences, admin, employés de démonstration, stock). On peut le relancer sans créer de doublons. |
| `security.py` | Hache les mots de passe avec Argon2id (avec un sel) et vérifie un mot de passe à la connexion. |
| `auth.py` | Gère les autorisations : redirige vers `/login` si on ne sait pas qui c'est, refuse avec 403 si on sait qui c'est mais qu'il n'a pas le droit (`login_required`, `admin_required`, `common_required`). |
| `products.py` | Parle à l'API Produits : détails d'un produit, noms de tout le catalogue, et une erreur claire (`ProductApiError`) si l'API ne répond pas. |
| `templates/` | Les pages HTML du Backoffice (connexion, stock, admin), remplies par Jinja. |


## 3. Routes

| Adresse | Méthode | Qui | Rôle |
|---|---|---|---|
| `/login` | GET, POST | Tout le monde | Formulaire de connexion |
| `/logout` | GET | Tout le monde | Ferme la session |
| `/` | GET | Connecté | Accueil (provisoire) |
| `/stock` | GET | Employé | Stock de son agence, avec les noms des produits |
| `/stock/add` | POST | Employé | Ajouter du stock dans son agence |
| `/stock/remove` | POST | Employé | Retirer du stock dans son agence |
| `/admin/users` | GET | Admin | Liste des employés et formulaires |
| `/admin/users/new` | POST | Admin | Créer un employé |
| `/admin/users/<id>/update` | POST | Admin | Modifier le nom, l'identifiant, l'agence |
| `/admin/users/<id>/password` | POST | Admin | Changer le mot de passe |
| `/admin/users/<id>/delete` | POST | Admin | Suppression douce |


## 4. Intégration de l'API Produits

Les détails des produits viennent toujours de l'API Produits, jamais de notre base, qui ne stocke que l'identifiant (`product_api_id`). Tout l'échange avec l'API est dans `products.py`.

**À quoi elle sert :**
- afficher le nom de chaque produit dans la page de stock, pour que l'employé sache quel identifiant correspond à quel produit ;
- vérifier, avant un ajout, que le produit existe et qu'il est encore commercialisé (règle 4 de `database.md`).

**Un seul appel pour tout le tableau :** on récupère tout le catalogue en un appel (`?limit=100`) au lieu d'un appel par ligne. Avec un délai maximum de 5 secondes par appel, 30 lignes pourraient sinon faire attendre jusqu'à 2 min 30.

**Si l'API est en panne :**
- la page de stock s'affiche quand même : les noms sont remplacés par « — », avec un message ;
- l'ajout est refusé, car on ne peut plus vérifier que le produit existe ;
- le retrait reste possible : la ligne est déjà dans notre base, le produit a été vérifié à son ajout, et le retrait n'a besoin d'aucune information de l'API.

Il n'y a pas de connexion permanente : chaque page refait l'appel, donc tout redevient normal dès que l'API répond à nouveau.
