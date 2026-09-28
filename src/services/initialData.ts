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
  
export const INITIAL_WORK_PROGRAMS: WorkProgram[] = [];

/**
 * Saldo Kas Awal Pembukuan Paguyuban (Mock Data)
 * Saldo awal dipisahkan secara konseptual dan tidak dicatat sebagai transaksi pemasukan.
 */
export const INITIAL_OPENING_BALANCE = 0;

export const INITIAL_TRANSACTIONS: FinanceTransaction[] = [];

export const INITIAL_DOCUMENTATION: DocumentationItem[] = [];

export const RONDA_SCHEDULES: RondaSchedule[] = [];
  
export const INITIAL_REPORTS: CitizenReport[] = [];

/**
 * MOCK DATA UNIT RUMAH WARGA (HOUSEHOLDS) - DATA DEMO
 * Digunakan untuk pemetaan iuran IPL dan pelaporan administrasi warga.
 */
export const INITIAL_HOUSEHOLDS: Household[] = [];

/**
 * MOCK DATA PEMBAYARAN IPL (IURAN PENGELOLAAN LINGKUNGAN) - DATA DEMO
 * Periode berjalan: 2026-09
 * Standar tarif iuran per rumah: Rp50.000
 */
export const INITIAL_IPL_PAYMENTS: IPLPayment[] = [];
