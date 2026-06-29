<!-- BEGIN:nextjs-agent-rules -->
# 🏆 CETAK BIRU UTAMA: VAR-Street Bets (Versi Mobile P2P)

**Target Hackathon:** Tether Developers Cup 2026 (Prize Pool: 8.000 USDt)  
**Fokus Kategori:** Cup Champion (Integrasi Pears, QVAC, dan WDK)  
**Tema:** Aplikasi Nonton Bareng & Micro-Betting Offline

---

## 1. Konsep Utama
**"VAR-Street Bets"** adalah aplikasi micro-betting Peer-to-Peer (P2P) yang berjalan 100% offline, dirancang khusus untuk momen nonton bareng sepak bola. Aplikasi ini mengubah jeda waktu keputusan VAR (Video Assistant Referee) yang membosankan menjadi pasar taruhan instan berisiko tinggi.

Sistem ini memecahkan masalah **"Stadion Tanpa Sinyal" (Offline Mesh)** dan **"Kepercayaan terhadap Bandar" (Oracle Trust)** dengan menggunakan arsitektur desentralisasi berbasis *Optimistic Escrow* dan hukuman penalti (*Slashing*).

---

## 2. Tech Stack (Sesuai Aturan Hackathon)
*   **Framework Frontend:** React Native (Expo) **ATAU** Next.js + Capacitor (agar bisa langsung di-build menjadi file `.apk` Android).
*   **Styling:** Nativewind / Tailwind CSS (Desain barebones/standar AI, mode gelap, fokus ke fungsi bukan kosmetik).
*   **State Management:** Zustand (Sangat krusial untuk mengatur status Escrow yang berjalan di latar belakang tanpa memblokir UI).
*   **Jaringan P2P:** Pears SDK (Bare/Holepunch) – Untuk koneksi mesh offline antar-HP via Wi-Fi lokal / Bluetooth.
*   **Otak AI (RAG):** QVAC SDK – Inferensi LLM lokal murni di HP pengguna tanpa API Cloud.
*   **Kripto/Keuangan:** WDK (Wallet Development Kit) – Dompet self-custodial untuk mengunci (*Stake*) dan mencairkan USDt.

---

## 3. Aktor Utama
*   **Bandar (Host):** Pengguna yang memasukkan insiden ke AI Lokal, menciptakan peluang (*odds*), membuka pasar taruhan, dan wajib mengunci uang jaminan (*Stake*).
*   **Petaruh (Punter):** Pengguna di sekitar Bandar (terhubung via Pears) yang menerima siaran pasar taruhan dan memasang taruhan USDt mereka.

---

## 4. Arsitektur Sistem & Alur Logika Terpadu

### Fase 1: Pembuatan Pasar & Peluang AI Lokal (QVAC)
1. Terjadi insiden di TV (misal: Cek VAR untuk Penalti).
2. Bandar mengetik insiden tersebut ke dalam aplikasi.
3. **Eksekusi QVAC:** Aplikasi menjalankan model AI secara lokal yang sudah diisi dokumen Aturan FIFA. AI mengeluarkan probabilitas (persentase) insiden.
4. Aplikasi secara otomatis mengubah probabilitas tersebut menjadi nilai *Odds* taruhan (Perkalian Hadiah).

### Fase 2: Staking & Pencegahan Tabrakan Bandar (WDK + Pears)
1. Untuk membuka pasar, Bandar wajib mengunci Jaminan (misal: 10 USDt) menggunakan WDK.
2. Aplikasi membuat ID Unik kejadian (contoh: `MU_LIV_75_VAR`).
3. **Pencegahan Bandar Ganda (Race Condition):** Jika ada dua orang di satu lokasi ingin menjadi Bandar di detik yang sama, jaringan Pears akan mengecek ID Unik dan jumlah jaminannya. Sistem akan otomatis menolak Bandar yang lambat, atau memenangkan Bandar dengan jaminan USDt terbesar.
4. Pasar resmi disiarkan (*broadcast*) ke seluruh HP Petaruh di area tersebut.

### Fase 3: Taruhan & Anti-Pencurian Start (Anti-Frontrunning)
1. Petaruh memasang taruhan. Saldo WDK mereka terkunci sementara di Smart Contract lokal (Escrow).
2. **Batas Waktu Dinamis (Freeze Button):** Maksimal waktu taruhan adalah 2 menit. Namun, saat wasit di TV meniup peluit keputusan, Bandar **WAJIB** langsung menekan tombol merah **FREEZE MARKET**. Layar taruhan di semua HP petaruh langsung terkunci.
3. **Rem Darurat (Circuit Breaker):** Jika Bandar telat menekan tombol, dan ada minimal 3 Petaruh menekan tombol **EMERGENCY FREEZE**, pasar otomatis dikunci oleh jaringan P2P.

### Fase 4: Resolusi Asinkron & Hukuman (Game Theory)
1. Bandar memasukkan hasil akhir (misal: `"TIDAK PENALTI"`).
2. **Konsensus P2P:** Petaruh diberi waktu 60 detik untuk Menerima (*Accept*) atau Mengajukan Sengketa (*Dispute*).
3. **Jalur Aman (Tanpa Sengketa):** Mayoritas setuju -> WDK mencairkan dana ke pemenang secara offline -> Status Pasar = `CLOSED`.
4. **Jalur Sengketa (Dispute):** Jika disengketakan, dana dikunci (*Frozen*). UI kembali bersih sehingga pengguna bisa lanjut bertaruh untuk insiden berikutnya (*Asynchronous Escrow*).
5. **Hakim Internet:** Saat HP terhubung ke internet kembali, aplikasi memanggil API Olahraga Publik untuk melihat hasil dan timestamp resmi.
6. **Hukuman Pemiskinan (Slashing):**
    *   Jika Bandar berbohong: Jaminan Bandar disita dan dibagikan ke Petaruh.
    *   Jika Petaruh berbohong: Saldo WDK Petaruh dipotong 10% untuk diberikan ke Bandar.
    *   Jika ketahuan *Front-running* (Jam taruhan Petaruh masuk setelah keputusan resmi): Taruhan dibatalkan, kena denda 10%.

---

## 5. Model Data Utama (Untuk JSON Pears & Zustand)

### Objek `Market_State` (Disiarkan via Pears)
```json
{
  "market_id": "MU_LIV_75_VAR", 
  "creator_pubkey": "0xWDK_Pub_Key_Bandar",
  "incident_type": "PENALTY_CHECK",
  "qvac_odds": {
    "YES": 5.0,
    "NO": 1.2
  },
  "status": "OPEN", // 'OPEN' | 'FROZEN_BETTING' | 'AWAITING_CONSENSUS' | 'DISPUTED_FROZEN' | 'CLOSED'
  "created_timestamp": 1718000000,
  "total_pool": 150,
  "bandar_stake": 10
}
```

### Objek `Bet_Record` (Transaksi Petaruh)
```json
{
  "bet_id": "bet_001",
  "market_id": "MU_LIV_75_VAR",
  "punter_pubkey": "0xWDK_Punter_01",
  "choice": "NO",
  "amount_usdt": 5,
  "timestamp": 1718000045 // Presisi milidetik untuk validasi anti-frontrunning
}
```

---

## 6. Fase Eksekusi Jam Hustle (Vibe Coding)
*   **[Fase 1] Kerangka UI & Mock State:** Bangun layar Bandar Dashboard dan Punter View yang sangat fungsional. Pasang tombol-tombolnya dan gunakan Zustand untuk mensimulasikan perubahan status antar layar.
*   **[Fase 2] Integrasi Pears (Inti P2P):** Ini adalah prioritas utama untuk versi mobile. Sambungkan perangkat lokal agar `Market_State` bisa tersinkronisasi murni lewat jaringan mesh tanpa database terpusat.
*   **[Fase 3] Integrasi WDK (Brankas):** Masukkan dompet kripto lokal, buat fungsi lock, release, dan slash saldo.
*   **[Fase 4] Integrasi QVAC (Otak AI):** Masukkan model LLM ringan ke aplikasi untuk membaca logika aturan FIFA dan memuntahkan probabilitas Odds.
*   **[Fase 5] Hakim API (Resolusi Sengketa):** Buat fungsi pengecekan API palsu (mock endpoint) yang **HANYA** berjalan jika `navigator.onLine === true` untuk menyelesaikan pasar yang berstatus `DISPUTED_FROZEN`.
<!-- END:nextjs-agent-rules -->
