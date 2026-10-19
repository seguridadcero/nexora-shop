PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,display_name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('customer','admin')),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,price_cents INTEGER NOT NULL CHECK(price_cents>=0),stock INTEGER NOT NULL CHECK(stock>=0),image_path TEXT,supplier_product_id TEXT UNIQUE,min_allowed_price_cents INTEGER,is_limited_edition INTEGER NOT NULL DEFAULT 0,max_per_customer INTEGER,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES users(id),status TEXT NOT NULL CHECK(status IN ('draft','confirmed')),total_cents INTEGER NOT NULL CHECK(total_cents>=0),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY,order_id INTEGER NOT NULL REFERENCES orders(id),product_id INTEGER NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL CHECK(quantity>0),unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=0));
CREATE TABLE IF NOT EXISTS integrations (id INTEGER PRIMARY KEY,provider_code TEXT NOT NULL UNIQUE,base_url TEXT NOT NULL,enabled INTEGER NOT NULL,last_successful_sync_at TEXT);
CREATE TABLE IF NOT EXISTS product_sync_state (product_id INTEGER PRIMARY KEY REFERENCES products(id),supplier_product_id TEXT NOT NULL UNIQUE,source_version INTEGER NOT NULL,source_updated_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL UNIQUE REFERENCES users(id),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cart_items (id INTEGER PRIMARY KEY,cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,product_id INTEGER NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL CHECK(quantity>0),unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=0),UNIQUE(cart_id,product_id));

CREATE TABLE IF NOT EXISTS payment_methods (id INTEGER PRIMARY KEY,customer_id INTEGER NOT NULL REFERENCES users(id),brand TEXT NOT NULL,last4 TEXT NOT NULL CHECK(length(last4)=4),exp_month INTEGER NOT NULL,exp_year INTEGER NOT NULL,label TEXT NOT NULL,is_default INTEGER NOT NULL DEFAULT 1,UNIQUE(customer_id,label));
CREATE TABLE IF NOT EXISTS order_payments (order_id INTEGER PRIMARY KEY REFERENCES orders(id),payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),status TEXT NOT NULL CHECK(status='simulated'),created_at TEXT NOT NULL);
