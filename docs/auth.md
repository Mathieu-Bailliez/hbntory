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

**Le coût.** Argon2id a trois réglages, écrits dans la chaîne du hash (`$argon2id$v=19$m=65536,t=3,p=4$<sel>$<empreinte>`) :
- `m` : la mémoire utilisée par chaque calcul (65 536 Ko, soit 64 Mo) ;
- `t` : le nombre de passages sur cette mémoire (3) ;
- `p` : le nombre de calculs menés en parallèle (4).
Ce sont les valeurs par défaut de `argon2-cffi`. Plus elles sont élevées, plus chaque essai coûte cher à un pirate. Comme elles sont stockées dans chaque hash, on peut les augmenter plus tard sans rendre les anciens hashes illisibles.

### Comment la vérification fonctionne

Un hash ne se « déchiffre » pas : on ne retrouve jamais le mot de passe à partir de lui. À la connexion, `verify_password` (`backoffice/security.py`) relit dans la chaîne stockée le sel et les réglages (`m`, `t`, `p`), hache le mot de passe saisi avec ces mêmes valeurs, puis compare le résultat à l'empreinte stockée. S'ils sont identiques, le mot de passe est correct. Sinon, la connexion est refusée avec le message générique « Identifiant ou mot de passe incorrect. ».

### Pourquoi un mot de passe en clair ou SHA-256 seul ne suffit pas

Le sel et les réglages sont visibles dans la base : la sécurité repose donc sur le coût de chaque essai.
- **En clair** : quiconque lit la base (fuite, sauvegarde volée) voit immédiatement tous les mots de passe. Beaucoup de gens les réutilisent ailleurs, donc la fuite touche aussi leurs autres comptes.
- **SHA-256 seul** : c'est une fonction généraliste, conçue pour être rapide. Avec une carte graphique, un pirate qui a volé la base teste des milliards de mots de passe par seconde. Sans sel, il peut même utiliser des tables précalculées. Les mots de passe courants tombent presque immédiatement.
- **Argon2id** : chaque essai coûte de la mémoire et du temps, et chaque compte a son propre sel. Le pirate doit attaquer compte par compte, très lentement.
### Aucun secret affiché
Ni le mot de passe ni son hash n'apparaissent en dehors de la base. Vérifié le 22/11 :
- le `__repr__` de `User` (`backoffice/models.py`) affiche seulement `id`, `username` et `is_admin` ;
- le code du Backoffice ne contient aucun `logging`, et le seul `print` (fin du seed) n'affiche aucune donnée ;
- le formulaire de connexion n'est jamais affiché ni écrit dans les journaux.
Les journaux sont moins protégés que la base : ils peuvent être copiés ou pris en capture d'écran. Un hash qui s'y trouverait permettrait à un pirate d'attaquer depuis chez lui, sans limite de temps.


## 3. Autorisation

### Authentification et autorisation
L'authentification vérifie **qui** est l'utilisateur (section 1). L'autorisation vérifie s'il a **le droit** de faire une action, selon son rôle (`is_admin`). Un visiteur non connecté est redirigé vers `/login`. Un utilisateur connecté qui n'a pas le droit reçoit une erreur 403.

### Règles appliquées
| Rôle | Gestion des utilisateurs | Opérations de stock |
|---|---|---|
| Admin | Autorisé | Refusé (403) |
| Commun | Refusé (403) | Autorisé, uniquement pour son agence |

### Mise en œuvre côté serveur
Cacher un bouton ou un champ ne protège rien : une requête peut être envoyée directement (adresse tapée à la main, `curl`, champ modifié avec l'inspecteur du navigateur). Les règles sont donc appliquées dans le code du serveur :
- `backoffice/auth.py` : décorateurs `admin_required` et `common_required`. À chaque requête, ils rechargent l'utilisateur depuis la base (un compte supprimé est déconnecté immédiatement), refusent avec `abort(403)` si le rôle ne convient pas, puis rangent l'utilisateur dans `g.user` pour la route.
- `login_required` (pages réservées aux utilisateurs connectés, quel que soit leur rôle) relit lui aussi l'utilisateur en base à chaque requête. Corrigé le 23/11 : avant, il ne regardait que le cookie, et un compte supprimé gardait l'accès à la page d'accueil.
- L'agence est toujours lue dans le compte (`g.user.branch_id`), jamais dans la requête (`request.form`, `request.args`).
- `@app.route` est toujours placé au-dessus du décorateur de protection : dans l'autre ordre, Flask enregistrerait la fonction non protégée.
### Tests manuels (23/11)
| # | Utilisateur | Adresse | Résultat |
|---|---|---|---|
| 1 | bruno (commun) | `/stock` | ✔ page de son agence |
| 2 | bruno (commun) | `/admin/users` | ✔ 403 |
| 3 | admin | `/admin/users` | ✔ page admin |
| 4 | admin | `/stock` | ✔ 403 |
| 5 | visiteur anonyme | `/stock` | ✔ redirigé vers `/login` |
| 6 | bruno supprimé, ancien cookie | `/` | ✔ redirigé vers `/login` à la requête suivante |
