-- Database Aplikasi Kasir Bu Rina
-- Import file ini melalui phpMyAdmin (XAMPP).
CREATE DATABASE IF NOT EXISTS db_kasir_bu_rina
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_kasir_bu_rina;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT '',
  price INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_active_name (is_active, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_code VARCHAR(40) NOT NULL UNIQUE,
  total BIGINT UNSIGNED NOT NULL,
  paid BIGINT UNSIGNED NOT NULL,
  change_amount BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NULL,
  product_name VARCHAR(100) NOT NULL,
  price INT UNSIGNED NOT NULL,
  qty INT UNSIGNED NOT NULL,
  subtotal BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_sale_items_sale_id (sale_id)
) ENGINE=InnoDB;

-- Data awal contoh. Dijalankan hanya saat tabel products masih kosong.
INSERT INTO products (name, category, price, stock)
SELECT * FROM (
  SELECT 'Nasi Goreng', 'Makanan', 15000, 30 UNION ALL
  SELECT 'Mie Goreng', 'Makanan', 13000, 25 UNION ALL
  SELECT 'Ayam Geprek', 'Makanan', 18000, 20 UNION ALL
  SELECT 'Mie Rebus', 'Makanan', 12000, 20 UNION ALL
  SELECT 'Es Teh Manis', 'Minuman', 5000, 50 UNION ALL
  SELECT 'Es Jeruk', 'Minuman', 7000, 35 UNION ALL
  SELECT 'Kopi', 'Minuman', 6000, 30 UNION ALL
  SELECT 'Air Mineral', 'Minuman', 4000, 40 UNION ALL
  SELECT 'Gorengan', 'Camilan', 2000, 60
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
