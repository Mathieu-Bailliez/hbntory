from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Branch(db.Model):
    __tablename__ = "branches"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    users = db.relationship("User", back_populates="branch")
    stock_items = db.relationship("Stock", back_populates="branch")


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(50), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    branch_id = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=True)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    branch = db.relationship("Branch", back_populates="users")


class Stock(db.Model):
    __tablename__ = "stock"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    branch_id = db.Column(db.Integer, db.ForeignKey("branches.id"), nullable=False)
    product_api_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    branch = db.relationship("Branch", back_populates="stock_items")
