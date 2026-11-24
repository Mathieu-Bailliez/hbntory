
# Product MCP Server – Tests et gestion des erreurs

## 1. Objectif

Valider manuellement le comportement du serveur MCP avant son intégration avec l'agent IA.

Les tests sont réalisés avec MCP Inspector et la Product API externe.

## 2. Tests fonctionnels

### Test 1 – Listing des produits
- Outil : `list_products`
- Action : récupérer la liste des produits.
- Résultat : succès, les produits sont retournés avec leurs informations.

### Test 2 – Récupération d'un produit existant
- Outil : `get_product`
- Identifiant : `1`
- Résultat : succès, le produit Holberton Student Laptop 14 est retourné.

### Test 3 – Identifiant invalide
- Outil : `get_product`
- Identifiant : chaîne composée d'espaces.
- Résultat : erreur de validation MCP `-32602`.
- La requête est rejetée avant l'appel à la Product API.

### Test 4 – Produit inexistant
- Outil : `get_product`
- Identifiant : `999`
- Résultat : erreur structurée `PRODUCT_NOT_FOUND`.
- Message : le produit demandé n'existe pas.

### Test 5 – Product API indisponible
- Action : arrêt temporaire du conteneur Product API.
- Outil : `list_products`
- Résultat : erreur structurée `API_UNAVAILABLE`.
- Le serveur MCP reste opérationnel.

## 3. Gestion des erreurs

La fonction `fetchApi()` centralise les appels HTTP à la Product API.

Elle prend en charge plusieurs situations :

- `API_TIMEOUT` : la Product API ne répond pas dans les 10 secondes.
- `API_UNAVAILABLE` : connexion impossible ou erreur serveur HTTP 5xx.
- `PRODUCT_NOT_FOUND` : produit inexistant (HTTP 404).
- `API_HTTP_ERROR` : autre erreur HTTP.
- `UNEXPECTED_RESPONSE` : réponse JSON invalide ou format inattendu.

La fonction `apiError()` retourne une erreur structurée contenant :
- Un code d'erreur.
- Un message explicite.
- Le statut `isError` pour signaler l'échec à l'appelant.

Des logs sont également générés avec `console.error()` afin de faciliter le débogage sans perturber le transport STDIO.

## 4. Conclusion

Les outils `list_products` et `get_product` ont été testés manuellement avec MCP Inspector.

Les scénarios fonctionnels et les principaux scénarios d'erreur ont été vérifiés.

Le serveur MCP est prêt pour son intégration avec le service IA, sous réserve de l'intégration et des tests complémentaires.
