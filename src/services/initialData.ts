import heroImage from '@/src/assets/images/hero_mountain_housing_1790351060957.jpg';
import cleanupImage from '@/src/assets/images/community_cleanup_event_1790351075830.jpg';
import gardenImage from '@/src/assets/images/neighborhood_garden_park_1790351090650.jpg';
import {
  Announcement,
  AgendaItem,
  WorkProgram,
  FinanceTransaction,
  DocumentationItem,
  CitizenReport,
  RondaSchedule,
  Household,
  IPLPayment,
} from '../types/portal';

/**
 * MOCK / DEMO DATA ONLY
 * 
 * CATATAN PENTING:
 * Seluruh data di bawah ini merupakan data tiruan (dummy/mock data) untuk
 * keperluan demonstrasi antarmuka dan persiapan integrasi sistem portal warga.
 * Tidak ada informasi pribadi warga, nomor telepon riil, rekening bank,
 * atau data faktual yang diikutsertakan.
 */

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_AGENDAS: AgendaItem[] = [];
  
export const INITIAL_WORK_PROGRAMS: WorkProgram[] = [
  {
    id: 'wp-1',
    title: '[Contoh Program 01] Peningkatan Keamanan & Pengawasan Lingkungan',
    term: 'pendek',
    period: 'Tahap 1 (Contoh Periode)',
    description:
      '(Program Contoh) Perencanaan penguatan sistem keamanan mandiri lingkungan perumahan serta penataan pos keamanan.',
    pic: 'Seksi Keamanan [Pengurus Demo]',
    budgetEstimated: 5000000,
    budgetRealized: 2500000,
    progress: 50,
    status: 'berjalan',
    targets: [
      '(Contoh Target 1) Pemetaan kebutuhan sarana keamanan',
      '(Contoh Target 2) Uji coba peralatan di pos jaga',
      '(Contoh Target 3) Sosialisasi prosedur kepada warga',
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'wp-2',
    title: '[Contoh Program 02] Perawatan Ruang Terbuka Hijau & Taman',
    term: 'pendek',
    period: 'Tahap 1 (Contoh Periode)',
    description:
      '(Program Contoh) Penataan tanaman hias, pemotongan rumput berkala, dan pemeliharaan area hijau bersama.',
    pic: 'Seksi Lingkungan [Pengurus Demo]',
    budgetEstimated: 3000000,
    budgetRealized: 1500000,
    progress: 50,
    status: 'berjalan',
    targets: [
      '(Contoh Target 1) Pembersihan area fasum',
      '(Contoh Target 2) Pengadaan bibit tanaman penghijauan',
      '(Contoh Target 3) Penjadwalan penyiraman rutin',
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'wp-3',
    title: '[Contoh Program 03] Pemeliharaan Saluran Drainase Lingkungan',
    term: 'menengah',
    period: 'Tahap 2 (Contoh Periode)',
    description:
      '(Program Contoh) Pemeliharaan berkala saluran air dan penyerapan air hujan untuk kenyamanan lingkungan perumahan.',
    pic: 'Seksi Pembangunan [Pengurus Demo]',
    budgetEstimated: 8000000,
    budgetRealized: 0,
    progress: 0,
    status: 'rencana',
    targets: [
      '(Contoh Target 1) Pengecekan kondisi drainase bersama pengurus',
      '(Contoh Target 2) Estimasi kebutuhan material perawatan',
      '(Contoh Target 3) Pelaksanaan kerja bakti terarah',
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'wp-4',
    title: '[Contoh Program 04] Digitalisasi Layanan Informasi Warga',
    term: 'panjang',
    period: 'Tahap 3 (Contoh Periode)',
    description:
      '(Program Contoh) Pengembangan portal informasi terpadu warga yang siap diintegrasikan dengan backend Cloudflare Workers & D1 Database.',
    pic: 'Tim Pengembang [Demo]',
    budgetEstimated: 0,
    budgetRealized: 0,
    progress: 25,
    status: 'berjalan',
    targets: [
      '(Contoh Target 1) Perancangan antarmuka mobile-first',
      '(Contoh Target 2) Sentralisasi repositori data di dataService.ts',
      '(Contoh Target 3) Persiapan skema D1 dan API Workers',
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

/**
 * Saldo Kas Awal Pembukuan Paguyuban (Mock Data)
 * Saldo awal dipisahkan secara konseptual dan tidak dicatat sebagai transaksi pemasukan.
 */
export const INITIAL_OPENING_BALANCE = 0;

export const INITIAL_TRANSACTIONS: FinanceTransaction[] = [];

export const INITIAL_DOCUMENTATION: DocumentationItem[] = [
  {
    id: 'doc-1',
    title: '[Demo Foto 01] Dokumentasi Suasana Lingkungan Kompleks Perumahan (Contoh)',
    date: 'September 2026',
    category: 'lingkungan',
    description:
      '(Foto Contoh) Ilustrasi keasrian kawasan hunian bernuansa pegunungan sejuk untuk keperluan demonstrasi galeri portal warga.',
    image: heroImage,
    photographer: 'Dokumentasi Warga [Demo]',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'doc-2',
    title: '[Demo Foto 02] Dokumentasi Gotong Royong Kebersihan Warga (Contoh)',
    date: 'Agustus 2026',
    category: 'kerja-bakti',
    description:
      '(Foto Contoh) Ilustrasi kegiatan kebersamaan warga dalam membersihkan area bersama dan menjaga lingkungan tetap bersih.',
    image: cleanupImage,
    photographer: 'Seksi Humas [Demo]',
    createdAt: '2026-08-20T08:00:00.000Z',
  },
  {
    id: 'doc-3',
    title: '[Demo Foto 03] Dokumentasi Area Fasilitas Bersama & Taman (Contoh)',
    date: 'September 2026',
    category: 'pembangunan',
    description:
      '(Foto Contoh) Ilustrasi ruang terbuka hijau dan gazebo peristirahatan warga sebagai sarana interaksi sosial yang nyaman.',
    image: gardenImage,
    photographer: 'Bpk. Contoh 01',
    createdAt: '2026-09-05T09:00:00.000Z',
  },
];

export const RONDA_SCHEDULES: RondaSchedule[] = [];
  
export const INITIAL_REPORTS: CitizenReport[] = [
  {
    id: 'rep-1',
    date: '2026-09-23',
    residentName: 'Ibu Contoh 01',
    houseNumber: 'H-XX (Contoh)',
    phone: '08xxxxxxxxxx',
    category: 'fasilitas',
    title: '[Contoh Laporan] Lampu Penerangan Jalan Perlu Pengecekan',
    description:
      '(Contoh Laporan Warga) Lampu penerangan jalan di tiang depan rumah berkedip saat malam hari. Mohon bantuan teknisi sarpras untuk melakukan pengecekan.',
    status: 'diproses',
    createdAt: '2026-09-23T15:20:00.000Z',
  },
  {
    id: 'rep-2',
    date: '2026-09-19',
    residentName: 'Bpk. Contoh 02',
    houseNumber: 'H-YY (Contoh)',
    phone: '08xxxxxxxxxx',
    category: 'kebersihan',
    title: '[Contoh Laporan] Pembersihan Ranting di Saluran Air',
    description:
      '(Contoh Laporan Warga) Daun kering dan ranting menumpuk di saluran air, mohon dapat diagendakan saat kerja bakti bersama.',
    status: 'selesai',
    createdAt: '2026-09-19T08:10:00.000Z',
  },
];

/**
 * MOCK DATA UNIT RUMAH WARGA (HOUSEHOLDS) - DATA DEMO
 * Digunakan untuk pemetaan iuran IPL dan pelaporan administrasi warga.
 */
export const INITIAL_HOUSEHOLDS: Household[] = [
  {
    id: 'hh-01',
    houseNumber: 'H-01',
    residentName: 'Bpk. Hendra Wijaya [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 4,
    notes: 'Unit aktif utama',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-02',
    houseNumber: 'H-02',
    residentName: 'Ibu Ratna Dewi [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 3,
    notes: 'Keluarga inti',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-03',
    houseNumber: 'H-03',
    residentName: 'Bpk. Ahmad Fauzi [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 5,
    notes: 'Koordinator RT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-04',
    houseNumber: 'H-04',
    residentName: 'Bpk. Agus Santoso [Demo]',
    occupancyStatus: 'semi-huni',
    isActive: true,
    familyMembers: 2,
    notes: 'Tinggal akhir pekan',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-05',
    houseNumber: 'H-05',
    residentName: 'Ibu Siti Aminah [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 3,
    notes: 'Anggota paguyuban',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-06',
    houseNumber: 'H-06',
    residentName: 'Bpk. Budi Pratama [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 4,
    notes: 'Pengurus humas',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-07',
    houseNumber: 'H-07',
    residentName: 'Keluarga Pratama [Demo]',
    occupancyStatus: 'kosong',
    isActive: false,
    familyMembers: 0,
    notes: 'Rumah dalam proses renovasi / belum dihuni',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'hh-08',
    houseNumber: 'H-08',
    residentName: 'Bpk. Dedi Supriyadi [Demo]',
    occupancyStatus: 'huni',
    isActive: true,
    familyMembers: 3,
    notes: 'Warga Blok H',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

/**
 * MOCK DATA PEMBAYARAN IPL (IURAN PENGELOLAAN LINGKUNGAN) - DATA DEMO
 * Periode berjalan: 2026-09
 * Standar tarif iuran per rumah: Rp50.000
 */
export const INITIAL_IPL_PAYMENTS: IPLPayment[] = [];
