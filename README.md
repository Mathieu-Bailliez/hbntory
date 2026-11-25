# HBntory

## Project overview

HBntory est un système de gestion de stock pour une entreprise qui possède plusieurs magasins (succursales).
Les employés gèrent le stock de leur magasin depuis un espace interne, et les clients peuvent interroger une IA pour savoir dans quelle succursale un produit est disponible.

L'objectif : centraliser les stocks de tous les magasins, pour savoir à tout moment où un produit est disponible.

### Backoffice (employés et admin)

Un site interne, accessible uniquement après connexion.

- **Employé** : rattaché à un seul magasin, il peut ajouter, retirer et consulter le stock de ce magasin, et lister les produits disponibles. Il ne peut ni gérer les utilisateurs, ni agir sur le stock d'un autre magasin.
- **Admin** (un seul compte) : il gère les employés de tous les magasins (création, modification, désactivation, changement de mot de passe et de magasin). Il ne gère jamais le stock.

### Client Web (clients)

Un site public, sans connexion : les clients restent anonymes.
Ils posent leurs questions en langage naturel à une IA, qui répond à partir des vraies données : quel produit, combien, et dans quel magasin.
Si l'information n'est pas disponible, l'IA le dit au lieu d'inventer.

## Team members

| Membre | Partie |
|---|---|
| Mathieu Bailliez | Backoffice, base de données |
| Driss Chaneac | Service IA, serveur MCP, Client Web |

## Architecture summary

Les données viennent de deux sources :

- **La Product API** (fournie, en lecture seule) : le catalogue des produits (nom, description, prix).
- **Notre base de données** : une seule base centrale, partagée par tous les magasins. Elle contient les employés, les magasins et les quantités en stock.

Ce qui relie les deux, c'est **l'identifiant du produit** : la base sait combien il y a du produit n° 42 dans chaque magasin, mais seule la Product API sait ce qu'est le produit n° 42.

L'IA n'accède jamais directement à ces données : elle passe par un serveur MCP, qui lui donne un accès contrôlé à travers un nombre limité d'outils.

![Architecture](docs/architecture.png)

### Services

| Service | Rôle |
|---|---|
| `bdd` | Base PostgreSQL centrale (employés, agences, stock) |
| `external-products-api` | Product API fournie : catalogue des produits |
| `backoffice` | Backoffice Flask (employés et admin) |
| `product-mcp-server` | Serveur MCP : accès contrôlé de l'IA aux produits et au stock |

### Technologies

| Technologie | Rôle dans le projet |
|---|---|
| Python | Langage du Backoffice |
| TypeScript (Node.js) | Langage du serveur MCP et du service IA |
| Flask + Jinja2 | Backoffice : le serveur fabrique les pages HTML (SSR) |
| PostgreSQL | Base de données centrale : employés, magasins, stocks |
| SQLAlchemy | Accès à la base de données depuis le Backoffice |
| Docker + Docker Compose | Lancement de tous les services en une seule commande |
| MCP (SDK TypeScript) | Serveur qui donne à l'IA un accès contrôlé aux produits et au stock (transport stdio) |
| Agents IA | En cours de développement |
| LLM | En cours de développement |

Le service IA est en cours de développement (voir « Known limitations »).

Justification des choix : voir [docs/decisions.md](docs/decisions.md)

Détails : voir [docs/architecture.md](docs/architecture.md)

## Setup instructions

### Prérequis

- Git
- Docker et Docker Compose

### Récupérer le projet

```bash
git clone <url du dépôt>
cd hbntory
```

### Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplir les valeurs vides du `.env` (chaque variable est expliquée dans le fichier) :

| Variable | Rôle |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe de la base (lettres et chiffres) |
| `ADMIN_PASSWORD` | Mot de passe du compte admin créé par le seed |
| `DEMO_USER_PASSWORD` | Mot de passe des employés de démonstration |
| `SECRET_KEY` | Clé de signature des cookies : `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `MCP_DB_PASSWORD` | Mot de passe du compte PostgreSQL en lecture seule du serveur MCP |

Le fichier `.env` ne doit jamais être commité.

## How to run each service

```bash
docker compose up -d --build
```

| Service | Rôle | Accès |
|---|---|---|
| `bdd` | Base PostgreSQL | `localhost:5432` |
| `external-products-api` | Product API fournie (catalogue) | Interne uniquement : `http://external-products-api:5000` depuis les autres conteneurs |
| `backoffice` | Backoffice Flask | http://localhost:5000 |
| `product-mcp-server` | Serveur MCP (stdio) | En cours de développement |

Commandes utiles :

```bash
docker compose ps                      # état des conteneurs
docker compose logs -f backoffice      # journaux d'un service
docker compose down                    # tout arrêter (les données sont gardées)
docker compose down -v                 # tout arrêter ET effacer la base
```

## How to initialize the database

Au premier lancement, PostgreSQL crée automatiquement les tables et le compte en lecture seule du serveur MCP à partir des scripts de `db/init/`. Ces scripts ne sont exécutés que si la base est vide (premier lancement ou après `down -v`).

Il faut ensuite insérer les données de départ (agences, compte admin, employés de démonstration, stock) :

```bash
docker compose exec backoffice python seed.py
```

Le seed peut être relancé sans risque : il ne crée que ce qui n'existe pas encore.

## How to access the Backoffice

Ouvrir http://localhost:5000 :

| Compte | Identifiant | Mot de passe | Arrive sur |
|---|---|---|---|
| Admin | `admin` | valeur de `ADMIN_PASSWORD` | `/admin/users` (gestion des employés) |
| Employé (agence Paris) | `alice` | valeur de `DEMO_USER_PASSWORD` | `/stock` (stock de son agence) |
| Employé (agence Lyon) | `bruno` | valeur de `DEMO_USER_PASSWORD` | `/stock` (stock de son agence) |

## How to use the Client Web Interface

Le Client Web n'est pas encore disponible (voir « Known limitations »).

## Main technical decisions

- **Pages fabriquées par le serveur (Flask + Jinja2)**, sans JavaScript côté navigateur : plus simple à sécuriser et à tester.
- **Connexion par session** (cookie signé par `SECRET_KEY`) et **mots de passe hachés avec Argon2id** : jamais de mot de passe en clair, ni en base ni dans les journaux.
- **L'agence d'un employé vient toujours de son compte** (`g.user.branch_id`), jamais du formulaire : un employé ne peut pas agir sur une autre agence, même en modifiant la page.
- **Suppression douce (soft-delete)** : un employé supprimé est marqué `is_deleted` ; il ne peut plus se connecter, mais l'historique et le stock de son agence sont conservés.
- **Une seule base PostgreSQL centrale**, avec un compte en lecture seule pour le serveur MCP : l'IA ne peut rien modifier.
- **Tables créées par un script SQL, sans outil de migrations** : la structure de la base est simple et ne change pas, et les données sont fictives : il n'y a rien à conserver, la base peut être recréée à tout moment.

Détails et alternatives écartées : [docs/decisions.md](docs/decisions.md)

## Known limitations

- **Chaîne publique non terminée** : le serveur MCP est en cours de développement ; le service IA et le Client Web ne sont pas encore disponibles. Les 4 scénarios IA de la Tâche 8 ne sont donc pas testés.
- **Pas de tests automatisés** : les scénarios critiques sont couverts par un script de test manuel ([docs/test.md](docs/test.md)).
- **Pas de migrations** : modifier la structure de la base demande `docker compose down -v`, ce qui efface les données.
- **Serveur de développement Flask** : convient pour la démonstration, pas pour la production.
- **Produit saisi par son identifiant** : pas de liste déroulante des produits dans le Backoffice.
- **Agences créées par le seed** : il n'y a pas d'écran pour ajouter une agence.
- **Si la Product API est en panne**, les noms des produits ne s'affichent pas et les ajouts sont refusés (le stock reste consultable).

### Améliorations prévues

Tests automatisés avec `pytest` sur le stock, migrations avec Flask-Migrate, serveur Gunicorn, liste déroulante des produits.

## Optional features implemented

Aucune pour le moment.

## Documentation

- [Architecture](docs/architecture.md) : les services et leurs échanges
- [MVP](docs/mvp.md) : le périmètre minimum du projet
- [Décisions techniques](docs/decisions.md) : nos choix et leurs justifications
- [Base de données](docs/database.md) : tables, contraintes, initialisation
- [Authentification](docs/auth.md) : session, mots de passe, rôles
- [Backoffice](docs/backoffice.md) : fonctionnalités employé et admin
- [Tests du Backoffice](docs/test.md) : script de test manuel et résultats
- [Tests du serveur MCP](docs/product-mcp-tests.md) : tests des outils MCP produits
- [Contribuer](docs/CONTRIBUTING.md) : notre façon de travailler avec Git
