from config import DATABASE_URL, SECRET_KEY
from flask import Flask, render_template, request
from models import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SECRET_KEY"] = SECRET_KEY
db.init_app(app)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        # Case 4 : vérifier les identifiants avec verify_password
        return f"Reçu : {username}"
    return render_template("login.html")
