import requests

from config import PRODUCT_API_BASE_URL


class ProductApiError(Exception):
    """L'API Produits est injoignable ou répond mal."""


def get_product(product_id):
    """Renvoie le produit (dictionnaire), None s'il n'existe pas, ou lève ProductApiError si l'API ne répond pas."""
    try:
        r = requests.get(f"{PRODUCT_API_BASE_URL}/api/v1/products/{product_id}", timeout=5)
    except requests.RequestException as error:      # personne ne décroche
        raise ProductApiError("L'API Produits est injoignable.") from error
    if r.status_code == 404:                         # « ce produit n'existe pas »
        return None
    if r.status_code != 200:                         # autre erreur de l'API
        raise ProductApiError(f"L'API Produits a répondu avec le code {r.status_code}.")
    return r.json()                                  # tout va bien


def get_product_names():
    """Renvoie {identifiant: nom} pour tout le catalogue, ou lève ProductApiError."""
    try:
        r = requests.get(f"{PRODUCT_API_BASE_URL}/api/v1/products", params={"limit": 100}, timeout=5)
    except requests.RequestException as error:
        raise ProductApiError("L'API Produits est injoignable.") from error
    if r.status_code != 200:
        raise ProductApiError(f"L'API Produits a répondu avec le code {r.status_code}.")
    return {product["id"]: product["name"] for product in r.json()["results"]}
