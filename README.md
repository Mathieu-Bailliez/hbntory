# HBntory

## Présentation

HBntory est un système de gestion de stock pour une entreprise qui possède plusieurs magasins (succursales).
Les employés gèrent le stock de leur magasin depuis un espace interne, et les clients peuvent interroger une IA pour savoir dans quelle succursale un produit est disponible.


L'objectif : centraliser les stocks de tous les magasins, pour savoir à tout moment où un produit est disponible.

## Les deux interfaces

### Backoffice (employés et admin)

Un site interne, accessible uniquement après connexion.

- **Employé** : rattaché à un seul magasin, il peut ajouter, retirer et consulter le stock de ce magasin, et lister les produits disponibles. Il ne peut ni gérer les utilisateurs, ni agir sur le stock d'un autre magasin.
- **Admin** (un seul compte) : il gère les employés de tous les magasins (création, modification, désactivation, changement de mot de passe et de magasin). Il ne gère jamais le stock.

### Client Web (clients)

Un site public, sans connexion : les clients restent anonymes.
Ils posent leurs questions en langage naturel à une IA, qui répond à partir des vraies données : quel produit, combien, et dans quel magasin.
Si l'information n'est pas disponible, l'IA le dit au lieu d'inventer.

## Comment ça marche

Les données viennent de deux sources :

- **La Product API** (fournie, en lecture seule) : le catalogue des produits (nom, description, prix).
- **Notre base de données** : une seule base centrale, partagée par tous les magasins. Elle contient les employés, les magasins et les quantités en stock.

Ce qui relie les deux, c'est **l'identifiant du produit** : la base sait combien il y a du produit n° 42 dans chaque magasin, mais seule la Product API sait ce qu'est le produit n° 42.

L'IA n'accède jamais directement à ces données : elle passe par un serveur MCP, qui lui donne un accès contrôlé à travers un nombre limité d'outils.

Détails : voir [docs/architecture.md](docs/architecture.md)

## Technologies

| Technologie | Rôle dans le projet |
|---|---|
| Python | Langage utilisé pour tous les services |
| Flask + Jinja2 | Backoffice : le serveur fabrique les pages HTML (SSR) |
| PostgreSQL | Base de données centrale : employés, magasins, stocks |
| SQLAlchemy | Accès à la base de données depuis Python |
| Docker + Docker Compose | Lancement de tous les services en une seule commande |
| MCP (SDK Python) | Serveur qui donne à l'IA un accès contrôlé aux produits et au stock |
| Google ADK + LiteLLM | *Proposition* : agents IA et connexion au modèle |
| LLM | *Proposition* : Groq (offre gratuite) ou Ollama en local, configurable dans le `.env` |

Les choix marqués *Proposition* seront confirmés pendant le développement du service IA.

Justification des choix : voir [docs/decisions.md](docs/decisions.md)

## Installation et lancement

À compléter.

## Documentation

- [Architecture](docs/architecture.md) : les services et leurs échanges
- [Décisions techniques](docs/decisions.md) : nos choix et leurs justifications
- [Contribuer](CONTRIBUTING.md) : notre façon de travailler avec Git

## Équipe

| Membre | Partie |
|---|---|
| Mathieu Bailliez | Backoffice, base de données |
| Driss Chaneac | Service IA, serveur MCP, Client Web |
