from auth import admin_required, common_required, login_required
from config import DATABASE_URL, SECRET_KEY
from flask import (
    Flask,
    abort,
    flash,
    g,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from models import Branch, Stock, User, db
from products import ProductApiError, get_product, get_product_names
from security import hash_password, verify_password
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


def _get_common_user(user_id):
    """Renvoie l'employé, ou None s'il n'existe pas ou si c'est l'admin."""
    user = db.session.get(User, user_id)
    if user is None or user.is_admin:
        return None
    return user


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
    if g.user.is_admin:
        return redirect(url_for("admin_users"))
    else:
        return redirect(url_for("stock"))


@app.route("/admin/users")
@admin_required
def admin_users():
    users = User.query.filter_by(is_admin=False).order_by(User.username).all()
    branches = Branch.query.order_by(Branch.name).all()
    return render_template("admin_users.html", users=users, branches=branches)


@app.route("/admin/users/new", methods=["POST"])
@admin_required
def admin_user_create():
    name = request.form.get("name", "").strip()
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    branch = db.session.get(Branch, _positive_int(request.form.get("branch_id")) or 0)
    if not name or not username or len(password) < 8 or branch is None:
        flash("Nom, identifiant, mot de passe (8 caractères minimum) et agence sont obligatoires.")
        return redirect(url_for("admin_users"))
    if User.query.filter_by(username=username).first() is not None:
        flash(f"L'identifiant « {username} » est déjà pris.")
        return redirect(url_for("admin_users"))
    db.session.add(User(name=name, username=username, password_hash=hash_password(password),
                        is_admin=False, branch_id=branch.id))
    db.session.commit()
    flash(f"Employé « {username} » créé dans l'agence {branch.name}.")
    return redirect(url_for("admin_users"))

@app.route("/admin/users/<int:user_id>/update", methods=["POST"])
@admin_required
def admin_user_update(user_id):
    user = _get_common_user(user_id)
    if user is None:
        abort(404)
    name = request.form.get("name", "").strip()
    username = request.form.get("username", "").strip()
    branch = db.session.get(Branch, _positive_int(request.form.get("branch_id")) or 0)
    if not name or not username or branch is None:
        flash("Nom, identifiant et agence sont obligatoires.")
        return redirect(url_for("admin_users"))
    other = User.query.filter_by(username=username).first()
    if other is not None and other.id != user.id:
        flash(f"L'identifiant « {username} » est déjà pris.")
        return redirect(url_for("admin_users"))
    user.name = name
    user.username = username
    user.branch_id = branch.id
    db.session.commit()
    flash(f"Employé « {username} » modifié (agence : {branch.name}).")
    return redirect(url_for("admin_users"))


@app.route("/admin/users/<int:user_id>/password", methods=["POST"])
@admin_required
def admin_user_password(user_id):
    user = _get_common_user(user_id)
    if user is None:
        abort(404)
    password = request.form.get("password", "")
    if len(password) < 8:
        flash("Le mot de passe doit faire au moins 8 caractères.")
        return redirect(url_for("admin_users"))
    user.password_hash = hash_password(password)
    db.session.commit()
    flash(f"Mot de passe de « {user.username} » changé.")
    return redirect(url_for("admin_users"))


@app.route("/admin/users/<int:user_id>/delete", methods=["POST"])
@admin_required
def admin_user_delete(user_id):
    user = _get_common_user(user_id)
    if user is None:
        abort(404)
    user.is_deleted = True
    db.session.commit()
    flash(f"Employé « {user.username} » supprimé : il ne peut plus se connecter. Le stock de son agence est conservé.")
    return redirect(url_for("admin_users"))


@app.route("/stock")
@common_required
def stock():
    items = Stock.query.filter_by(branch_id=g.user.branch_id).all()
    names = {}
    api_error = None
    try:
        names = get_product_names()                    # un seul appel pour tout le tableau
    except ProductApiError as error:
        api_error = f"{error} Les noms des produits ne peuvent pas être affichés."
    return render_template("stock.html", branch=g.user.branch, items=items, names=names, api_error=api_error)


@app.route("/stock/add", methods=["POST"])
@common_required
def stock_add():
    product_api_id = _positive_int(request.form.get("product_api_id"))   # étape 1
    quantity = _positive_int(request.form.get("quantity"))
    if product_api_id is None or quantity is None:                         # étape 2
        flash("Le produit et la quantité doivent être des nombres entiers positifs.")
        return redirect(url_for("stock"))
    try:                                                                   # règle 4 : le produit existe-t-il ?
        product = get_product(product_api_id)
    except ProductApiError as error:
        flash(f"{error} Ajout impossible pour le moment.")
        return redirect(url_for("stock"))
    if product is None:
        flash(f"Le produit {product_api_id} n'existe pas dans le catalogue.")
        return redirect(url_for("stock"))
    if product["discontinued"]:
        flash(f"Le produit {product_api_id} ({product['name']}) n'est plus commercialisé : ajout refusé.")
        return redirect(url_for("stock"))
    branch_id = g.user.branch_id                                           # étape 3
    item = Stock.query.filter_by(branch_id=branch_id, product_api_id=product_api_id).first()  # étape 4
    if item is not None:
        item.quantity = item.quantity + quantity                           # étape 5
    else:
        db.session.add(Stock(branch_id=branch_id, product_api_id=product_api_id, quantity=quantity))  # étape 6
    db.session.commit()                                                    # étape 7
    flash(f"Ajouté : {quantity} × {product['name']} (produit {product_api_id}).")
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
