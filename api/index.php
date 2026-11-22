<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

function respond($success, $message = '', $data = null, $status = 200) {
    http_response_code($status);
    $result = ['success' => $success, 'message' => $message];
    if ($data !== null) $result['data'] = $data;
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) respond(false, 'Data yang dikirim tidak valid.', null, 400);
    return $data;
}

function rupiah_number($value) {
    return is_numeric($value) ? (int)$value : 0;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET' && $action === 'dashboard') {
        $products = $pdo->query("SELECT id, name, category, price, stock FROM products WHERE is_active = 1 ORDER BY name ASC")->fetchAll();
        $stats = $pdo->query("SELECT COALESCE(SUM(total), 0) AS sales_today, COUNT(*) AS transactions_today, COALESCE(AVG(total), 0) AS average_sale FROM sales WHERE DATE(created_at) = CURDATE()")->fetch();
        $stats['product_total'] = count($products);
        $recent = $pdo->query("SELECT id, invoice_code, total, paid, change_amount, created_at FROM sales ORDER BY id DESC LIMIT 12")->fetchAll();
        respond(true, 'Data dashboard berhasil dimuat.', ['products' => $products, 'stats' => $stats, 'sales' => $recent]);
    }

    if ($method === 'GET' && $action === 'sales') {
        $sales = $pdo->query("SELECT id, invoice_code, total, paid, change_amount, created_at FROM sales ORDER BY id DESC LIMIT 100")->fetchAll();
        respond(true, 'Riwayat penjualan berhasil dimuat.', $sales);
    }

    if ($method === 'POST') {
        $input = read_json();
        $action = $input['action'] ?? '';

        if ($action === 'save_product') {
            $id = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : 0;
            $name = trim((string)($input['name'] ?? ''));
            $category = trim((string)($input['category'] ?? ''));
            $price = rupiah_number($input['price'] ?? 0);
            $stock = rupiah_number($input['stock'] ?? -1);
            if ($name === '') respond(false, 'Nama produk wajib diisi.', null, 422);
            if ($price <= 0) respond(false, 'Harga harus lebih dari Rp0.', null, 422);
            if ($stock < 0) respond(false, 'Stok tidak boleh kurang dari 0.', null, 422);

            if ($id > 0) {
                $stmt = $pdo->prepare("UPDATE products SET name = ?, category = ?, price = ?, stock = ?, is_active = 1 WHERE id = ?");
                $stmt->execute([$name, $category, $price, $stock, $id]);
                if ($stmt->rowCount() === 0) {
                    $check = $pdo->prepare("SELECT id FROM products WHERE id = ?");
                    $check->execute([$id]);
                    if (!$check->fetch()) respond(false, 'Produk tidak ditemukan.', null, 404);
                }
                respond(true, 'Produk berhasil diperbarui.');
            }

            $stmt = $pdo->prepare("INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $category, $price, $stock]);
            respond(true, 'Produk berhasil ditambahkan.');
        }

        if ($action === 'delete_product') {
            $id = (int)($input['id'] ?? 0);
            if ($id < 1) respond(false, 'ID produk tidak valid.', null, 422);
            $stmt = $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() < 1) respond(false, 'Produk tidak ditemukan atau sudah dinonaktifkan.', null, 404);
            respond(true, 'Produk berhasil dinonaktifkan. Riwayat transaksi tetap tersimpan.');
        }

        if ($action === 'checkout') {
            $items = $input['items'] ?? [];
            $paid = rupiah_number($input['paid'] ?? -1);
            if (!is_array($items) || count($items) === 0) respond(false, 'Keranjang masih kosong.', null, 422);
            if ($paid < 0) respond(false, 'Jumlah pembayaran tidak valid.', null, 422);

            $pdo->beginTransaction();
            $selected = [];
            $total = 0;
            $selectProduct = $pdo->prepare("SELECT id, name, price, stock FROM products WHERE id = ? AND is_active = 1 FOR UPDATE");
            foreach ($items as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $qty = (int)($item['qty'] ?? 0);
                if ($productId < 1 || $qty < 1) {
                    $pdo->rollBack();
                    respond(false, 'Rincian produk atau jumlah barang tidak valid.', null, 422);
                }
                $selectProduct->execute([$productId]);
                $product = $selectProduct->fetch();
                if (!$product) {
                    $pdo->rollBack();
                    respond(false, 'Salah satu produk sudah tidak tersedia.', null, 422);
                }
                if ((int)$product['stock'] < $qty) {
                    $pdo->rollBack();
                    respond(false, 'Stok ' . $product['name'] . ' tidak mencukupi. Stok tersedia: ' . $product['stock'], null, 422);
                }
                $price = (int)$product['price'];
                $subtotal = $price * $qty;
                $total += $subtotal;
                $selected[] = ['product_id' => $productId, 'name' => $product['name'], 'price' => $price, 'qty' => $qty, 'subtotal' => $subtotal];
            }

            if ($paid < $total) {
                $pdo->rollBack();
                respond(false, 'Uang yang diterima masih kurang dari total pembayaran.', null, 422);
            }

            $change = $paid - $total;
            $invoice = 'BR-' . date('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));
            $insertSale = $pdo->prepare("INSERT INTO sales (invoice_code, total, paid, change_amount) VALUES (?, ?, ?, ?)");
            $insertSale->execute([$invoice, $total, $paid, $change]);
            $saleId = (int)$pdo->lastInsertId();

            $insertItem = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, product_name, price, qty, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
            $updateStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            foreach ($selected as $item) {
                $insertItem->execute([$saleId, $item['product_id'], $item['name'], $item['price'], $item['qty'], $item['subtotal']]);
                $updateStock->execute([$item['qty'], $item['product_id']]);
            }
            $pdo->commit();
            respond(true, 'Transaksi berhasil disimpan ke database.', [
                'invoice_code' => $invoice,
                'total' => $total,
                'paid' => $paid,
                'change_amount' => $change,
                'created_at' => date('Y-m-d H:i:s'),
                'items' => $selected
            ]);
        }
    }

    respond(false, 'Aksi tidak dikenali.', null, 404);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Kasir Bu Rina API: ' . $e->getMessage());
    respond(false, 'Terjadi kesalahan pada server. Periksa konfigurasi dan struktur database.', null, 500);
}
