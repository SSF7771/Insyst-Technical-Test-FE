# Insyst Techincal Test - FE

## Setup & Instalasi

### 1. Instalasi Dependencies
Jalankan perintah berikut di direktori root proyek untuk menginstal React, Tailwind CSS, dan dependensi lainnya:

```bash
npm install
```

### 2. Konfigurasi `vite.config.js` (PENTING)
Agar Vite tidak me-refresh halaman otomatis saat `json-server` menulis data ke `db.json`, pastikan file `db.json` diabaikan oleh file watcher Vite.

Buka **`vite.config.js`** dan sesuaikan:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/db.json'], // Mencegah reload halaman saat booking berhasil
    },
  },
});
```

---

## Menyiapkan Mock API (`json-server`)

### Struktur `db.json`
Buat file bernama **`db.json`** di root direktori proyek dengan struktur data awal berikut:

```json
{
  "rooms": [
    {
      "id": 1,
      "name": "Meeting Room Alpha",
      "capacity": 10,
      "pricePerHour": 150000,
      "facilities": [
        "Projector",
        "Whiteboard",
        "AC"
      ],
      "image": "satu.jpg"
    },
    {
      "id": 2,
      "name": "Boardroom Beta",
      "capacity": 6,
      "pricePerHour": 100000,
      "facilities": [
        "TV Screen",
        "AC"
      ],
      "image": "dua.jpg"
    },
    {
      "id": 3,
      "name": "Conference Hall Gamma",
      "capacity": 25,
      "pricePerHour": 350000,
      "facilities": [
        "Sound System",
        "Projector",
        "AC"
      ],
      "image": "tiga.jpg"
    }
  ],
  "slots": [
    {
      "id": 1,
      "roomId": 1,
      "time": "09:00 - 10:00",
      "isAvailable": false
    },
    {
      "id": 2,
      "roomId": 1,
      "time": "10:00 - 11:00",
      "isAvailable": true
    },
    {
      "id": 3,
      "roomId": 1,
      "time": "13:00 - 14:00",
      "isAvailable": false
    },
    {
      "id": 4,
      "roomId": 2,
      "time": "09:00 - 10:00",
      "isAvailable": true
    },
    {
      "id": 5,
      "roomId": 2,
      "time": "11:00 - 12:00",
      "isAvailable": true
    },
    {
      "id": 6,
      "roomId": 3,
      "time": "13:00 - 15:00",
      "isAvailable": true
    }
  ],
  "bookings": []
}
```

### Menjalankan Server
Jalankan perintah berikut di terminal:

```bash
# Terminal 1: untuk json-server
npx json-server@0.17.4 --watch db.json --port 3001

# Terminal 2: untuk frontend (React Vite)
npm run dev
```

*Base URL API yang digunakan frontend:* `http://localhost:3001`

---

## Alur Kerja Sistem & Penggunaan Endpoint

Aplikasi ini ada Step 1 s/d 5 dengan endpoint sebagai berikut:

```
[ Step 1: Pilih Ruangan ]
  GET /rooms
[ Step 2: Pilih Jadwal ] 
   GET /slots?roomId={id} (Filter slot per ruangan & auto-select)
[ Step 3: Isi Data Pemesan ] 
  Validasi Form (Nama, Email Regex, Max Capacity)
[ Step 4: Konfirmasi ] 
  Ringkasan Pesanan & Tombol Bayar
[ Submit Booking ] 
  1. POST /bookings (Simpan data transaksi)
  2. PATCH /slots/:id (Ubah isAvailable: false)
[ Step 5: Selesai ] 
  Menampilkan Kode Booking
```

### Detail Endpoint API

| Method | Endpoint | Fungsi | Payload / Respon |
| **GET** | `/rooms` | Mengambil seluruh daftar ruangan yang tersedia saat komponen pertama kali dimuat. | Array objek `Room`. |
| **GET** | `/slots?roomId={roomId}` | Mengambil slot jam berdasarkan ID ruangan yang dipilih pengguna di Step 1. | Array objek `Slot` yang terfilter. |
| **POST** | `/bookings` | Menyimpan data booking baru yang dibuat pengguna di Step 4. | **Payload:** `{ bookingCode, roomId, slotId, date, name, email, phone, participants }` |
| **PATCH**| `/slots/:slotId` | Memperbarui ketersediaan slot yang dipesan agar tidak bisa dipesan kembali oleh pengguna lain. | **Payload:** `{ isAvailable: false }` |

---

## State Management Penting

- `step`: Mengontrol tampilan tahapan form aktif (1 = Ruangan, 2 = Tanggal/Slot, 3 = Formulir, 4 = Konfirmasi, 5 = Sukses).
- `selectedRoom`: Objek ruangan yang dipilih dari `/rooms`.
- `slots`: Daftar slot waktu dari `/slots?roomId=...`.
- `selectedSlot`: Slot jam yang dipilih. Terdapat `useEffect` yang otomatis memilih slot pertama yang berstatus `isAvailable: true`.
- `formData`: Menyimpan input identitas user yang melakukan booking ruangan (`name`, `email`, `phone`, `participants`).
- `bookingResult`: Menyimpan data respon dari server setelah `POST /bookings` berhasil untuk ditampilkan di Step 5.
```
