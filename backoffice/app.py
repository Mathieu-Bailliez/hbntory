from config import DATABASE_URL, SECRET_KEY
from flask import Flask, redirect, render_template, request, session, url_for
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
        session["user_id"] = user.id
        return redirect(url_for("index"))
    return render_template("login.html")


@app.route("/")
def index():
    # Provisoire : page d'accueil protégée et vraie page à la case 7
    return f"Accueil — user_id en session : {session.get('user_id')} — <a href='/logout'>Se déconnecter</a>"


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))
