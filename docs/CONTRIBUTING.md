# Contribuer à HBntory

Nous sommes deux sur ce projet. Ces règles sont volontairement simples : elles servent à garder `main` propre et un historique lisible.

## Les branches

- `main` est la branche principale. **On ne travaille jamais directement dessus.**
- Chaque tâche a sa propre branche, créée à partir de `main`.
- Nom des branches : un préfixe, puis une courte description, **en minuscules avec des tirets**.

| Préfixe | Pour quoi | Exemple |
|---|---|---|
| `feat/` | Une nouvelle fonctionnalité | `feat/login-backoffice` |
| `fix/` | Une correction de bug | `fix/stock-negatif` |
| `docs/` | La documentation | `docs/architecture` |
| `refactor/` | Réorganiser du code sans changer son comportement | `refactor/models` |
| `chore/` | Configuration, dépendances, Docker… | `chore/docker-compose` |

## Les commits

On suit la convention [Conventional Commits](https://www.conventionalcommits.org) :

```
type: short description
```

- Les **types** sont les mêmes que les préfixes de branche : `feat`, `fix`, `docs`, `refactor`, `chore`.
- La **description** est en anglais, courte, à l'impératif (`add`, pas `added`), sans point final.

Exemples :

```
feat: add login form
fix: prevent negative stock
docs: complete installation section
```

Un commit = un changement logique. Mieux vaut plusieurs petits commits qu'un gros commit « divers ».

## Le flow de travail

### 1. Partir d'un `main` à jour

```bash
git switch main
git pull
git switch -c feat/ma-tache
```

### 2. Travailler, puis enregistrer

```bash
git add .
git commit -m "feat: description"
git push -u origin feat/ma-tache
```

### 3. Ouvrir une Pull Request sur GitHub

Une courte description : ce qui a été fait, et ce qu'il faut vérifier.

### 4. Relecture et merge

- **La PR ne touche que ta partie** (ex. le Backoffice pour l'un, l'IA pour l'autre) : tu peux la merger toi-même.
- **La PR touche une partie commune ou celle de l'autre** (base de données, `docker-compose.yml`, README…) : on attend que l'autre l'approuve.

### 5. Après le merge

```bash
git switch main
git pull
git branch -d feat/ma-tache
```

Sur GitHub, supprimer aussi la branche avec le bouton **Delete branch**.

## Si `main` a avancé pendant que ta PR attend

```bash
git switch feat/ma-tache
git pull origin main
git push
```

Ou utiliser le bouton **Update branch** sur la PR.

## Les règles d'or

- Toujours vérifier sur quelle branche on est avant de créer une nouvelle branche (`git branch`).
- Toujours faire `git pull` sur `main` avant de créer une branche.
- Ne jamais commiter de secrets (`.env`, clés d'API) : ils sont dans le `.gitignore`.
