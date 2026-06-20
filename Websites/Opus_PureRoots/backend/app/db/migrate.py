from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_schema(engine: Engine) -> None:
    """Add columns introduced after initial deploy (create_all does not alter tables)."""
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "balance" not in user_cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN balance NUMERIC(12, 2) NOT NULL DEFAULT 0"
                    )
                )

    if "order_items" in inspector.get_table_names():
        product_id_col = next(
            (c for c in inspector.get_columns("order_items") if c["name"] == "product_id"),
            None,
        )
        if product_id_col is not None and product_id_col.get("nullable") is False:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE order_items "
                        "DROP CONSTRAINT IF EXISTS order_items_product_id_fkey"
                    )
                )
                conn.execute(
                    text("ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL")
                )
                conn.execute(
                    text(
                        "ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey "
                        "FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL"
                    )
                )
