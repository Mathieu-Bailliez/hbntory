from config import DATABASE_URL
from flask import Flask
from models import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
db.init_app(app)
