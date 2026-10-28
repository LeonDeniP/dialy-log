# Backend Daily Log

Backend menggunakan Express dan PostgreSQL. PostgreSQL bukan bagian dari XAMPP; XAMPP dapat dipakai untuk menyajikan frontend, sedangkan PostgreSQL dan Node.js berjalan sebagai layanan terpisah. Backend ini menggunakan database PostgreSQL standar dan tidak memerlukan ekstensi PostgreSQL tambahan.

## Persyaratan

- Node.js 20 atau lebih baru.
- PostgreSQL 14 atau lebih baru.
- npm (termasuk dalam instalasi Node.js).

## Menyiapkan PostgreSQL

1. Pasang PostgreSQL untuk Windows, lalu buat database `daily_log` melalui pgAdmin atau `psql`.
2. Jalankan `database/schema.sql` pada database tersebut. Skema membuat tabel laporan, indeks pencarian waktu, dan trigger `LISTEN/NOTIFY` untuk real-time.
3. Salin `backend/.env.example` menjadi `backend/.env`. Isi kredensial lokal (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) atau isi `DATABASE_URL`. Atur `ADMIN_USERNAME`, `ADMIN_PASSWORD` dengan kredensial unik yang kuat, serta `ADMIN_SESSION_SECRET` dengan nilai acak minimal 32 karakter. Jangan gunakan nilai contoh pada server yang dapat diakses orang lain. Untuk deployment HTTPS, set `COOKIE_SECURE=true`; untuk server PostgreSQL yang mewajibkan TLS, set `PGSSL=true`.
4. Dari folder `backend`, jalankan `npm install` kemudian `npm run dev`.
5. Untuk pengembangan, jalankan `npm run dev` dari folder `frontend`. Untuk XAMPP, set `VITE_API_URL=http://localhost:5000/api`, jalankan `npm run build`, lalu salin isi `frontend/dist` ke `C:\xampp\htdocs`. Atur `FRONTEND_ORIGIN=http://localhost` pada backend.

Periksa backend dan koneksi database di `GET http://localhost:5000/api/health`. Kredensial jangan dimasukkan ke frontend atau commit ke repository. Form laporan umum tetap bisa mengirim laporan baru; riwayat, detail laporan, impor, penghapusan, dan real-time hanya dapat diakses setelah login admin.

## Variabel lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `PORT` | Tidak | Port backend; bawaan `5000`. |
| `PGHOST` | Ya* | Host PostgreSQL; bawaan `localhost`. |
| `PGPORT` | Ya* | Port PostgreSQL; bawaan `5432`. |
| `PGUSER` | Ya* | Pengguna PostgreSQL. |
| `PGPASSWORD` | Ya* | Password PostgreSQL; jangan commit ke repository. |
| `PGDATABASE` | Ya* | Nama database; bawaan `daily_log`. |
| `DATABASE_URL` | Alternatif | URL koneksi PostgreSQL lengkap. Bila diisi, opsi `PG*` tidak dipakai. |
| `PGSSL` | Tidak | Isi `true` jika server PostgreSQL memerlukan TLS. |
| `FRONTEND_ORIGIN` | Ya | Origin frontend yang diizinkan, dipisahkan koma bila ada lebih dari satu. |
| `ADMIN_USERNAME` | Ya | Username login admin. |
| `ADMIN_PASSWORD` | Ya | Password login admin. Gunakan password unik. |
| `ADMIN_SESSION_SECRET` | Ya | Secret acak minimal 32 karakter untuk menandatangani sesi. |
| `COOKIE_SECURE` | Tidak | Isi `true` saat backend dilayani melalui HTTPS. |

\*Wajib kecuali `DATABASE_URL` digunakan. Salin `.env.example` menjadi `.env` untuk pengaturan lokal.

Kunci backend seperti `ADMIN_PASSWORD`, `PGPASSWORD`, dan `ADMIN_SESSION_SECRET` hanya boleh disimpan di `.env` pada server/developer lokal. File `.env` sudah diblokir oleh `.gitignore`.

## Menjalankan pengembangan

```powershell
cd backend
npm install
npm run dev
```

Server dapat dicek dengan:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

## Build dan deployment

Tidak ada tahap build untuk backend JavaScript. Jalankan sebagai proses layanan dengan Node.js:

```powershell
cd backend
npm start
```

Untuk deployment produksi, gunakan process manager atau service Windows, konfigurasi HTTPS pada reverse proxy, isi variabel lingkungan dari secret manager/layanan hosting, dan jangan membagikan `.env` atau nilai secret melalui repository.

Cookie sesi `HttpOnly`, `SameSite=Strict`, berumur 8 jam, dan sesi dibatalkan saat logout. Login dibatasi maksimal 10 percobaan per IP dalam 15 menit. Tetap gunakan HTTPS sebelum membuka aplikasi ke internet.

## Koneksi melalui VS Code

Ekstensi **Database Client** (`cweijan.vscode-postgresql-client2`) dapat dipakai untuk melihat tabel dan menjalankan SQL; ekstensi sudah terpasang di VS Code pada mesin pengembangan. Buka panel **Database**, pilih **+**, lalu **PostgreSQL**. Gunakan host `localhost`, port `5432`, database `daily_log`, user `postgres`, dan password dari `PGPASSWORD` pada `backend/.env`. Ekstensi hanya untuk administrasi/pengembangan, bukan syarat agar aplikasi web berjalan.

## API

- `POST /api/admin/login` — login menggunakan JSON `{ "username": "...", "password": "..." }`.
- `GET /api/admin/session` — memeriksa sesi admin aktif.
- `POST /api/admin/logout` — mengakhiri sesi admin.
- `GET /api/reports?limit=100` — mengambil laporan terbaru (maksimal 200).
- `GET /api/reports/:id` — mengambil satu laporan.
- `POST /api/reports` — membuat laporan dari formulir web.
- `DELETE /api/reports/:id` — menghapus laporan.
- `POST /api/import/reports` — impor satu file melalui multipart field `file`.
- `GET /api/events` — stream Server-Sent Events; event `report-change` dikirim saat data berubah.

Import menerima `.xlsx`, `.csv`, dan `.json` sampai 5 MB. File Excel lama `.xls` perlu disimpan ulang sebagai `.xlsx` atau `.csv`. JSON dapat berupa array object atau object yang memiliki properti `data` berisi array. Baris pertama Excel/CSV menjadi header. Nama kolom umum dikenali otomatis, termasuk `Date`/`Tanggal`, `Shift`, `TOA On Duty`, `MCR On Duty`, `Live Program`/`Feed`, `Status`, `CAR Device`, `MCR Device`, `QC Device`, `Event Title`, `Description`, dan `Solution`. Header khusus dapat dipetakan pada form impor dengan JSON yang key-nya nama field backend (contoh `report_date`) dan value-nya nama header di file. Header yang tidak dikenal dan tidak dipetakan diabaikan. Tanggal menerima format ISO (`YYYY-MM-DD`), `DD/MM/YYYY`, `DD-MM-YYYY`, serta tanggal Excel.

Setiap baris harus berisi tanggal, shift, MCR on duty, dan nama program/feed; status yang diterima `OK`, `Trouble`, `Maintenance`, atau `Trouble (Ext)`. Personel TOA boleh kosong dan dapat berupa daftar dipisah koma/titik koma/pipa, JSON, atau array. Impor memakai satu transaksi: bila ada baris tidak valid atau penyimpanan gagal, seluruh batch dibatalkan. Impor menambahkan laporan baru, tidak mengubah atau menghapus laporan lama.

## Real-time

Trigger PostgreSQL menerbitkan notifikasi pada INSERT/UPDATE/DELETE. Backend meneruskan notifikasi ke browser melalui SSE; halaman **Riwayat & Impor** memperbarui daftar saat ada perubahan, termasuk perubahan yang dibuat backend lain yang memakai database sama. Pastikan `database/schema.sql` sudah dijalankan agar trigger tersedia.
