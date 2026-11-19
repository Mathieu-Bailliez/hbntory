# Base de données HBntory

## 1. Rôle de la base

La base de données stocke les informations du Backoffice : les employés, les agences
et la quantité de chaque produit dans chaque agence. Elle est utilisée par deux chemins.

- **Chemin 1 : Backoffice (employés).** Les employés se connectent à un site web qui
  leur permet d'ajouter, de retirer, de consulter et de lister la quantité des produits
  de leur agence. L'admin y gère les employés. Le serveur de ce site web est connecté
  à la base de données.
- **Chemin 2 : Client web (clients anonymes).** Un client pose une question à l'IA.
  L'IA utilise des outils donnés par le serveur MCP. Ces outils récupèrent les
  informations dans la base de données (en lecture seule) et dans l'API Produits.
  L'IA combine ces vraies données pour donner une réponse formatée au client.

La base ne stocke ni le nom du produit, ni sa description, ni son prix : ces
informations sont déjà dans l'API Produits. Elle garde seulement l'identifiant du produit.

## 2. Lancer la base

### Prérequis
- Docker (version utilisée : 29.1.3)
- Docker Compose (version utilisée : 2.40.3)

Vérifier qu'ils sont installés :
```bash
docker --version
docker compose version
```

Sous Ubuntu, s'il en manque un :
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2
```

### Configuration
Copier `.env.example` en `.env`, puis modifier les lignes avec nos choix personnels
(au minimum le mot de passe, qui est vide dans l'exemple) :
```bash
cp .env.example .env
```
Le fichier `.env` contient le mot de passe : il est ignoré par Git et ne doit jamais être poussé.

### Lancement
Démarrer uniquement le service `bdd`, en arrière-plan (`-d`) :
```bash
docker compose up -d bdd
```

### Vérification
1. La base est prête quand les journaux affichent `database system is ready to accept connections` :
```bash
docker compose logs bdd
```
2. Se connecter à la base avec `psql` (utilisateur `-U`, base `-d`), puis vérifier qui on est :
```bash
docker compose exec bdd psql -U hbntory -d hbntory_db
```
```sql
SELECT current_user, current_database();
```
Résultat attendu : `hbntory | hbntory_db`. Taper `\q` pour quitter.

## 3. Schéma

## 4. Tables

### 4.1 branches

### 4.2 users

### 4.3 stock

## 5. Relations

## 6. Règles et contraintes

## 7. Données initiales

## 8. Choix de conception

