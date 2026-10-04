/**
 * Types & Domain Interfaces
 * Portal Warga Griya Adika Narama - Blok H
 *
 * Architecture:
 * Household
 *    ↓
 * IPLPayment
 *    ↓
 * FinancialTransaction (Buku Kas & Transaksi)
 *    ↓
 * FinancialSummary (Rekapitulasi Keuangan Dinamis)
 *
 * Designed for:
 * - Local Mock / localStorage (Client-Side Storage Demo)
 * - Cloudflare Workers (Edge API Layer)
 * - Cloudflare D1 / SQLite (Relational Database)
 */

export type TabKey =
  | 'beranda'
  | 'pengumuman'
  | 'agenda'
  | 'komunitas'
  | 'keuangan'
  | 'dokumentasi'
  | 'pengurus'
  | 'admin';

/**
 * ==========================================================
 * 1. HOUSEHOLD / DATA RUMAH WARGA
 * ==========================================================
 */

export type OccupancyStatus =
  | 'huni'
  | 'semi-huni'
  | 'kosong';

export interface Household {
  id: string;

  /**
   * Nomor rumah.
   * Contoh: HA-01, HB-10, HC-05
   */
  houseNumber: string;

  /**
   * Nama kepala keluarga / warga utama.
   */
  residentName: string;

  occupancyStatus: OccupancyStatus;

  /**
   * Status keaktifan data rumah.
   */
  isActive: boolean;

  /**
   * Nomor kontak opsional.
   * Sebaiknya tidak ditampilkan publik.
   */
  phone?: string;

  /**
   * Jumlah anggota keluarga opsional.
   */
  familyMembers?: number;

  notes?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * ==========================================================
 * 2. ANNOUNCEMENT
 * ==========================================================
 */

export interface Announcement {
  id: string;
  title: string;

  category:
    | 'penting'
    | 'iuran'
    | 'keamanan'
    | 'kerja-bakti'
    | 'kegiatan'
    | 'umum';

  date: string;
  author: string;
  content: string;

  isPinned: boolean;

  tagline?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * ==========================================================
 * 3. EVENT / AGENDA
 * ==========================================================
 */

export interface EventAgenda {
  id: string;
  title: string;

  date: string;
  time: string;
  location: string;

  category:
    | 'kerja-bakti'
    | 'rapat'
    | 'sosial'
    | 'keagamaan'
    | 'olahraga'
    | 'posyandu';

  description: string;
  pic: string;

  status:
    | 'upcoming'
    | 'ongoing'
    | 'completed';

  createdAt?: string;
  updatedAt?: string;
}

export type AgendaItem = EventAgenda;

/**
 * ==========================================================
 * 4. PROGRAM KERJA
 * ==========================================================
 */




/**
 * ==========================================================
 * 5. KOMUNITAS BLOK H
 * ==========================================================
 */

export type CommunityGroupCategory = 'atlet' | 'gamers';

export interface CommunityGroup {
  id: string;

  /**
   * Nama komunitas / kelompok.
   * Contoh: Tim Futsal Blok H
   */
  name: string;

  category: CommunityGroupCategory;

  description?: string | null;

  /**
   * URL foto komunitas / anggota.
   */
  photoUrl?: string | null;

  /**
   * Informasi kegiatan komunitas.
   */
  activityInfo?: string | null;

  /**
   * Jadwal latihan, mabar, event, dll.
   */
  schedule?: string | null;

  /**
   * Link langsung grup WhatsApp.
   */
  whatsappGroupUrl?: string | null;

  displayOrder: number;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface CommunityAchievement {
  id: string;

  /**
   * Judul prestasi.
   * Contoh: Juara 1 Turnamen Futsal Antar Blok
   */
  title: string;

  /**
   * Nama individu / tim yang memperoleh prestasi.
   */
  recipient: string;

  description?: string | null;

  /**
   * Tanggal prestasi.
   */
  achievementDate?: string | null;

  /**
   * Foto dokumentasi prestasi.
   */
  photoUrl?: string | null;

  displayOrder: number;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}

/**
 * ==========================================================
 * 5. IPL PAYMENT
 * ==========================================================
 *
 * Satu record = satu kewajiban/pembayaran IPL
 * untuk satu rumah dan satu periode.
 *
 * Contoh:
 * HA-01 | 2026-09 | Rp50.000 | LUNAS
 */

export type IPLPaymentStatus =
  | 'belum'
  | 'lunas'
  | 'sebagian';

export interface IPLPayment {
  id: string;

  /**
   * Relasi ke Household.
   */
  householdId: string;

  /**
   * Disimpan juga untuk memudahkan pencarian,
   * reporting, dan migrasi database.
   */
  houseNumber: string;

  residentName: string;

  /**
   * Format YYYY-MM.
   * Contoh: 2026-09
   */
  period: string;

  amount: number;

  paidAmount: number;

  status: IPLPaymentStatus;

  /**
   * Tanggal pembayaran terakhir.
   */
  paidAt?: string;

  /**
   * Relasi ke transaksi kas pertama / utama (backward compatibility).
   */
  transactionId?: string;

  /**
   * Daftar seluruh ID transaksi kas yang terkait (untuk mendukung pembayaran bertahap).
   */
  transactionIds?: string[];

  /**
   * Nomor bukti / kuitansi kas jika sudah dibayar.
   */
  receiptNumber?: string;

  notes?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * ==========================================================
 * 6. FINANCIAL TRANSACTION & BUKU KAS
 * ==========================================================
 */

export type FinancialTransactionType =
  | 'in'
  | 'out';

export type FinancialTransactionCategory =
  | 'iuran-bulanan'
  | 'kebersihan-sampah'
  | 'keamanan-satpam'
  | 'penerangan-cctv'
  | 'perawatan-fasum'
  | 'donasi'
  | 'kas-sosial'
  | 'operasional';

export type PaymentMethod =
  | 'tunai'
  | 'transfer_bank'
  | 'qris'
  | 'lainnya';

export type TransactionStatus =
  | 'active'
  | 'void';

export interface FinancialTransaction {
  id: string;

  /**
   * Tanggal transaksi (YYYY-MM-DD).
   */
  date: string;

  /**
   * Jenis arus kas: 'in' (pemasukan kas) atau 'out' (pengeluaran kas).
   * Catatan: Saldo kas awal BUKAN pemasukan, melainkan opening balance terpisah.
   */
  type: FinancialTransactionType;

  /**
   * Pos anggaran / kategori kas.
   */
  category: FinancialTransactionCategory;

  /**
   * Uraian keterangan transaksi.
   */
  description: string;

  /**
   * Nominal transaksi dalam Rupiah (integer positif).
   */
  amount: number;

  /**
   * Nomor bukti kas / tanda terima / kuitansi.
   */
  receiptNumber?: string;

  /**
   * Nama pihak pembayar (jika 'in') atau penerima dana (jika 'out').
   */
  payerOrRecipient?: string;

  /**
   * Metode pembayaran: tunai, transfer_bank, qris, dll.
   */
  paymentMethod?: PaymentMethod;

  /**
   * Referensi eksternal (misal: nomor mutasi bank, nomor slip transfer).
   */
  referenceNo?: string;

  /**
   * Catatan audit internal.
   */
  notes?: string;

  /**
   * Status transaksi untuk audit trail:
   * 'active': transaksi valid & dihitung ke dalam saldo.
   * 'void': transaksi dibatalkan (soft delete), tetap tercatat untuk audit,
   *         tidak dihitung ke dalam saldo akhir.
   */
  status?: TransactionStatus;

  /**
   * Alasan pembatalan jika status 'void'.
   */
  voidReason?: string;

  /**
   * Waktu pembatalan transaksi (ISO 8601 string).
   */
  voidedAt?: string;

  /**
   * User/identitas yang membatalkan transaksi.
   */
  voidedBy?: string;

  /**
   * Relasi opsional ke rumah warga jika terkait IPL.
   */
  householdId?: string;

  houseNumber?: string;

  iplPaymentId?: string;

  /**
   * Audit timestamps & actors.
   */
  createdAt?: string;

  updatedAt?: string;

  createdBy?: string;

  updatedBy?: string;
}

export type FinanceTransaction = FinancialTransaction;

/**
 * ==========================================================
 * 7. FINANCIAL SUMMARY & REPORTING PERIOD
 * ==========================================================
 */

export type FinancialReportPeriodType =
  | 'all'
  | 'current_month'
  | 'custom_month';

export interface FinancialPeriodFilter {
  type: FinancialReportPeriodType;
  /**
   * Digunakan jika type === 'custom_month' (format 'YYYY-MM', misal '2026-09')
   */
  month?: string;
}

export interface FinancialSummary {
  /**
   * Saldo awal buku kas (pembukuan terpisah, bukan transaksi pemasukan).
   */
  openingBalance: number;

  /**
   * Saldo akhir buku kas:
   * Ending Balance = Opening Balance + Total Income - Total Expense
   */
  currentBalance: number;

  /**
   * Total pemasukan kas pada periode aktif yang dipilih.
   */
  currentMonthIn: number;

  /**
   * Total pengeluaran kas pada periode aktif yang dipilih.
   */
  currentMonthOut: number;

  /**
   * Total kumulatif pemasukan seluruh transaksi aktif.
   */
  totalIn: number;

  /**
   * Total kumulatif pengeluaran seluruh transaksi aktif.
   */
  totalOut: number;

  /**
   * Label deskriptif periode yang sedang ditampilkan.
   * Contoh: "September 2026", "Semua Periode", dsb.
   */
  periodLabel: string;

  /**
   * Filter periode yang aktif saat ini.
   */
  activePeriod: FinancialPeriodFilter;

  /**
   * Data unit rumah aktif (menunggu pendataan pengurus).
   */
  activeHouseholds: number;

  /**
   * Jumlah rumah lunas untuk periode laporan.
   */
  paidHouseholds: number;

  /**
   * Jumlah rumah belum lunas.
   */
  unpaidHouseholds: number;

  /**
   * Tingkat kepatuhan pembayaran IPL (0 - 100%).
   */
  complianceRate: number;

  /**
   * Besaran nominal IPL per rumah.
   */
  monthlyFeePerHouse: number;

  /**
   * Proyeksi tagihan IPL periode berjalan.
   */
  monthlyIPLExpected: number;

  /**
   * Realisasi IPL terkumpul periode berjalan.
   */
  monthlyIPLCollected: number;

  /**
   * Tunggakan IPL periode berjalan.
   */
  monthlyIPLOutstanding: number;

  /**
   * Tanggal/waktu pemutakhiran data.
   */
  asOfDate: string;

  /**
   * Penanda mode simulasi/demo vs data produksi aktual.
   */
  isDemo: boolean;
}

/**
 * ==========================================================
 * 8. IPL RECAP
 * ==========================================================
 */

export interface IPLRecap {
  period: string;

  totalHouseholds: number;

  paidHouseholds: number;

  unpaidHouseholds: number;

  partialHouseholds: number;

  expectedAmount: number;

  collectedAmount: number;

  outstandingAmount: number;

  complianceRate: number;
}

/**
 * ==========================================================
 * 9. DOCUMENTATION
 * ==========================================================
 */

export interface Documentation {
  id: string;

  title: string;

  date: string;

  category:
    | 'kerja-bakti'
    | 'lingkungan'
    | 'sosial'
    | 'pembangunan';

  description: string;

  image: string;

  photographer: string;

  createdAt?: string;
  updatedAt?: string;
}

export type DocumentationItem = Documentation;

/**
 * ==========================================================
 * 10. ADMIN / AUTHENTICATION
 * ==========================================================
 */

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'editor';

export interface AdminUser {
  id: string;

  /**
   * Email yang digunakan untuk login Supabase Auth.
   */
  username: string;

  /**
   * Nama pengguna/pengurus.
   */
  name: string;

  /**
   * Hak akses pengguna.
   */
  role: AdminRole;

  /**
   * Menandakan akun demo atau akun production.
   */
  isDemo: boolean;

  /**
   * Token tidak lagi dikelola secara manual.
   * Supabase Auth menangani session/token.
   */
  token?: string;

  lastLogin?: string;
}
export interface AuthSession {
  isAuthenticated: boolean;
  user: AdminUser | null;
  mode:
    | 'production_d1'
    | 'supabase';
}
/**
 * ==========================================================
 * 11. CITIZEN REPORT
 * ==========================================================
 */

export interface CitizenReport {
  id: string;

  date: string;

  residentName: string;

  houseNumber: string;

  phone: string;

  category:
    | 'fasilitas'
    | 'keamanan'
    | 'kebersihan'
    | 'saran';

  title: string;

  description: string;

  status:
    | 'menunggu'
    | 'diproses'
    | 'selesai';

  createdAt?: string;

  updatedAt?: string;
}

/**
 * ==========================================================
 * 12. RONDA / SISKAMLING
 * ==========================================================
 */

export interface RondaSchedule {
  id: string;
  day: string;
  team: string;
  coordinator: string;
  houses: string[];
}

/**
 * ==========================================================
 * 13. API RESPONSE
 * ==========================================================
 */

export interface ApiResponse<T> {
  success: boolean;

  data?: T;

  error?: string;

  message?: string;

  timestamp: string;
}
export interface OrganizationMember {
  id: string;
  name: string;
  position: string;
  division?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  responsibilities?: string | null;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}