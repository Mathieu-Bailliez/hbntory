from config import DATABASE_URL, SECRET_KEY
from flask import Flask, render_template, request
from models import User, db
from security import verify_password

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SECRET_KEY"] = SECRET_KEY
db.init_app(app)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username).first()
        if user is None or not verify_password(user.password_hash, password) or user.is_deleted:
            return render_template("login.html", error="Identifiant ou mot de passe incorrect.")
        return f"Connecté : {user.name}"   # provisoire, remplacé à la case 6
    return render_template("login.html")
