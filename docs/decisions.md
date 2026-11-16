# Décisions de communication — HBntory

## Décision 1 — Backoffice : REST + HTML/CSS/JS ou Server-Side Rendering ?

*Communication entre le navigateur des employés et le serveur Backoffice.*

**Option choisie :** SSR (Server-Side Rendering)

**Bénéfice principal :** Tout est regroupé au même endroit : la vérification des droits, l'accès à la base et la construction des pages sont dans une seule application Python.

**Limite principale :** Rechargement de la page à chaque requête.
