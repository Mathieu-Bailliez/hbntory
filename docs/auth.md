# Authentification et autorisation du Backoffice

## 1. Session ou jeton

**Choix :** une session par cookie, gérée par Flask.

**Pourquoi :** ce choix découle de la décision 1 (Server-Side Rendering). Le Backoffice
ne contient pas d'application JavaScript : tout est écrit en Python avec Flask. Le
navigateur renvoie le cookie automatiquement à chaque requête, ce qui évite d'avoir à
créer un programme en JavaScript qui devrait gérer une chaîne de caractères (le jeton).

**Alternative écartée :** l'authentification par jeton. Elle convient quand le client est
une application JavaScript ou mobile qui appelle une API, ce qui n'est pas notre cas.


## 2. Mots de passe

### Mécanisme utilisé
Nous avons choisi Argon2id, la référence actuelle pour le hachage des mots de passe (recommandé par l'OWASP). PBKDF2 et bcrypt utilisent très peu de mémoire : une carte graphique, qui teste énormément de mots de passe en parallèle, reste donc très efficace contre eux. Argon2id est volontairement lent et gourmand en mémoire, ce qui limite fortement l'avantage des cartes graphiques tout en restant rapide pour un utilisateur qui se connecte. Il est aussi simple à utiliser : le sel et les réglages sont gérés par la bibliothèque `argon2-cffi` (`backoffice/security.py`).

### Comment un mot de passe est haché
**Le sel.** Avant le hachage, un sel est ajouté au mot de passe : une valeur aléatoire, différente pour chaque mot de passe. Deux utilisateurs qui ont le même mot de passe obtiennent donc des hashes différents. Sans sel, un pirate qui vole la base verrait quels comptes partagent un mot de passe, et retrouverait les mots de passe courants dans des tables précalculées (listes « mot de passe → hash » préparées à l'avance). Le sel n'est pas secret : il est stocké en clair dans la chaîne du hash, car il sert à la vérification.

### Comment la vérification fonctionne
Un hash ne se « déchiffre » pas : on ne retrouve jamais le mot de passe à partir de lui. À la connexion, `verify_password` (`backoffice/security.py`) relit dans la chaîne stockée le sel et les réglages (`m`, `t`, `p`), hache le mot de passe saisi avec ces mêmes valeurs, puis compare le résultat à l'empreinte stockée. S'ils sont identiques, le mot de passe est correct. Sinon, la connexion est refusée avec le message générique « Identifiant ou mot de passe incorrect. ».
