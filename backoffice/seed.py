import os

from app import app
from models import Branch, Stock, User, db
from security import hash_password

BRANCHES = ["Paris", "Lyon"]
USERS = [("Alice Martin", "alice", "Paris"), ("Bruno Petit", "bruno", "Lyon")]
# (agence, product_api_id, quantité) : 15 dans 2 agences, 1 dans une seule, 3 nulle part
STOCK = [("Paris", 15, 10), ("Lyon", 15, 4), ("Paris", 1, 7), ("Lyon", 2, 3)]


def seed():
    branches = {}
    for name in BRANCHES:
        branch = Branch.query.filter_by(name=name).first()
        if branch is None:
            branch = Branch(name=name)
            db.session.add(branch)
        branches[name] = branch
    db.session.flush()  # la base attribue les id des nouvelles agences

    if User.query.filter_by(username="admin").first() is None:
        db.session.add(User(name="Administrateur", username="admin", is_admin=True,
                            password_hash=hash_password(os.environ["ADMIN_PASSWORD"])))

    for name, username, branch_name in USERS:
        if User.query.filter_by(username=username).first() is None:
            db.session.add(User(name=name, username=username, branch=branches[branch_name],
                                password_hash=hash_password(os.environ["DEMO_USER_PASSWORD"])))

    for branch_name, product_id, quantity in STOCK:
        branch = branches[branch_name]
        if Stock.query.filter_by(branch_id=branch.id, product_api_id=product_id).first() is None:
            db.session.add(Stock(branch=branch, product_api_id=product_id, quantity=quantity))

    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        seed()
        print("Seed terminé.")
