INSERT INTO users VALUES (101,'alice@nexora.example','!disabled-until-auth-implemented','Alice Morgan','customer','2026-01-01T00:00:00Z'),(102,'bob@nexora.example','!disabled-until-auth-implemented','Bob Wilson','customer','2026-01-01T00:00:00Z'),(900,'admin@nexora.example','!disabled-until-auth-implemented','Shop Admin','admin','2026-01-01T00:00:00Z');
INSERT INTO products (id,name,description,price_cents,stock,supplier_product_id,min_allowed_price_cents,is_limited_edition,max_per_customer,created_at,updated_at) VALUES
(1000,'Mechanical Keyboard','Mechanical keyboard',8900,20,NULL,NULL,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1001,'USB-C Hub','USB-C adapter hub',3900,15,NULL,NULL,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1002,'Wireless Mouse','Wireless mouse',2900,25,NULL,NULL,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1003,'27-inch Monitor','27 inch monitor',22900,10,NULL,NULL,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1006,'Limited Edition Keyboard','Limited to one per customer',14900,5,NULL,NULL,1,1,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1100,'Laptop','High-performance laptop',100000,8,'SUP-1001',80000,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z'),
(1101,'Wireless Headphones','Premium wireless headphones',7999,20,'SUP-1002',NULL,0,NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');
INSERT INTO orders VALUES (5001,101,'confirmed',2900,'2026-01-01T00:00:00Z'),(5002,102,'confirmed',22900,'2026-01-01T00:00:00Z');
INSERT INTO order_items VALUES (1,5001,1002,1,2900),(2,5002,1003,1,22900);
INSERT INTO integrations VALUES (1,'supplier','http://supplier:3001',1,'2026-01-01T00:00:00Z');
INSERT INTO product_sync_state VALUES (1100,'SUP-1001',1,'2026-01-01T00:00:00Z'),(1101,'SUP-1002',1,'2026-01-01T00:00:00Z');

INSERT INTO carts(id,customer_id,created_at) VALUES(7001,101,'2026-01-01T00:00:00Z');
INSERT INTO cart_items(id,cart_id,product_id,quantity,unit_price_cents) VALUES(8001,7001,1001,1,3900);
