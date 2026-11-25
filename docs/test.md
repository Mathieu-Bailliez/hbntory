# Tests du Backoffice

Ce document rassemble les preuves de test du Backoffice (Tâche 8 §2) : un script de test manuel couvrant les 9 scénarios critiques du Backoffice, et les tests automatisés existants.

## 1. Environnement

| Élément | Valeur |
|---|---|
| Date d'exécution | 25/11/2026 |
| Branche testée | `main` |
| Lancement | Docker Compose (Backoffice, base PostgreSQL, API Produits) |
| Navigateur | Firefox |
| Comptes utilisés | `alice` (employé, agence Paris), `admin` (administrateur), `testjury` (créé pendant les tests) |

## 2. Préparation

Les tests partent d'une base réinitialisée :

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backoffice python seed.py
```

## 3. Résumé

| Résultat | Nombre |
|---|---|
| Scénarios testés | 9 |
| Réussis | 9 |
| Échoués | 0 |
| Non testés | 4 (scénarios IA, voir §6) |

## 4. Script de test manuel

| N° | Scénario | Étapes | Résultat attendu | Résultat obtenu | Code concerné | Statut |
|---|---|---|---|---|---|---|
| 1 | Un employé ajoute du stock valide | `alice` → `/stock` → produit `15`, quantité `1` → Ajouter | Message « Ajouté : 1 × <nom> (produit 15). », quantité + 1 | 11 → 12, « Ajouté : 1 × External SSD 1TB (produit 15). » | `stock_add` | ✅ |
| 2 | Un employé retire du stock valide | Produit `15`, quantité `2` → Retirer | « Retiré : 2 du produit 15. », quantité − 2 | 12 → 10, message conforme | `stock_remove` | ✅ |
| 3 | Un retrait supérieur au stock est refusé | Produit `15` (10 unités), quantité `11` → Retirer | Refus, stock inchangé | « Impossible de retirer 11 : il n'en reste que 10. », stock à 10 | `stock_remove` (refus 2) | ✅ |
| 4 | Un employé ne peut pas agir sur une autre agence | Ajout d'un champ `<input name="branch_id" value="2">` au formulaire avec l'inspecteur du navigateur → produit `15`, quantité `1` → Ajouter | Le champ est ignoré : l'agence vient de `g.user.branch_id` | 10 → 11 dans l'agence Paris ; l'agence 2 est inchangée | `stock_add` (étape 3) | ✅ |
| 5 | L'admin crée un employé | `admin` → `/admin/users` → `Test Jury`, `testjury`, mot de passe de 8 caractères ou plus, agence Paris → Créer | « Employé « testjury » créé dans l'agence Paris. », visible dans la liste | Conforme | `admin_user_create` | ✅ |
| 6 | L'admin supprime un employé (soft-delete) | Supprimer `testjury` | Message de suppression ; l'employé reste en base (`is_deleted = true`) | Conforme ; `testjury` toujours dans la liste | `admin_user_delete` | ✅ |
| 7 | Un employé supprimé ne peut plus se connecter | `/login` avec `testjury` | « Identifiant ou mot de passe incorrect. », aucune session | Conforme | `login` (`is_deleted`) | ✅ |
| 8 | L'admin ne peut pas gérer le stock | `admin` → `/stock` | 403 Forbidden | 403 Forbidden | `@common_required` | ✅ |
| 9 | Les détails des produits viennent de l'API externe | a) Afficher `/stock` ; b) ajouter le produit `999` ; c) `docker compose stop external-products-api`, recharger `/stock`, puis `docker compose start external-products-api` | a) Noms affichés ; b) « Le produit 999 n'existe pas dans le catalogue. » ; c) message d'erreur, page toujours utilisable | a) « External SSD 1TB » affiché ; b) conforme ; c) « L'API Produits est injoignable. Les noms des produits ne peuvent pas être affichés. » | `products.py`, `stock`, `stock_add` | ✅ |

## 5. Tests automatisés

Le projet ne contient pas encore de tests automatisés : tous les tests sont manuels (l'énoncé accepte des tests automatisés, des scripts de test manuels, ou les deux).

Les règles d'autorisation (admin, employé, compte supprimé) ont aussi été vérifiées par 5 tests manuels lors de la Tâche 3 (PR #43, 23/11), puis à nouveau par les scénarios 4, 7 et 8 ci-dessus.

Amélioration prévue : des tests automatisés avec `pytest` sur la logique critique du stock (retrait supérieur au stock, opération sur une autre agence).

## 6. Non testé

Les 4 scénarios IA de la Tâche 8 §2 (où un produit est disponible, produits d'une agence, produit inconnu, information indisponible) n'ont pas été testés : la chaîne publique (serveur MCP, service IA, client web) n'est pas terminée. Voir « Known limitations » dans le README.
