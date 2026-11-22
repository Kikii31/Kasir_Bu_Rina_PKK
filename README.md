# Aplikasi Kasir Bu Rina

Aplikasi kasir sederhana untuk tugas RPL. Frontend menggunakan HTML, CSS, dan JavaScript yang dipisah. PHP digunakan sebagai API/konektor ke MySQL melalui PDO.

## Fitur

- Menampilkan produk dan harga dari database MySQL.
- Mencari produk dan menambahkannya ke keranjang.
- Menghitung subtotal, total, pembayaran, dan kembalian.
- Menyimpan transaksi dan rincian produk ke database.
- Mengurangi stok secara otomatis setelah transaksi berhasil.
- Menambah, mengubah, dan menonaktifkan produk.
- Menampilkan ringkasan penjualan hari ini dan riwayat transaksi.
- Tampilan responsif untuk komputer dan HP.

## Struktur folder

```text
Kasir_Bu_Rina/
├── index.html
├── README.md
├── assets/
│   ├── css/style.css
│   └── js/app.js
├── api/
│   ├── config.php
│   └── index.php
└── database/
    └── kasir_bu_rina.sql
```

## Cara memasang di XAMPP

1. Pastikan XAMPP sudah terpasang.
2. Salin folder `Kasir_Bu_Rina` ke dalam folder `C:\xampp\htdocs\`.
3. Buka XAMPP Control Panel, lalu tekan **Start** pada Apache dan MySQL.
4. Buka `http://localhost/phpmyadmin` di browser.
5. Pilih menu **Import**.
6. Pilih file `database/kasir_bu_rina.sql` dari folder aplikasi, lalu tekan **Import/Kirim**.
7. Buka `api/config.php`. Pengaturan awal sudah sesuai konfigurasi umum XAMPP:

   ```php
   $host = 'localhost';
   $database = 'db_kasir_bu_rina';
   $username = 'root';
   $password = '';
   ```

   Apabila MySQL XAMPP kamu menggunakan password, ubah nilai `$password` sesuai password MySQL tersebut.
8. Jalankan aplikasi melalui alamat berikut (jangan dibuka dengan klik dua kali file HTML):

   `http://localhost/Kasir_Bu_Rina/`

## Struktur database

- `products`: data produk, kategori, harga, stok, dan status aktif.
- `sales`: data utama transaksi seperti nomor invoice, total, uang diterima, dan kembalian.
- `sale_items`: rincian produk pada setiap transaksi.

Script SQL sudah membuat database `db_kasir_bu_rina` dan memasukkan beberapa produk contoh. Jika ingin mengulang dari awal, hapus database tersebut melalui phpMyAdmin lalu import kembali file SQL.

## Catatan

- Data transaksi dan produk tersimpan di MySQL, bukan hanya di browser.
- Produk yang dinonaktifkan tidak ditampilkan pada pilihan kasir, tetapi riwayat penjualannya tetap disimpan.
- Font Poppins dimuat dari Google Fonts. Bila internet tidak tersedia, browser menggunakan font cadangan.
- Untuk penggunaan nyata dengan banyak kasir, aplikasi perlu ditambah login, hak akses, dan pengamanan operasional lebih lanjut.
