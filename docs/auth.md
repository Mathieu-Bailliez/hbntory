# Authentification et autorisation du Backoffice

## 1. Session ou jeton

**Choix :** une session par cookie, gérée par Flask.

**Pourquoi :** ce choix découle de la décision 1 (Server-Side Rendering). Le Backoffice
ne contient pas d'application JavaScript : tout est écrit en Python avec Flask. Le
navigateur renvoie le cookie automatiquement à chaque requête, ce qui évite d'avoir à
créer un programme en JavaScript qui devrait gérer une chaîne de caractères (le jeton).

**Alternative écartée :** l'authentification par jeton. Elle convient quand le client est
une application JavaScript ou mobile qui appelle une API, ce qui n'est pas notre cas.
