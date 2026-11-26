# Guide d'installation et de lancement de HBntory

Ce guide explique comment installer et lancer HBntory sur une machine de développement Ubuntu ou WSL Ubuntu. Il s'adresse à une personne qui découvre le projet.

## 1. Prérequis

Installer et vérifier les outils suivants :

- **Git** : pour récupérer le code source.
- **Docker avec Docker Compose** : pour lancer PostgreSQL, la Product API, le Backoffice et le serveur MCP.
- **Node.js et npm** : pour exécuter le Service IA.
- **Python 3** : pour servir les fichiers du Client Web et initialiser les données du Backoffice.
- **Ollama** : pour exécuter localement le modèle d'IA.

Dans un terminal Ubuntu, vérifier les installations :

```bash
git --version
docker --version
docker compose version
node --version
npm --version
python3 --version
ollama --version
```

Si Docker est installé via Docker Desktop sous Windows, activer l'intégration WSL pour la distribution Ubuntu utilisée. Docker doit être démarré avant de continuer.

## 2. Récupérer le projet

Ouvrir un terminal Ubuntu et cloner le dépôt :

```bash
git clone https://github.com/Mathieu-Bailliez/hbntory.git
cd hbntory
```

Toutes les commandes Docker Compose de ce guide sont à exécuter depuis le dossier racine `hbntory`, sauf indication contraire.

## 3. Configurer les variables d'environnement

Créer le fichier local `.env` à partir du modèle fourni :

```bash
cp .env.example .env
```

Ouvrir le fichier `.env` avec un éditeur de texte et renseigner les valeurs suivantes :

| Variable | Valeur à renseigner |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL, lettres et chiffres uniquement, sans espace ni caractère spécial |
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur créé par le seed |
| `DEMO_USER_PASSWORD` | Mot de passe des comptes employés de démonstration |
| `SECRET_KEY` | Clé secrète longue et aléatoire |
| `MCP_DB_PASSWORD` | Mot de passe du compte PostgreSQL en lecture seule, lettres et chiffres uniquement |

Les autres valeurs du fichier `.env.example` sont déjà renseignées et doivent être conservées telles quelles.

Pour générer une clé secrète Flask, exécuter :

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copier le résultat dans `SECRET_KEY`.

**Important :** ne jamais partager ni commiter le fichier `.env`. Il contient des mots de passe et des clés privées.

## 4. Installer et préparer Ollama

Installer Ollama depuis le site officiel : https://ollama.com/

Le Service IA utilise par défaut le modèle `qwen3:4b`. Télécharger ce modèle :

```bash
ollama pull qwen3:4b
```

Vérifier que le modèle est disponible :

```bash
ollama list
```

Ollama doit rester démarré pendant l'utilisation du Service IA. Par défaut, le Service IA contacte Ollama à l'adresse `http://localhost:11434`. Les variables `OLLAMA_BASE_URL` et `OLLAMA_MODEL` permettent de modifier ces valeurs si nécessaire.

## 5. Démarrer les services Docker

Depuis la racine du projet, lancer :

```bash
docker compose up -d --build
```

Cette commande démarre :

- PostgreSQL (service `bdd`) ;
- la Product API externe (service `external-products-api`) ;
- le Backoffice (service `backoffice`).

Vérifier leur état :

```bash
docker compose ps
```

Les conteneurs doivent afficher un état `Up`.

Le serveur MCP est construit par Docker Compose et lancé à la demande par le Service IA, au moyen de `docker compose run`. Il n'est donc pas nécessaire de le lancer manuellement.

## 6. Initialiser la base de données

Lors du premier démarrage, PostgreSQL crée les tables et le compte en lecture seule du MCP grâce aux scripts du dossier `db/init/`.

Insérer ensuite les données de démonstration (agences, comptes et stock) :

```bash
docker compose exec backoffice python seed.py
```

Le seed peut être relancé sans risque : il ne crée que les éléments qui n'existent pas encore.

## 7. Démarrer le Service IA

Ouvrir un deuxième terminal Ubuntu. Depuis le dossier racine du projet :

```bash
cd ai_service
npm install
npm run dev
```

Le Service IA démarre sur le port `3001`.

Vérifier son état en ouvrant cette adresse dans un navigateur :

http://localhost:3001/health

La réponse attendue ressemble à :

```json
{
  "status": "ok",
  "service": "HBntory AI Service"
}
```

Garder ce terminal ouvert.

## 8. Démarrer le Client Web

Ouvrir un troisième terminal Ubuntu. Depuis le dossier racine du projet :

```bash
cd client_web
python3 -m http.server 5500
```

Ouvrir ensuite le Client Web dans un navigateur :

http://localhost:5500

Garder ce terminal ouvert.

## 9. Accéder aux interfaces

| Élément | Adresse |
|---|---|
| Client Web public | http://localhost:5500 |
| Backoffice | http://localhost:5000 |
| Vérification du Service IA | http://localhost:3001/health |

Les comptes de démonstration sont initialisés par le seed :

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin` | Valeur de `ADMIN_PASSWORD` dans `.env` |
| Employé (agence Paris) | `alice` | Valeur de `DEMO_USER_PASSWORD` dans `.env` |
| Employé (agence Lyon) | `bruno` | Valeur de `DEMO_USER_PASSWORD` dans `.env` |

Le Client Web est public et ne nécessite pas de connexion.

## 10. Tester l'assistant

Dans le Client Web, saisir par exemple :

- « Donne-moi les détails du produit 15. »
- « Quels produits sont disponibles à Paris ? »
- « Donne-moi le stock du produit 15 dans toutes les agences. »
- « Je souhaite acheter les produits 1 et 15. Dans quelle agence puis-je les trouver ? »

Le navigateur envoie la question au Service IA. Celui-ci utilise Ollama et lance le serveur MCP pour consulter les informations produits et stock.

## 11. Arrêter le projet

Pour arrêter les services Docker sans supprimer les données de la base :

```bash
docker compose down
```

Arrêter également les terminaux du Service IA et du Client Web avec `Ctrl + C`, ainsi qu'Ollama si nécessaire.

Pour redémarrer le projet plus tard, reprendre à l'étape 5, puis relancer le Service IA et le Client Web.

**Attention :** la commande suivante supprime également le volume PostgreSQL et donc les données stockées :

```bash
docker compose down -v
```

Ne l'utiliser que si une réinitialisation complète de la base est souhaitée.

## 12. Problèmes fréquents

### Docker ne répond pas

Vérifier que Docker Desktop ou le service Docker est démarré et que l'intégration WSL est activée si Ubuntu est utilisé depuis Windows.

### Le port est déjà utilisé

Un autre programme peut déjà utiliser les ports `5000`, `5432`, `3001` ou `5500`. Arrêter le programme concerné avant de relancer le service.

### Le Client Web ne reçoit aucune réponse

Vérifier que :

1. Docker Compose est démarré ;
2. Ollama fonctionne et le modèle `qwen3:4b` est disponible ;
3. le Service IA répond sur http://localhost:3001/health ;
4. le terminal du Client Web est toujours actif sur le port `5500`.

### Le Service IA ne parvient pas à lancer le MCP

Le Service IA utilise la commande `docker compose run` pour démarrer le serveur MCP. Vérifier que Docker fonctionne et que le terminal du Service IA a été lancé depuis le dossier `ai_service` du dépôt cloné. Le compte MCP utilise une connexion PostgreSQL en lecture seule.

---

Pour comprendre les échanges entre les composants, consulter également [la documentation d'architecture](architecture.md).
