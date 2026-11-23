# Décisions techniques — HBntory

Contexte général : équipe de 2 personnes en formation, 12 jours de projet.
Nous privilégions les options qui répondent au besoin du sujet sans complexité inutile.

---

## Décision 1 — Backoffice : REST + HTML/CSS/JS ou Server-Side Rendering ?

*Communication entre le navigateur des employés et le serveur Backoffice.*

**Contexte :** Le Backoffice est un outil interne utilisé par des employés
authentifiés (un admin et des employés rattachés à une branche). Le sujet exige
que les droits soient vérifiés côté serveur, et privilégie le fonctionnel plutôt
que l'esthétique. Notre équipe est composée de deux personnes, et le Backoffice est écrit en Python.

**Option choisie :** Server-Side Rendering. Le serveur Flask génère les pages HTML
complètes avec des templates Jinja.

**Bénéfice principal :** Tout est regroupé au même endroit : la vérification des
droits, l'accès à la base et la construction des pages sont dans une seule
application Python. La connexion est aussi plus simple : Flask garde l'employé
connecté grâce à une session (cookie), sans jeton à gérer en JavaScript.

**Limite principale :** La page entière est rechargée à chaque action. L'interface
est moins fluide, ce qui est acceptable puisque le design n'est pas la priorité.

**Alternative écartée :** REST + HTML/CSS/JS, parce que cette option impose deux
couches à développer et à synchroniser : une API JSON et une application
JavaScript qui la consomme. C'est trop de travail pour une équipe de deux sur ce délai.

---

## Décision 2 — Client Web : REST ou WebSocket ?

*Communication entre le navigateur des visiteurs anonymes (page de chat) et le service IA (AI Query Service).*

**Contexte :** Des visiteurs anonymes posent des questions en langage naturel. Le sujet précise que chaque question est traitée indépendamment, sans historique. La réponse est produite par un agent IA, ce qui peut prendre plusieurs secondes. Le développeur responsable de cette partie maîtrise déjà les WebSockets.

**Option choisie :** REST. La page envoie la question au service IA via une
requête HTTP POST et reçoit la réponse complète en JSON.

**Bénéfice principal :** Le modèle « une question, une réponse » de REST
correspond exactement au besoin du sujet. Il y a moins de code à créer et à défendre,
ce qui nous permet d'atteindre le MVP plus vite et d'éviter un système incomplet
le jour de la présentation.

**Limite principale :** La réponse s'affiche d'un seul coup, une fois le
traitement de l'agent terminé. Le visiteur attend quelques secondes sans affichage
progressif. Nous affichons un indicateur de chargement pour compenser.

**Alternative écartée :** WebSocket. Nous l'avions choisi au départ, et la
compétence était présente dans l'équipe. En définissant le MVP, nous avons compris
que le streaming relève du confort et non d'une nécessité. WebSocket ajoute de la
complexité (connexion à ouvrir, fermer et gérer en cas de coupure) et offre une
communication dans les deux sens, alors que notre besoin est une simple
question suivie d'une réponse. Le streaming pourra être ajouté plus tard s'il
reste du temps (voir mvp.md).

---

## Décision 3 — Transport MCP : stdio ou Streamable HTTP ?

*Communication entre le service IA (AI Query Service) et notre serveur MCP
(Product MCP Server).*

**Contexte :** Le sujet impose que l'agent IA accède à l'API Produits à travers
notre serveur MCP. Le protocole MCP propose deux modes de transport : stdio (le
service IA lance le serveur MCP comme sous-processus et dialogue avec lui
directement) et Streamable HTTP (le serveur MCP est un service réseau
indépendant). Le serveur MCP et le service IA sont tous les deux écrits en
TypeScript, et le service IA est le seul utilisateur du serveur MCP.

**Option choisie :** stdio. Le service IA lance le serveur MCP comme
sous-processus, dans le même conteneur Node.js, et lui envoie ses demandes
directement.

**Bénéfice principal :** C'est la solution la plus simple : aucun port, aucune
adresse réseau et aucun ordre de démarrage à gérer. Comme les deux composants
sont écrits en TypeScript, ils partagent un seul conteneur Node.js. Le serveur
MCP reste testable seul avec MCP Inspector, qui sait lancer un serveur stdio.

**Limite principale :** Le serveur MCP n'est joignable que par le service IA qui
l'a lancé, et un plantage du service IA l'arrête aussi. Ses messages de journal
doivent passer par la sortie d'erreur (stderr), car la sortie standard est
réservée au protocole MCP.

**Alternative écartée :** Streamable HTTP. Il donnerait au serveur MCP son propre
conteneur, joignable par une adresse réseau. Mais il demande d'ajouter un serveur
HTTP au code, un port à configurer et un ordre de démarrage à respecter, sans
bénéfice concret puisque le service IA est le seul utilisateur du serveur MCP.
Le SDK MCP TypeScript propose les deux transports : ce choix reste réversible si
un autre service devait un jour utiliser le serveur MCP.

---

## Décision 4 — Accès de l'IA au stock : notre serveur MCP ou MCP Toolbox ?

*Comment l'agent IA obtient les quantités en stock stockées dans notre base.*

**Contexte :** Nous devons de toute façon créer un serveur MCP pour l'API
Produits. Les questions des visiteurs portent aussi sur le stock par agence.
Le service est public et anonyme : l'IA ne doit jamais pouvoir modifier la base.

**Option choisie :** Étendre notre propre serveur MCP avec des outils de
consultation du stock en lecture seule (par exemple : stock d'un produit dans
toutes les agences, produits disponibles dans une agence).

**Bénéfice principal :** Nous créons déjà ce serveur de A à Z, donc ajouter
quelques outils prend peu de temps de plus. Nous n'avons pas à apprendre une
nouvelle technologie dans notre délai. Nous gardons aussi le contrôle total :
l'agent ne peut exécuter que les requêtes que nous avons écrites, uniquement en
lecture. Aucun outil n'accepte de requête SQL libre, ce qui protège la base
contre un visiteur qui tenterait de détourner l'agent.

**Limite principale :** Nous devons écrire et maintenir ces requêtes nous-mêmes.
Le serveur MCP doit avoir accès à la base de données, et si le schéma de la base
change, ses outils doivent être mis à jour.

**Alternative écartée :** MCP Toolbox for Databases. Elle demande moins de code,
mais ajoute un outil à apprendre, à configurer et à faire tourner dans
Docker, ainsi qu'un deuxième serveur MCP à brancher sur l'agent. Mal configurée,
elle pourrait aussi laisser l'IA exécuter des requêtes non prévues.
