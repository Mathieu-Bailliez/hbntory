CREATE TABLE branches (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE users (
    id SERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    branch_id INTEGER,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (id),
    CONSTRAINT ck_users_admin_branch CHECK ((is_admin AND branch_id IS NULL) OR (NOT is_admin AND branch_id IS NOT NULL)),
    UNIQUE (username),
    FOREIGN KEY (branch_id) REFERENCES branches (id)
);

CREATE TABLE stock (
    id SERIAL NOT NULL,
    branch_id INTEGER NOT NULL,
    product_api_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_stock_branch_product UNIQUE (branch_id, product_api_id),
    CONSTRAINT ck_stock_quantity_positive CHECK (quantity >= 0),
    FOREIGN KEY (branch_id) REFERENCES branches (id)
);
