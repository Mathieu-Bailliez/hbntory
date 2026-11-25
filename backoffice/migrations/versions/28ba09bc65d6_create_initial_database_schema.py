
"""Create initial database schema

Revision ID: 28ba09bc65d6
Revises:
Create Date: 2026-11-25
"""

from alembic import op
import sqlalchemy as sa


# Identifiants Alembic
revision = "28ba09bc65d6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Table branches
    op.create_table(
        "branches",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.UniqueConstraint("name"),
    )

    # Table users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "is_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("branch_id", sa.Integer(), nullable=True),
        sa.Column(
            "is_deleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.UniqueConstraint("username"),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.CheckConstraint(
            "(is_admin AND branch_id IS NULL) "
            "OR (NOT is_admin AND branch_id IS NOT NULL)",
            name="ck_users_admin_branch",
        ),
    )

    # Table stock
    op.create_table(
        "stock",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("branch_id", sa.Integer(), nullable=False),
        sa.Column("product_api_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.UniqueConstraint(
            "branch_id",
            "product_api_id",
            name="uq_stock_branch_product",
        ),
        sa.CheckConstraint(
            "quantity >= 0",
            name="ck_stock_quantity_positive",
        ),
    )


def downgrade():
    op.drop_table("stock")
    op.drop_table("users")
    op.drop_table("branches")
