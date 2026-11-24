from auth import admin_required, common_required, login_required
from config import DATABASE_URL, SECRET_KEY
from flask import Flask, flash, g, redirect, render_template, request, session, url_for
from models import Stock, User, db
from security import verify_password
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SECRET_KEY"] = SECRET_KEY
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
db.init_app(app)


def _positive_int(value):
    """Renvoie l'entier si value est un nombre entier > 0, sinon None."""
    if value is None or not value.isdecimal():
        return None
    number = int(value)
    return number if number > 0 else None


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
@login_required
def index():
    # Provisoire : vraie page d'accueil à la Tâche 4
    return f"Accueil — user_id en session : {session.get('user_id')} — <a href='/logout'>Se déconnecter</a>"


@app.route("/admin/users")
@admin_required
def admin_users():
    # Provisoire : vraie page à la Tâche 4 §2
    return f"Gestion des utilisateurs (admin) — connecté : {g.user.username}"


@app.route("/stock")
@common_required
def stock():
    items = Stock.query.filter_by(branch_id=g.user.branch_id).all()
    return render_template("stock.html", branch=g.user.branch, items=items)


@app.route("/stock/add", methods=["POST"])
@common_required
def stock_add():
    product_api_id = _positive_int(request.form.get("product_api_id"))   # étape 1
    quantity = _positive_int(request.form.get("quantity"))
    if product_api_id is None or quantity is None:                         # étape 2
        flash("Le produit et la quantité doivent être des nombres entiers positifs.")
        return redirect(url_for("stock"))
    branch_id = g.user.branch_id                                           # étape 3
    item = Stock.query.filter_by(branch_id=branch_id, product_api_id=product_api_id).first()  # étape 4
    if item is not None:
        item.quantity = item.quantity + quantity                           # étape 5
    else:
        db.session.add(Stock(branch_id=branch_id, product_api_id=product_api_id, quantity=quantity))  # étape 6
    db.session.commit()                                                    # étape 7
    flash(f"Ajouté : {quantity} du produit {product_api_id}.")
    return redirect(url_for("stock"))


@app.route("/stock/remove", methods=["POST"])
@common_required
def stock_remove():
    product_api_id = _positive_int(request.form.get("product_api_id"))
    quantity = _positive_int(request.form.get("quantity"))
    if product_api_id is None or quantity is None:
        flash("Le produit et la quantité doivent être des nombres entiers positifs.")
        return redirect(url_for("stock"))
    item = Stock.query.filter_by(branch_id=g.user.branch_id, product_api_id=product_api_id).first()
    if item is None:                                   # refus 1 : la ligne n'existe pas
        flash(f"Le produit {product_api_id} n'est pas en stock dans votre agence.")
        return redirect(url_for("stock"))
    if quantity > item.quantity:                       # refus 2 : pas assez de stock
        flash(f"Impossible de retirer {quantity} : il n'en reste que {item.quantity}.")
        return redirect(url_for("stock"))
    item.quantity = item.quantity - quantity
    try:
        db.session.commit()
    except IntegrityError:                             # dernier rempart : la base refuse
        db.session.rollback()
        flash("Opération refusée par la base de données : le stock n'a pas changé.")
        return redirect(url_for("stock"))
    flash(f"Retiré : {quantity} du produit {product_api_id}.")
    return redirect(url_for("stock"))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))
