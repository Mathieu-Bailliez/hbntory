from flask import Flask

from config import DATABASE_URL, SECRET_KEY
from models import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SECRET_KEY"] = SECRET_KEY
db.init_app(app)
