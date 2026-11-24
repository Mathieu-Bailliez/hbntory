import os

from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
SECRET_KEY = os.environ["SECRET_KEY"]
PRODUCT_API_BASE_URL = os.environ.get("PRODUCT_API_BASE_URL", "http://localhost:5001")
