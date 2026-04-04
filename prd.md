PRODUCT REQUIREMENTS DOCUMENT
CHICKEN MART
1. Ringkasan Produk

Chicken Mart adalah aplikasi web operasional untuk pemilik warung dan UMKM kecil di Indonesia. Produk ini mengintegrasikan kasir cepat (POS), manajemen inventaris barang jadi, pencatatan hutang pelanggan (kasbon), laporan usaha sederhana, dan pengaturan profil warung dalam satu sistem berbasis akun (workspace).

Aplikasi dirancang untuk:

mudah digunakan tanpa pengalaman software
cepat saat operasional (jam ramai)
optimal di tablet / layar sentuh
membantu pemilik usaha memahami bisnisnya tanpa akuntansi kompleks
2. Problem Statement

Pemilik warung masih menggunakan:

buku tulis
kalkulator
ingatan
WhatsApp
Dampak:
transaksi tidak tercatat rapi
stok tidak real-time
kasbon sulit ditagih
laporan tidak konsisten
sulit ambil keputusan bisnis
3. Tujuan Produk
Tujuan Utama
Digitalisasi operasional warung secara sederhana
Mengurangi human error
Memberikan insight usaha secara cepat
Tujuan MVP
Kasir
Inventaris
Hutang
Laporan dasar
Visi Jangka Panjang

Menjadi sistem operasional UMKM (business OS)

4. Target Pengguna
Primary Users:
Warung ayam / fried chicken
Warung makan kecil
Warung kelontong
UMKM rumahan
Karakteristik:
tidak terbiasa software kompleks
butuh input cepat
lebih suka UI simpel
sering pakai WhatsApp
5. Value Proposition
⚡ Kasir cepat (tap-based)
📦 Stok otomatis berkurang
💳 Kasbon tercatat rapi
📊 Laporan mudah dipahami
🏪 Workspace per user
6. Platform & Arsitektur
Platform:
Web App (Tablet-first)
Tech Stack:
Frontend: Next.js
Backend: Node.js (Route Handlers)
Auth: Better Auth
ORM: Drizzle
Database: PostgreSQL
7. Fitur Utama
7.1 Autentikasi & Workspace
Register
Login
Logout
Auto-create store profile
7.2 Dashboard

Menampilkan:

omzet hari ini
jumlah transaksi
stok menipis
total kasbon
transaksi terbaru
produk perlu perhatian
7.3 Kasir (POS)

Fitur:

katalog produk
search produk
filter kategori
add to cart (1 klik)
ubah quantity
checkout

Metode pembayaran:

Tunai
QRIS
Transfer

Validasi:

cart tidak kosong
stok cukup

Aksi sistem:

simpan transaksi
simpan item
update stok
7.4 Inventaris

Fitur:

tambah produk
edit produk
restock
monitoring stok

Data:

nama
kategori
harga beli/jual
stok
minimum stok
7.5 Buku Hutang

Fitur:

tambah hutang
tandai lunas
reminder

Catatan:

reminder belum terhubung WhatsApp
7.6 Laporan

Periode:

harian
mingguan
bulanan

Metrik:

omzet
HPP
laba kotor
laba bersih
jumlah transaksi
7.7 Pengaturan

Fitur:

edit profil warung
metode pembayaran
stok minimum
reset workspace
8. User Flow
Flow Transaksi
pilih produk
masuk cart
pilih pembayaran
checkout
sistem simpan transaksi & update stok
Flow Hutang
input hutang
simpan
reminder
tandai lunas
9. Edge Cases
Kasir:
double klik checkout
stok berubah saat transaksi
koneksi terputus
Inventaris:
stok negatif
harga kosong
Hutang:
nomor tidak valid
reminder spam
10. Functional Requirements
login system wajib
data terpisah per user
CRUD produk
transaksi berjalan
stok otomatis update
kelola hutang
generate laporan
11. Non-Functional Requirements
respon cepat (<1 detik)
UI sederhana
aman (auth wajib)
responsive
data tersimpan di DB
12. Model Data
Entitas:
users
store_profiles
products
transactions
transaction_items
debts
expenses
Relasi:
user → banyak produk
transaksi → banyak item
user → banyak hutang
13. API
GET /api/bootstrap
POST /api/transactions
POST /api/products
PATCH /api/products/:id
POST /api/products/:id/restock
POST /api/debts
PATCH /api/debts/:id
PUT /api/settings
14. Batasan Produk
belum ada WhatsApp real
belum ada export PDF
belum ada delete data
belum ada multi user
belum ada offline mode
15. Risiko
tergantung internet
user belum terbiasa
human error input
16. Prioritas Pengembangan
High Priority:
CRUD pengeluaran
export PDF
onboarding data awal
Medium:
WhatsApp integration
delete data
Advanced:
multi user
offline mode
17. UX Guidelines
tombol besar (tap-friendly)
warna jelas
feedback cepat
minim klik
18. Backend Specification
Endpoint: POST /transactions

Flow:

validasi cart
cek stok
mulai DB transaction
simpan transaksi
simpan item
update stok
commit
Rule:
wajib auth
atomic transaction
validasi input
19. Database Structure
products:
id
user_id
name
price
stock
transactions:
id
total
payment_method
transaction_items:
product_id
qty
subtotal
20. Success Metrics
jumlah transaksi user
user aktif
retensi
akurasi stok
21. Definisi Sukses

Produk sukses jika:

mudah digunakan
transaksi lancar
data akurat
membantu operasional
22. Roadmap
QRIS integration
WhatsApp real
offline mode
supplier management
AI insight