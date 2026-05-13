# DFM Project Monitor 📊
**Platform monitoring progress project modern — real-time, evidence-based, executive-ready.**

---

## Daftar Isi

- [Tentang Platform](#tentang-platform)
- [Quick Start (Developer)](#quick-start-developer)
- [Panduan Public Dashboard](#panduan-public-dashboard)
- [Panduan Admin Panel](#panduan-admin-panel)
  - [Login](#1-login)
  - [Membuat Project Baru](#2-membuat-project-baru)
  - [Mengelola Project](#3-mengelola-project)
  - [Manajemen Milestones](#4-manajemen-milestones)
  - [Log Aktivitas & Evidence](#5-log-aktivitas--evidence)
  - [Analytics](#6-analytics)
- [Referensi Status & Kategori](#referensi-status--kategori)
- [Stack Teknologi](#stack-teknologi)

---

## Tentang Platform

DFM Project Monitor terdiri dari **dua sisi utama**:

| Sisi | URL | Akses | Fungsi |
|---|---|---|---|
| 🌐 **Public Dashboard** | `localhost:3000` | Semua orang (tanpa login) | Melihat progress semua project secara read-only |
| 🔐 **Admin Panel** | `localhost:3000/admin` | Admin saja (perlu login) | CRUD project, update progress, kelola milestone & evidence |

> **Konsep:** Admin menginput dan mengelola data → Public Dashboard menampilkan hasilnya secara otomatis.

---

## Quick Start (Developer)

### Prasyarat
- Node.js 18+
- PostgreSQL (Homebrew: `brew install postgresql@14`)
- npm

### Setup Pertama Kali

**1. Siapkan Database**
```bash
# Jalankan PostgreSQL
brew services start postgresql@14

# Buat user dan database
psql postgres -c "CREATE USER dfm_user WITH PASSWORD 'dfm_password';"
psql postgres -c "CREATE DATABASE dfm_projects OWNER dfm_user;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE dfm_projects TO dfm_user;"
psql postgres -c "ALTER USER dfm_user CREATEDB;"
```

**2. Setup & Jalankan Backend**
```bash
cd backend
npm install
npx prisma migrate dev --name init   # Buat tabel database
npm run seed                          # Isi data demo
npm run start:dev                     # Jalankan server
```
Backend berjalan di: `http://localhost:3001/api`

**3. Jalankan Frontend**
```bash
# Terminal baru
cd frontend
npm install
npm run dev
```
Frontend berjalan di: `http://localhost:3000`

### Restart Harian
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

### Kredensial Demo
```
Email    : admin@dfm.id
Password : admin123456
```

---

## Panduan Public Dashboard

**URL:** `http://localhost:3000`

Dashboard ini **tidak memerlukan login** dan dapat diakses oleh siapa saja.

### Halaman Utama

```
┌─────────────────────────────────────────────────────┐
│  🟢 LIVE DASHBOARD · 6 Projects                     │
│                                                     │
│  Project Progress Monitor                           │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ 6 Total  │ │ 49% Avg  │ │ 0 Selesai│ │2 Risk  ││
│  │ Projects │ │ Progress │ │ Bln Ini  │ │/ Behind││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  Status: ● On Track 3  ● At Risk 1  ● Behind 1    │
│                                                     │
│  [🔍 Cari project...]     [Semua Kategori ▼]       │
│                                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐         │
│  │ Project A │ │ Project B │ │ Project C │         │
│  │  82% ████ │ │  68% ████ │ │  45% ██░░ │         │
│  └───────────┘ └───────────┘ └───────────┘         │
└─────────────────────────────────────────────────────┘
```

### Cara Menggunakan Filter

| Filter | Cara | Keterangan |
|---|---|---|
| **Pencarian** | Ketik di kolom search | Mencari berdasarkan nama, deskripsi, atau tag |
| **Kategori** | Pilih dari dropdown | Software, AI/ML, IoT, Research, dll |
| **Health Status** | Klik badge di status bar | On Track, At Risk, Behind, Completed |
| **Reset** | Klik tombol `Reset filter` | Hapus semua filter aktif |

### Halaman Detail Project

Klik salah satu project card untuk membuka detail. Tersedia 3 tab:

**Tab Overview**
- Tren progress 14 hari terakhir (line chart)
- Ringkasan milestone (4 milestone terbaru)
- Evidence & lampiran yang pernah diupload admin
- Aktivitas terbaru

**Tab Milestones**
- Daftar lengkap semua milestone beserta status
- Progress bar keseluruhan milestone

**Tab Aktivitas**
- Seluruh history aktivitas yang dicatat admin
- Daftar semua evidence terlampir

> ℹ️ **Public dashboard hanya bisa membaca.** Tidak ada tombol edit atau form apapun.

---

## Panduan Admin Panel

**URL:** `http://localhost:3000/admin`

### 1. Login

1. Buka `http://localhost:3000/auth/login`
2. Masukkan email dan password
3. Klik **Sign In**
4. Sistem akan redirect ke `/admin` secara otomatis

```
Email    : admin@dfm.id
Password : admin123456
```

Setelah login, tampil sidebar navigasi dengan menu:
- **Dashboard** — Overview ringkasan semua project
- **Projects** — Daftar dan manajemen project
- **Analytics** — Chart dan heatmap aktivitas
- **Settings** — Info profil dan platform

---

### 2. Membuat Project Baru

1. Klik menu **Projects** di sidebar
2. Klik tombol **+ New Project** (pojok kanan atas)
3. Isi form:

| Field | Wajib | Keterangan |
|---|---|---|
| **Nama Project** | ✅ | Nama lengkap project |
| **Kategori** | ✅ | Software / AI-ML / IoT / Research / Documentation / Infrastructure |
| **Status** | ✅ | Planning / In Progress / On Hold / Completed / Cancelled |
| **Health Status** | ✅ | On Track / At Risk / Behind / Completed / On Hold |
| **Deskripsi** | — | Penjelasan singkat project |
| **Tanggal Mulai** | — | Tanggal project dimulai |
| **Target Selesai** | — | Deadline project |
| **Progress Awal** | — | Persentase progress saat ini (0–100%) |
| **Tags** | — | Label seperti: Python, API, v2.0 (pisahkan dengan Enter) |
| **Visibility** | ✅ | Public (tampil di dashboard) / Internal (hanya di admin) |
| **GitHub Repo URL** | — | Link repository GitHub |

4. Klik **Create Project**

---

### 3. Mengelola Project

Dari halaman daftar project (`/admin/projects`), klik salah satu project card untuk masuk ke **Project Detail Page**.

Halaman ini memiliki 4 tab: **Overview · Milestones · Activities · Settings**

#### Tab Overview — Update Progress Cepat

```
┌────────────────────────────────────────────────────┐
│  ◯ 68%   Update Progress                           │
│           Geser slider untuk memperbarui            │
│                                                     │
│  ████████████████████░░░░░░░░░░░░  68%             │
│   ────────────────────────⊙───────                  │
│                                    [💾 Simpan 70%] │
│                                                     │
│  ⏱ 18h tersisa  📅 Mulai 15 Jan  🎯 4/6 milestone │
└────────────────────────────────────────────────────┘
```

**Langkah update progress:**
1. Geser slider ke nilai yang diinginkan
2. Tombol **Simpan** akan muncul otomatis
3. Klik **Simpan** — sistem akan merekam snapshot progress

---

### 4. Manajemen Milestones

Klik tab **Milestones** di halaman detail project.

#### Menambah Milestone Baru

1. Klik tombol **+ Tambah Milestone**
2. Isi form:

| Field | Keterangan |
|---|---|
| **Judul** | Nama milestone (wajib) |
| **Deskripsi** | Penjelasan singkat |
| **Target Date** | Tanggal target selesai |
| **Bobot** | Kontribusi milestone terhadap total (5–50%) |

3. Klik **Simpan**

#### Mengganti Status Milestone

Klik **ikon status** di kiri setiap milestone untuk toggle status secara berurutan:

```
⭘ Pending  →  ⏱ In Progress  →  ✅ Completed  →  ⚠️ Delayed  →  (kembali ke Pending)
```

Status **Completed** akan otomatis mengisi tanggal selesai.

#### Menghapus Milestone

Hover pada milestone → klik ikon 🗑️ yang muncul di sisi kanan → konfirmasi.

---

### 5. Log Aktivitas & Evidence

Klik tab **Activities** di halaman detail project.

#### Mencatat Aktivitas Baru

1. Klik tombol **+ Log Aktivitas**
2. Isi form:

| Field | Keterangan |
|---|---|
| **Tipe** | Pilih tipe aktivitas (lihat referensi di bawah) |
| **Judul** | Ringkasan aktivitas (wajib) |
| **Deskripsi** | Detail lebih lanjut |
| **Update Progress** | Toggle ON untuk sekaligus update progress project |

**Tipe Aktivitas yang Tersedia:**

| Tipe | Ikon | Digunakan untuk |
|---|---|---|
| Progress Update | 📈 | Update persentase kemajuan |
| Milestone Reached | 🏆 | Pencapaian milestone |
| Evidence Added | 📎 | Penambahan bukti/dokumen |
| Status Changed | 🔄 | Perubahan status project |
| Note | 💬 | Catatan umum |
| Meeting | 🤝 | Hasil rapat atau diskusi |
| Deployment | 🚀 | Deploy ke staging/production |
| Review | 👁️ | Code review atau evaluasi |

#### Melampirkan Evidence (Bukti/Dokumen)

Di bagian **Evidence / Lampiran** dalam form aktivitas:

**Opsi 1 — Link URL:**
1. Isi kolom **Judul link** (misal: `Laporan Sprint 3`)
2. Isi kolom **URL** (misal: `https://docs.google.com/...`)
3. Klik ikon 🔗

**Opsi 2 — Upload File:**
1. Klik area **Upload file**
2. Pilih file (gambar, PDF, Word, Excel)
3. File akan terupload otomatis

Evidence yang sudah ditambahkan dapat dilihat di:
- Tab **Overview** → bagian "Evidence & Lampiran"
- Tab **Activities** → bagian "Semua Evidence"
- **Public Dashboard** → halaman detail project (view only)

#### Menghapus Aktivitas

Hover pada aktivitas → klik ikon 🗑️ → konfirmasi.

---

### 6. Analytics

Klik menu **Analytics** di sidebar.

| Konten | Keterangan |
|---|---|
| **Milestone Status** | Pie chart distribusi status semua milestone |
| **Progress Trends** | Area chart tren progress 30 hari terakhir |
| **Activity Heatmap** | Kalender aktivitas 90 hari terakhir (seperti GitHub contribution) |

---

### 7. Edit Project

Dari halaman detail project, klik:
- Tombol **Edit Project** (pojok kanan atas), atau
- Tab **Settings** → klik **Edit Project**

Form edit sama seperti form create. Klik **Update Project** untuk menyimpan.

### 8. Hapus Project

1. Masuk ke halaman detail project
2. Klik tab **Settings**
3. Scroll ke bagian **Danger Zone**
4. Klik **Hapus Project Ini**
5. Konfirmasi dengan klik OK

> ⚠️ **Perhatian:** Menghapus project akan menghapus semua milestone, aktivitas, dan evidence secara **permanen dan tidak dapat dibatalkan**.

---

## Referensi Status & Kategori

### Health Status

| Status | Warna | Artinya |
|---|---|---|
| 🟢 **On Track** | Hijau | Project berjalan sesuai rencana |
| 🟡 **At Risk** | Kuning | Ada potensi keterlambatan, perlu perhatian |
| 🔴 **Behind** | Merah | Project terlambat dari jadwal |
| 🔵 **Completed** | Indigo | Project telah selesai |
| ⚫ **On Hold** | Abu-abu | Project ditunda sementara |

### Project Status

| Status | Artinya |
|---|---|
| **Planning** | Masih dalam tahap perencanaan |
| **In Progress** | Sedang aktif dikerjakan |
| **On Hold** | Ditunda |
| **Completed** | Selesai |
| **Cancelled** | Dibatalkan |

### Kategori Project

| Kategori | Contoh |
|---|---|
| **Software** | Web app, mobile app, API |
| **AI/ML** | Model training, NLP, computer vision |
| **IoT** | Sensor network, edge computing |
| **Research** | Paper, riset, eksperimen |
| **Documentation** | Panduan, wiki, technical writing |
| **Infrastructure** | DevOps, CI/CD, server setup |
| **Design** | UI/UX, branding |

### Visibility Project

| Nilai | Tampil di Public Dashboard? |
|---|---|
| **Public** | ✅ Ya |
| **Internal** | ❌ Tidak (hanya terlihat di Admin) |

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Framer Motion |
| Backend | NestJS, TypeScript, Prisma ORM v7 |
| Database | PostgreSQL 14 |
| Realtime | Socket.io (WebSocket) |
| Auth | JWT (Access Token + Refresh Token) |
| Charts | Recharts |
| Upload | Multer (local file storage) |

---

## Tips & Catatan

- **Dark/Light Mode:** Klik ikon ☀️/🌙 di navbar untuk toggle tema
- **Realtime:** Public dashboard akan update otomatis saat admin melakukan perubahan
- **Progress History:** Setiap kali progress diubah, sistem otomatis merekam snapshot untuk chart tren
- **Tags:** Gunakan tag untuk memudahkan filter dan pencarian di public dashboard
- **Bobot Milestone:** Total bobot semua milestone tidak harus 100%, sistem menampilkan sebagai proporsi
