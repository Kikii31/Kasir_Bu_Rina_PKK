<?php
// Konfigurasi koneksi MySQL XAMPP untuk Aplikasi Kasir Bu Rina.
// Pengaturan bawaan XAMPP biasanya: user root dan password kosong.
$host = 'localhost';
$database = 'db_kasir_bu_rina';
$username = 'root';
$password = '';

$dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal. Periksa MySQL XAMPP, nama database, dan pengaturan api/config.php.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
