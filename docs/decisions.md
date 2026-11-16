# Décisions de communication — HBntory

Contexte général : équipe de 2 personnes en formation, 12 jours de projet.
Nous privilégions les options qui répondent au besoin du sujet sans complexité inutile.

---

## Décision 1 — Backoffice : REST + HTML/CSS/JS ou Server-Side Rendering ?

*Communication entre le navigateur des employés et le serveur Backoffice.*

**Contexte :** Le Backoffice est un outil interne utilisé par des employés authentifiés (un admin et des employés rattachés à une branche). Le sujet exige que les droits soient vérifiés côté serveur, et privilégie le fonctionnel plutôt que l'esthétique. L'équipe est plus à l'aise en Python qu'en JavaScript.

**Option choisie :** SSR (Server-Side Rendering)

**Bénéfice principal :** Tout est regroupé au même endroit : la vérification des droits, l'accès à la base et la construction des pages sont dans une seule application Python.

**Limite principale :** Rechargement de la page à chaque action.

**Alternative écartée :** REST + HTML/CSS/JS, parce que cette option impose deux couches à développer et à synchroniser : une API JSON et une application JavaScript qui la consomme.

---

## Décision 2 — Client web ↔ AI Query Service : REST ou WebSocket ?

*Communication entre le navigateur des visiteurs anonymes (page de chat) et le service IA (AI Query Service).*

**Contexte :** Des visiteurs anonymes posent des questions en langage naturel. Chaque question est traitée indépendamment, sans historique. La réponse est produite par un agent IA, ce qui peut prendre plusieurs secondes. Le développeur responsable de cette partie maîtrise déjà les WebSockets.

**Option choisie :** WebSocket

**Bénéfice principal :** La réponse de l'IA s'affiche progressivement (streaming), ce qui réduit l'attente perçue par le visiteur. De plus, le WebSocket est déjà maîtrisé par le développeur responsable de cette partie.

**Limite principale :** Plus complexe que REST : la connexion doit être ouverte, fermée et gérée en cas de coupure. Le WebSocket permet une communication dans les deux sens, alors que notre besoin va surtout du serveur vers le visiteur.

**Alternative écartée :** REST, qui aurait suffi pour des questions indépendantes, mais qui renvoie la réponse en une seule fois : le visiteur attendrait sans affichage progressif de la réponse jusqu'à la fin du traitement.

---

## Décision 3 — AI Query Service ↔ outils MCP : comment ?

*Communication entre le service IA (AI Query Service) et le serveur MCP (Product MCP Server).*

**Contexte :** Le sujet impose que l'agent IA accède à l'API Produits uniquement à travers notre serveur MCP. Le protocole MCP propose deux modes de transport : stdio (le service IA lance le serveur MCP comme sous-processus et dialogue avec lui directement) et Streamable HTTP (le serveur MCP est un service réseau indépendant). Un seul programme utilise notre serveur MCP : le service IA.

**Option choisie :** Protocole MCP en transport stdio. Le service IA lance le serveur MCP comme sous-processus au démarrage.

**Bénéfice principal :** Aucune configuration réseau : pas de port, pas de conteneur supplémentaire, pas d'ordre de démarrage à gérer. C'est le mode le plus simple à mettre en place et à déboguer.

**Limite principale :** Le serveur MCP n'est pas un service indépendant : il s'exécute dans le même conteneur que le service IA, ne peut pas être redémarré séparément et ne peut pas être partagé avec un autre programme.

**Alternative écartée :** Streamable HTTP, qui ferait du serveur MCP un service indépendant, mais qui ajoute un conteneur, un port et une gestion des pannes réseau : une complexité inutile tant que le service IA est son seul utilisateur.
