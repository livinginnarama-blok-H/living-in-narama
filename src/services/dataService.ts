/**
 * Centralized Data Service for Portal Warga Griya Adika Narama - Blok H
 * 
 * ARCHITECTURE OVERVIEW:
 * 1. Single Source of Truth: All UI views interact ONLY with this service (never directly with localStorage or raw endpoints).
 * 2. Strict Dual Mode Isolation:
 *    - 'local_mock': Browser storage with cross-tab sync and demo initial data.
 *    - 'cloudflare_worker': Worker API + D1 Edge Database. NEVER silently falls back to localStorage on failure; throws explicit errors for UI error handling.
 * 3. Domain Model Architecture & Relational Integrity:
 *    Household (Unit Rumah Warga)
 *       ↓
 *    IPLPayment (1 Household + 1 Periode = 1 Record Unik, Mendukung Pembayaran Bertahap)
 *       ↓
 *    FinancialTransaction (Buku Kas, Kas Masuk Tercatat Sebesar Additional Payment)
 *       ↓
 *    FinancialSummary & IPLRecap (Rekapitulasi Keuangan & Iuran Dinamis Berbasis Transaksi Aktif)
 * 4. Business Rules & Financial Invariants:
 *    - ATURAN UTAMA IPL: Satu household + satu periode = SATU record IPL. D1 UNIQUE(household_id, period).
 *    - Pembayaran bertahap: additionalPayment = targetPaidAmount - existingPaidAmount.
 *      Hanya additionalPayment > 0 yang menghasilkan transaksi kas baru (mencegah double-counting).
 *    - Validasi ketat: amount > 0, paidAmount >= 0, paidAmount <= amount ("Nominal pembayaran IPL tidak boleh melebihi tagihan").
 *    - Sinkronisasi Void Transaksi: Membatalkan transaksi kas yang terhubung ke IPL akan otomatis menghitung ulang total pembayaran aktif (SUM transaksi aktif) dan memperbarui status IPL secara konsisten.
 *    - Atomic Batch Worker: Eksekusi D1 pada Worker menggunakan env.DB.batch([...]) untuk atomisitas transaksi.
 */
import { supabase } from '../lib/supabase';
import {
  Announcement,
  EventAgenda,
  Program,
  FinancialTransaction,
  FinancialSummary,
  FinancialPeriodFilter,
  Documentation,
  CitizenReport,
  RondaSchedule,
  ApiResponse,
  Household,
  IPLPayment,
  IPLPaymentStatus,
  IPLRecap,
  PaymentMethod,
} from '../types/portal';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AGENDAS,
  INITIAL_WORK_PROGRAMS,
  INITIAL_TRANSACTIONS,
  INITIAL_OPENING_BALANCE,
  INITIAL_DOCUMENTATION,
  INITIAL_REPORTS,
  RONDA_SCHEDULES,
  INITIAL_HOUSEHOLDS,
  INITIAL_IPL_PAYMENTS,
} from './initialData';

// Configurable data source flag for production rollout
export type DataSourceMode = 'local_mock' | 'cloudflare_worker';

export const DATA_CONFIG = {
  mode: 'local_mock' as DataSourceMode, // Tetap gunakan 'local_mock' sesuai instruksi pengguna
  apiBaseUrl: 'https://portal-narama-api.workers.dev/api', // Cloudflare Worker endpoint
  requestTimeoutMs: 8000,
};

/**
 * DEMO ONLY — tarif resmi harus dikonfigurasi pengurus paguyuban.
 * Standar tarif iuran per bulan untuk unit rumah Blok H.
 */
export const DEFAULT_MONTHLY_IPL_FEE = 50000;

// Storage keys for local mock demo persistence
const STORAGE_KEYS = {
  OPENING_BALANCE: 'narama_blok_h_opening_balance_v5',
  TRANSACTIONS: 'narama_blok_h_transactions_v5',
  ANNOUNCEMENTS: 'narama_blok_h_announcements_v4',
  AGENDAS: 'narama_blok_h_agendas_v4',
  WORK_PROGRAMS: 'narama_blok_h_prokers_v4',
  DOCUMENTATION: 'narama_blok_h_docs_v4',
  REPORTS: 'narama_blok_h_reports_v4',
  HOUSEHOLDS: 'narama_blok_h_households_v1',
  IPL_PAYMENTS: 'narama_blok_h_ipl_payments_v1',
};
export async function migrateLocalTransactionsToSupabase(): Promise<{
  success: boolean;
  total: number;
  inserted: number;
  message: string;
}> {
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

  if (!raw) {
    throw new Error('Data transaksi LocalStorage tidak ditemukan.');
  }

  const localTransactions = JSON.parse(raw);

  if (!Array.isArray(localTransactions)) {
    throw new Error('Format data transaksi LocalStorage tidak valid.');
  }

  const rows = localTransactions.map((item: any) => ({
    id: item.id,
    date: item.date,
    type: item.type,
    category: item.category,
    description: item.description,
    amount: Math.round(Number(item.amount) || 0),

    payment_method: item.paymentMethod || 'transfer_bank',

    household_id: item.householdId || null,

    status: item.status || 'active',

    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || null,
    created_by: item.createdBy || null,

    voided_at: item.voidedAt || null,
    voided_by: item.voidedBy || null,
    void_reason: item.voidReason || null,

    receipt_number: item.receiptNumber || null,
    payer_or_recipient: item.payerOrRecipient || null,
    reference_no: item.referenceNo || null,
    notes: item.notes || null,

    ipl_payment_id: item.iplPaymentId || null,
    house_number: item.houseNumber || null,
    updated_by: item.updatedBy || null,
  }));

  console.log(
    '[Migration] Akan mengirim transaksi ke Supabase:',
    rows
  );

  const { data, error } = await supabase
    .from('financial_transactions')
    .upsert(rows, {
      onConflict: 'id',
    })
    .select();

  if (error) {
    console.error('[Migration] Supabase error:', error);
    throw new Error(error.message);
  }

  const inserted = data?.length || 0;

  console.log(
    `[Migration] Selesai. ${inserted} transaksi diproses dari ${rows.length} transaksi.`
  );

  return {
    success: true,
    total: rows.length,
    inserted,
    message: `Berhasil memproses ${inserted} dari ${rows.length} transaksi.`,
  };
}
// Helper to generate collision-resistant IDs
function generateSafeId(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // fallback
  }
  const entropy = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${Date.now()}-${entropy}`;
}

// Safe storage access helper (fully isolated inside service)
function getStored<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[DataService] Gagal membaca key ${key} dari storage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[DataService] Gagal menyimpan key ${key} ke storage:`, e);
  }
}

/**
 * Event Listener system for reactive UI updates across tabs/components
 */
type DataListener = () => void;
const changeListeners: Set<DataListener> = new Set();

function emitDataChange() {
  changeListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('[DataService] Error in change listener:', err);
    }
  });
}

// Cross-tab synchronization via browser 'storage' event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('narama_blok_h_')) {
      emitDataChange();
    }
  });
}

/**
 * Helper to get current system month in 'YYYY-MM' format
 */
export function getCurrentSystemMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Helper to format period string into Indonesian human readable label
 */
export function formatPeriodLabel(filter: FinancialPeriodFilter): string {
  if (filter.type === 'all') {
    return 'Semua Periode Pembukuan';
  }

  const targetMonth = filter.type === 'current_month'
    ? getCurrentSystemMonth()
    : (filter.month || getCurrentSystemMonth());

  const [yearStr, monthStr] = targetMonth.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const mIndex = parseInt(monthStr, 10) - 1;
  const monthName = monthNames[mIndex] || monthStr;

  return `${monthName} ${yearStr}`;
}

/**
 * Format timestamp for audit logs
 */
export function formatAuditDate(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Safe fetch with timeout, HTTP status validation, and error parsing.
 * NEVER does silent fallback when in cloudflare_worker mode.
 */
async function safeFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DATA_CONFIG.requestTimeoutMs);

  try {
    const res = await fetch(`${DATA_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `HTTP error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.error) {
          errMsg = errJson.error;
        }
      } catch {
        // fallback to status text
      }
      throw new Error(errMsg);
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Permintaan ke server Worker timeout (${DATA_CONFIG.requestTimeoutMs}ms).`);
    }
    throw err;
  }
}

/**
 * Interface defining the API contract for the Portal Data Service.
 */
export interface IPortalDataRepository {
  // Announcements
  getAnnouncements(): Announcement[];
  fetchAnnouncements(): Promise<Announcement[]>;
  addAnnouncement(item: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<void>;

  // Agendas / Events
  getAgendas(): EventAgenda[];
  fetchAgendas(): Promise<EventAgenda[]>;
  addAgenda(item: Omit<EventAgenda, 'id' | 'createdAt'>): Promise<EventAgenda>;
  deleteAgenda(id: string): Promise<void>;

  // Programs
  getWorkPrograms(): Program[];
  fetchWorkPrograms(): Promise<Program[]>;
  updateWorkProgram(program: Program): Promise<void>;
  addWorkProgram(item: Omit<Program, 'id' | 'createdAt'>): Promise<Program>;

  // Households (Data Rumah Warga)
  getHouseholds(): Household[];
  fetchHouseholds(): Promise<Household[]>;
  addHousehold(item: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<Household>;
  updateHousehold(item: Household): Promise<Household>;
  deactivateHousehold(id: string): Promise<Household>;

  // IPL Payments (Iuran Pengelolaan Lingkungan)
  getIPLPayments(period?: string): IPLPayment[];
  fetchIPLPayments(period?: string): Promise<IPLPayment[]>;
  addIPLPayment(params: {
    householdId: string;
    period: string;
    amount: number;
    paidAmount: number;
    paymentAmount?: number;
    paymentMethod?: PaymentMethod;
    notes?: string;
    receiptNumber?: string;
    referenceNo?: string;
    recordedBy?: string;
    date?: string;
  }): Promise<{ payment: IPLPayment; transaction?: FinancialTransaction; additionalPayment?: number }>;
  updateIPLPayment(payment: IPLPayment): Promise<IPLPayment>;
  getIPLRecap(period?: string): IPLRecap;

  // Financials & Buku Kas
  getOpeningBalance(): number;
  getTransactions(includeVoid?: boolean): FinancialTransaction[];
  fetchTransactions(includeVoid?: boolean): Promise<FinancialTransaction[]>;
  addTransaction(item: Omit<FinancialTransaction, 'id' | 'createdAt' | 'status'>): Promise<FinancialTransaction>;
  voidTransaction(id: string, reason?: string, voidedBy?: string): Promise<FinancialTransaction | null>;
  deleteTransaction(id: string): Promise<void>;
  getFinancialMetrics(periodFilter?: FinancialPeriodFilter): FinancialSummary;
  getAvailableTransactionMonths(): string[];

  // Documentation
  getDocumentation(): Documentation[];
  fetchDocumentation(): Promise<Documentation[]>;
  addDocumentation(
    item: Omit<Documentation, 'id' | 'createdAt' | 'image'>,
    imageFile: File
  ): Promise<Documentation>;
  updateDocumentation(
    id: string,
    item: Partial<Omit<Documentation, 'id' | 'createdAt'>>,
    imageFile?: File
  ): Promise<Documentation>;
  deleteDocumentation(id: string): Promise<void>;

  // Citizen Reports
  getReports(): CitizenReport[];
  fetchReports(): Promise<CitizenReport[]>;
  submitReport(report: Omit<CitizenReport, 'id' | 'date' | 'status' | 'createdAt'>): Promise<CitizenReport>;
  updateReportStatus(id: string, status: CitizenReport['status']): Promise<void>;

 // Ronda Schedules
  getRondaSchedules(): RondaSchedule[];
  fetchRondaSchedules(): Promise<RondaSchedule[]>;
  addRondaSchedule(
    item: Omit<RondaSchedule, 'id'>
  ): Promise<RondaSchedule>;
  updateRondaSchedule(
    id: string,
    item: Partial<Omit<RondaSchedule, 'id'>>
  ): Promise<RondaSchedule>;
  deleteRondaSchedule(id: string): Promise<void>;

  // Data Lifecycle & Migration
  resetAllData(): void;
  subscribe(listener: DataListener): () => void;
  generateD1SchemaSql(): string;
  generateCloudflareWorkerExample(): string;
}

/**
 * Centralized DataService Singleton Implementation
 */
export const DataService: IPortalDataRepository = {
  // ==========================================
  // 1. ANNOUNCEMENTS
  // ==========================================
  getAnnouncements(): Announcement[] {
    return getStored<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },
  async fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DataService] Supabase fetchAnnouncements error:', error);
    throw new Error(error.message || 'Gagal memuat pengumuman dari Supabase');
  }

  const announcements: Announcement[] = (data || []).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    date: item.date,
    author: item.author,
    content: item.content,
    isPinned: item.is_pinned,
    tagline: item.tagline || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  setStored<Announcement[]>(
    STORAGE_KEYS.ANNOUNCEMENTS,
    announcements
  );

  emitDataChange();

  return announcements;
},
  async addAnnouncement(item: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
  const newItem: Announcement = {
    ...item,
    id: generateSafeId('ann'),
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      id: newItem.id,
      title: newItem.title,
      category: newItem.category,
      date: newItem.date,
      author: newItem.author,
      content: newItem.content,
      is_pinned: newItem.isPinned,
      tagline: newItem.tagline ?? null,
      created_at: newItem.createdAt,
    })
    .select()
    .single();

  if (error) {
    console.error('[DataService] Supabase addAnnouncement error:', error);
    throw new Error(error.message || 'Gagal menambah pengumuman ke Supabase');
  }

  const created: Announcement = {
    id: data.id,
    title: data.title,
    category: data.category,
    date: data.date,
    author: data.author,
    content: data.content,
    isPinned: data.is_pinned,
    tagline: data.tagline || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const current = this.getAnnouncements();
  setStored<Announcement[]>(
    STORAGE_KEYS.ANNOUNCEMENTS,
    [created, ...current]
  );

  emitDataChange();

  return created;
},
  async deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DataService] Supabase deleteAnnouncement error:', error);
    throw new Error(error.message || 'Gagal menghapus pengumuman dari Supabase');
  }

  const current = this.getAnnouncements();
  const updated = current.filter((item) => item.id !== id);

  setStored<Announcement[]>(
    STORAGE_KEYS.ANNOUNCEMENTS,
    updated
  );

  emitDataChange();
},
  // ==========================================
  // 2. AGENDAS & EVENTS - SUPABASE
  // ==========================================

  getAgendas(): EventAgenda[] {
    // Agenda tidak lagi mengambil data dari localStorage.
    // Data diisi oleh fetchAgendas() dari Supabase.
    return getStored<EventAgenda[]>('__agenda_supabase_cache__', []);
  },

  async fetchAgendas(): Promise<EventAgenda[]> {
    const { data, error } = await supabase
      .from('agendas')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('[DataService] Supabase fetchAgendas error:', error);
      throw new Error(error.message || 'Gagal memuat agenda dari Supabase');
    }

    const agendas: EventAgenda[] = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      category: item.category,
      description: item.description || '',
      pic: item.pic || '',
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    setStored<EventAgenda[]>('__agenda_supabase_cache__', agendas);
    return agendas;
  },

  async addAgenda(
    item: Omit<EventAgenda, 'id' | 'createdAt'>
  ): Promise<EventAgenda> {
    const newItem: EventAgenda = {
      ...item,
      id: generateSafeId('ag'),
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agendas')
      .insert({
        id: newItem.id,
        title: newItem.title,
        date: newItem.date,
        time: newItem.time,
        location: newItem.location,
        category: newItem.category,
        description: newItem.description,
        pic: newItem.pic,
        status: newItem.status,
        created_at: newItem.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[DataService] Supabase addAgenda error:', error);
      throw new Error(error.message || 'Gagal menambah agenda');
    }

    const agenda: EventAgenda = {
      id: data.id,
      title: data.title,
      date: data.date,
      time: data.time,
      location: data.location,
      category: data.category,
      description: data.description || '',
      pic: data.pic || '',
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    await this.fetchAgendas();
    emitDataChange();

    return agenda;
  },

  async deleteAgenda(id: string): Promise<void> {
    const { error } = await supabase
      .from('agendas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DataService] Supabase deleteAgenda error:', error);
      throw new Error(error.message || 'Gagal menghapus agenda');
    }

    await this.fetchAgendas();
    emitDataChange();
  },

  // ==========================================
  // 3. WORK PROGRAMS
  // ==========================================
  getWorkPrograms(): Program[] {
    return getStored<Program[]>(STORAGE_KEYS.WORK_PROGRAMS, INITIAL_WORK_PROGRAMS);
  },

  async fetchWorkPrograms(): Promise<Program[]> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Program[]>>('/programs');
        if (!json.success) {
          throw new Error(json.error || 'Gagal memuat program kerja dari Worker API');
        }
        return json.data || [];
      } catch (err) {
        console.error('[DataService] Worker fetchWorkPrograms error:', err);
        throw err;
      }
    }
    return this.getWorkPrograms();
  },

  async updateWorkProgram(updatedProgram: Program): Promise<void> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Program>>(`/programs/${updatedProgram.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProgram),
        });
        if (!json.success) {
          throw new Error(json.error || 'Gagal memperbarui program kerja via Worker API');
        }
        emitDataChange();
        return;
      } catch (err) {
        console.error('[DataService] Worker updateWorkProgram error:', err);
        throw err;
      }
    }

    const current = this.getWorkPrograms();
    const updated = current.map((p) => (p.id === updatedProgram.id ? updatedProgram : p));
    setStored(STORAGE_KEYS.WORK_PROGRAMS, updated);
    emitDataChange();
  },

  async addWorkProgram(item: Omit<Program, 'id' | 'createdAt'>): Promise<Program> {
    const newItem: Program = {
      ...item,
      id: generateSafeId('wp'),
      createdAt: new Date().toISOString(),
    };

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Program>>('/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal menambah program kerja via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker addWorkProgram error:', err);
        throw err;
      }
    }

    const current = this.getWorkPrograms();
    const updated = [...current, newItem];
    setStored(STORAGE_KEYS.WORK_PROGRAMS, updated);
    emitDataChange();
    return newItem;
  },

  // ==========================================
  // 4. HOUSEHOLDS (DATA RUMAH WARGA)
  // ==========================================
  getHouseholds(): Household[] {
    return getStored<Household[]>(STORAGE_KEYS.HOUSEHOLDS, INITIAL_HOUSEHOLDS);
  },

  async fetchHouseholds(): Promise<Household[]> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Household[]>>('/households');
        if (!json.success) {
          throw new Error(json.error || 'Gagal memuat data rumah warga dari Worker API');
        }
        return json.data || [];
      } catch (err) {
        console.error('[DataService] Worker fetchHouseholds error:', err);
        throw err;
      }
    }
    return this.getHouseholds();
  },

  async addHousehold(item: Omit<Household, 'id' | 'createdAt' | 'updatedAt'>): Promise<Household> {
    if (!item.houseNumber || !item.houseNumber.trim()) {
      throw new Error('Nomor rumah wajib diisi.');
    }
    if (!item.residentName || !item.residentName.trim()) {
      throw new Error('Nama kepala keluarga/warga wajib diisi.');
    }

    const nowIso = new Date().toISOString();
    const newHousehold: Household = {
      ...item,
      id: generateSafeId('hh'),
      houseNumber: item.houseNumber.trim(),
      residentName: item.residentName.trim(),
      isActive: item.isActive !== undefined ? item.isActive : true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Household>>('/households', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newHousehold),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal menambah data rumah via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker addHousehold error:', err);
        throw err;
      }
    }

    const current = this.getHouseholds();
    if (current.some((h) => h.houseNumber.toLowerCase() === newHousehold.houseNumber.toLowerCase())) {
      throw new Error(`Nomor rumah ${newHousehold.houseNumber} sudah terdaftar.`);
    }
    const updated = [...current, newHousehold];
    setStored(STORAGE_KEYS.HOUSEHOLDS, updated);
    emitDataChange();
    return newHousehold;
  },

  async updateHousehold(item: Household): Promise<Household> {
    const nowIso = new Date().toISOString();
    const updatedHousehold: Household = {
      ...item,
      updatedAt: nowIso,
    };

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Household>>(`/households/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedHousehold),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal memperbarui data rumah via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker updateHousehold error:', err);
        throw err;
      }
    }

    const current = this.getHouseholds();
    const updated = current.map((h) => (h.id === item.id ? updatedHousehold : h));
    setStored(STORAGE_KEYS.HOUSEHOLDS, updated);
    emitDataChange();
    return updatedHousehold;
  },

  async deactivateHousehold(id: string): Promise<Household> {
    const nowIso = new Date().toISOString();

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<Household>>(`/households/${id}/deactivate`, {
          method: 'POST',
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal menonaktifkan data rumah via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker deactivateHousehold error:', err);
        throw err;
      }
    }

    const current = this.getHouseholds();
    let updatedRecord: Household | null = null;
    const updated = current.map((h) => {
      if (h.id === id) {
        updatedRecord = { ...h, isActive: false, updatedAt: nowIso };
        return updatedRecord;
      }
      return h;
    });

    if (!updatedRecord) {
      throw new Error('Data unit rumah tidak ditemukan.');
    }

    setStored(STORAGE_KEYS.HOUSEHOLDS, updated);
    emitDataChange();
    return updatedRecord;
  },

  // ==========================================
  // 5. IPL PAYMENTS & PEMBAYARAN BERTAHAP
  // ==========================================
  getIPLPayments(period?: string): IPLPayment[] {
    const raw = getStored<IPLPayment[]>(STORAGE_KEYS.IPL_PAYMENTS, INITIAL_IPL_PAYMENTS);

    // Normalisasi & Deduplikasi data existing (Aturan: 1 Household + 1 Periode = 1 Record)
    const uniqueMap = new Map<string, IPLPayment>();

    (raw || []).forEach((item) => {
      if (!item || !item.householdId || !item.period) return;
      const key = `${item.householdId}_${item.period}`;
      const existing = uniqueMap.get(key);

      const normalized: IPLPayment = {
        ...item,
        amount: Math.max(0, Number(item.amount) || DEFAULT_MONTHLY_IPL_FEE),
        paidAmount: Math.max(0, Number(item.paidAmount) || 0),
        status:
          item.status ||
          (Number(item.paidAmount) >= Number(item.amount)
            ? 'lunas'
            : Number(item.paidAmount) > 0
            ? 'sebagian'
            : 'belum'),
        transactionIds: item.transactionIds || (item.transactionId ? [item.transactionId] : []),
      };

      if (!existing) {
        uniqueMap.set(key, normalized);
      } else {
        // Gabungkan transaksi dan update jika ada record legacy ganda
        const mergedPaid = Math.max(existing.paidAmount, normalized.paidAmount);
        const mergedTxIds = Array.from(
          new Set([...(existing.transactionIds || []), ...(normalized.transactionIds || [])])
        );
        uniqueMap.set(key, {
          ...existing,
          paidAmount: mergedPaid,
          status: mergedPaid >= existing.amount ? 'lunas' : mergedPaid > 0 ? 'sebagian' : 'belum',
          transactionIds: mergedTxIds,
          transactionId: existing.transactionId || normalized.transactionId,
          receiptNumber: existing.receiptNumber || normalized.receiptNumber,
          notes: existing.notes || normalized.notes,
        });
      }
    });

    const deduplicated = Array.from(uniqueMap.values());
    if (!period) return deduplicated;
    return deduplicated.filter((p) => p.period === period);
  },

  async fetchIPLPayments(period?: string): Promise<IPLPayment[]> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const query = period ? `?period=${encodeURIComponent(period)}` : '';
        const json = await safeFetch<ApiResponse<IPLPayment[]>>(`/ipl-payments${query}`);
        if (!json.success) {
          throw new Error(json.error || 'Gagal memuat pembayaran IPL dari Worker API');
        }
        return json.data || [];
      } catch (err) {
        console.error('[DataService] Worker fetchIPLPayments error:', err);
        throw err;
      }
    }
    return this.getIPLPayments(period);
  },

  /**
   * Pencatatan Pembayaran IPL dengan Relasi Utuh & Mencegah Duplikasi:
   * 1 Household + 1 Periode = 1 Record IPL.
   * Mendukung pembayaran bertahap (cicilan).
   * Hanya pertambahan pembayaran (additionalPayment > 0) yang menghasilkan FinancialTransaction kas masuk baru.
   */
  async addIPLPayment(params: {
    householdId: string;
    period: string;
    amount: number;
    paidAmount: number;
    paymentAmount?: number;
    paymentMethod?: PaymentMethod;
    notes?: string;
    receiptNumber?: string;
    referenceNo?: string;
    recordedBy?: string;
    date?: string;
  }): Promise<{ payment: IPLPayment; transaction?: FinancialTransaction; additionalPayment?: number }> {
    const parsedAmount = Math.round(Number(params.amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Tarif tagihan IPL harus lebih besar dari 0 Rupiah.');
    }
    if (!/^\d{4}-\d{2}$/.test(params.period)) {
      throw new Error('Format periode IPL harus YYYY-MM (contoh: 2026-09).');
    }

    const households = this.getHouseholds();
    const household = households.find((h) => h.id === params.householdId);
    if (!household) {
      throw new Error(`Data unit rumah (${params.householdId}) tidak ditemukan.`);
    }

    // Cari existing payment record untuk (householdId, period)
    const currentPayments = this.getIPLPayments();
    const existingPayment = currentPayments.find(
      (p) => p.householdId === params.householdId && p.period === params.period
    );

    const existingPaid = existingPayment ? Math.max(0, Number(existingPayment.paidAmount) || 0) : 0;

    // Tentukan target total akumulasi pembayaran
    let targetPaidAmount = existingPaid;
    if (params.paymentAmount !== undefined) {
      const pAmt = Math.round(Number(params.paymentAmount));
      if (pAmt < 0) {
        throw new Error('Nominal pembayaran tidak boleh bernilai negatif.');
      }
      targetPaidAmount = existingPaid + pAmt;
    } else {
      targetPaidAmount = Math.round(Number(params.paidAmount));
    }

    if (targetPaidAmount < 0) {
      throw new Error('Nominal pembayaran tidak boleh bernilai negatif.');
    }

    // REQUIREMENT 6: Nominal pembayaran IPL tidak boleh melebihi tagihan.
    if (targetPaidAmount > parsedAmount) {
      throw new Error('Nominal pembayaran IPL tidak boleh melebihi tagihan.');
    }

    // Hitung pembayaran tambahan (incremental)
    const additionalPayment = targetPaidAmount - existingPaid;

    // Status pembayaran
    let status: IPLPaymentStatus = 'belum';
    if (targetPaidAmount >= parsedAmount) {
      status = 'lunas';
    } else if (targetPaidAmount > 0) {
      status = 'sebagian';
    }

    const nowIso = new Date().toISOString();
    const paymentDate = params.date || nowIso.split('T')[0];
    const paymentId = existingPayment ? existingPayment.id : generateSafeId('ipl');

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<
          ApiResponse<{ payment: IPLPayment; transaction?: FinancialTransaction; additionalPayment?: number }>
        >('/ipl-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...params,
            amount: parsedAmount,
            paidAmount: targetPaidAmount,
            additionalPayment,
            houseNumber: household.houseNumber,
            residentName: household.residentName,
          }),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal mencatat pembayaran IPL via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker addIPLPayment error:', err);
        throw err;
      }
    }

    // Local Mock: Generate transaction in Buku Kas HANYA jika ada penambahan dana (additionalPayment > 0)
    let createdTransaction: FinancialTransaction | undefined;
    if (additionalPayment > 0) {
      const cleanPeriod = params.period.replace(/-/g, '');
      const cleanHouse = household.houseNumber.replace(/[^a-zA-Z0-9]/g, '');
      const currentTxIds = existingPayment?.transactionIds || (existingPayment?.transactionId ? [existingPayment.transactionId] : []);
      const installmentIndex = currentTxIds.length + 1;
      const receiptNum =
        params.receiptNumber ||
        `IPL-IN/${cleanPeriod}/${cleanHouse}${installmentIndex > 1 ? `-${installmentIndex}` : ''}`;

      createdTransaction = {
        id: generateSafeId('tx'),
        date: paymentDate,
        type: 'in',
        category: 'iuran-bulanan',
        description: `Iuran IPL Periode ${params.period} - ${household.houseNumber} (${household.residentName})${installmentIndex > 1 ? ` (Tahap ${installmentIndex})` : ''}`,
        amount: additionalPayment,
        receiptNumber: receiptNum,
        payerOrRecipient: `${household.residentName} (${household.houseNumber})`,
        paymentMethod: params.paymentMethod || 'transfer_bank',
        referenceNo: params.referenceNo || undefined,
        notes:
          params.notes ||
          `Pembayaran IPL ${status === 'lunas' ? 'Lunas' : 'Sebagian'} unit ${household.houseNumber}`,
        status: 'active',
        householdId: household.id,
        houseNumber: household.houseNumber,
        iplPaymentId: paymentId,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: params.recordedBy || '',
      };

      const currentTxs = this.getTransactions(true);
      setStored(STORAGE_KEYS.TRANSACTIONS, [createdTransaction, ...currentTxs]);
    }

    // Himpun seluruh transactionId untuk audit trail bertahap
    const existingTxIds = existingPayment?.transactionIds
      ? [...existingPayment.transactionIds]
      : existingPayment?.transactionId
      ? [existingPayment.transactionId]
      : [];

    const allTxIds = createdTransaction
      ? [...existingTxIds, createdTransaction.id]
      : existingTxIds;

    const paymentRecord: IPLPayment = {
      id: paymentId,
      householdId: household.id,
      houseNumber: household.houseNumber,
      residentName: household.residentName,
      period: params.period,
      amount: parsedAmount,
      paidAmount: targetPaidAmount,
      status,
      paidAt: targetPaidAmount > 0 ? (createdTransaction ? nowIso : existingPayment?.paidAt || nowIso) : undefined,
      transactionId: existingPayment?.transactionId || createdTransaction?.id,
      transactionIds: allTxIds,
      receiptNumber: createdTransaction?.receiptNumber || existingPayment?.receiptNumber,
      notes: params.notes !== undefined ? params.notes : existingPayment?.notes,
      createdAt: existingPayment ? existingPayment.createdAt : nowIso,
      updatedAt: nowIso,
    };

    // Update list: jika existing perbarui record yang sama (cegah duplicate)
    let updatedPayments: IPLPayment[];
    if (existingPayment) {
      updatedPayments = currentPayments.map((p) => (p.id === paymentId ? paymentRecord : p));
    } else {
      updatedPayments = [paymentRecord, ...currentPayments];
    }

    setStored(STORAGE_KEYS.IPL_PAYMENTS, updatedPayments);
    emitDataChange();

    return { payment: paymentRecord, transaction: createdTransaction, additionalPayment };
  },

  async updateIPLPayment(payment: IPLPayment): Promise<IPLPayment> {
    const nowIso = new Date().toISOString();
    const updatedPayment: IPLPayment = {
      ...payment,
      updatedAt: nowIso,
    };

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<IPLPayment>>(`/ipl-payments/${payment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPayment),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal memperbarui pembayaran IPL via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker updateIPLPayment error:', err);
        throw err;
      }
    }

    const current = this.getIPLPayments();
    const updated = current.map((p) => (p.id === payment.id ? updatedPayment : p));
    setStored(STORAGE_KEYS.IPL_PAYMENTS, updated);
    emitDataChange();
    return updatedPayment;
  },

  getIPLRecap(period?: string): IPLRecap {
    const targetPeriod = period || getCurrentSystemMonth();
    const households = this.getHouseholds();
    // Hanya household aktif: household.isActive !== false
    const activeHouseholds = households.filter((h) => h.isActive !== false);

    // Ambil seluruh transaksi kas aktif untuk periode ini sebagai source of truth pembayaran aktual
    const allTxs = this.getTransactions(true);
    const activeIplTxs = allTxs.filter(
      (t) =>
        t.status !== 'void' &&
        t.type === 'in' &&
        t.category === 'iuran-bulanan' &&
        (t.iplPaymentId || t.householdId) &&
        (t.date.startsWith(targetPeriod) || (t.description && t.description.includes(targetPeriod)))
    );

    // Peta akumulasi pembayaran kas aktif per householdId
    const paidByHousehold = new Map<string, number>();

    // 1. Akumulasi dari transaksi aktif
    activeIplTxs.forEach((t) => {
      if (t.householdId) {
        const cur = paidByHousehold.get(t.householdId) || 0;
        paidByHousehold.set(t.householdId, cur + t.amount);
      }
    });

    // 2. Cross-reference dengan data IPL record jika belum ada transaksi kas eksplisit
    const periodPayments = this.getIPLPayments(targetPeriod);
    periodPayments.forEach((p) => {
      if (!paidByHousehold.has(p.householdId)) {
        paidByHousehold.set(p.householdId, Math.max(0, p.paidAmount || 0));
      }
    });

    let paidCount = 0;
    let partialCount = 0;
    let collectedAmount = 0;
    const standardFee = DEFAULT_MONTHLY_IPL_FEE;

    activeHouseholds.forEach((hh) => {
      const activePaid = paidByHousehold.get(hh.id) || 0;
      collectedAmount += activePaid;

      if (activePaid >= standardFee) {
        paidCount++;
      } else if (activePaid > 0) {
        partialCount++;
      }
    });

    const totalHh = activeHouseholds.length;
    const unpaidCount = Math.max(0, totalHh - paidCount - partialCount);
    const expectedAmount = totalHh * standardFee;
    const outstandingAmount = Math.max(0, expectedAmount - collectedAmount);
    const complianceRate = totalHh > 0 ? Math.round((paidCount / totalHh) * 100) : 0;

    return {
      period: targetPeriod,
      totalHouseholds: totalHh,
      paidHouseholds: paidCount,
      unpaidHouseholds: unpaidCount,
      partialHouseholds: partialCount,
      expectedAmount,
      collectedAmount,
      outstandingAmount,
      complianceRate,
    };
  },

  // ==========================================
  // 6. FINANCIAL TRANSACTIONS & BUKU KAS
  // ==========================================
  getOpeningBalance(): number {
    return getStored<number>(STORAGE_KEYS.OPENING_BALANCE, INITIAL_OPENING_BALANCE);
  },

  getTransactions(includeVoid: boolean = true): FinancialTransaction[] {
    const raw = getStored<FinancialTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const normalized = (raw || []).map((t) => ({
      ...t,
      status: t.status || 'active',
      paymentMethod: t.paymentMethod || 'transfer_bank',
      amount: Math.max(0, Number(t.amount) || 0),
    }));

    if (includeVoid) {
      return normalized;
    }
    return normalized.filter((t) => t.status !== 'void');
  },

  async fetchTransactions(includeVoid: boolean = true): Promise<FinancialTransaction[]> {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DataService] Supabase fetchTransactions error:', error);
    throw new Error(
      error.message || 'Gagal memuat transaksi kas dari Supabase'
    );
  }

  const transactions: FinancialTransaction[] = (data || [])
    .map((item) => ({
      id: item.id,
      date: item.date,
      type: item.type,
      category: item.category,
      description: item.description,
      amount: Math.max(0, Number(item.amount) || 0),
      receiptNumber: item.receipt_number || undefined,
      payerOrRecipient: item.payer_or_recipient || undefined,
      paymentMethod: item.payment_method || 'transfer_bank',
      referenceNo: item.reference_no || undefined,
      notes: item.notes || undefined,
      status: item.status || 'active',
      voidReason: item.void_reason || undefined,
      voidedAt: item.voided_at || undefined,
      voidedBy: item.voided_by || undefined,
      householdId: item.household_id || undefined,
      houseNumber: item.house_number || undefined,
      iplPaymentId: item.ipl_payment_id || undefined,
      createdAt: item.created_at || undefined,
      updatedAt: item.updated_at || undefined,
      createdBy: item.created_by || undefined,
      updatedBy: item.updated_by || undefined,
    }))
    .filter((item) => includeVoid || item.status !== 'void');

  setStored<FinancialTransaction[]>(
    STORAGE_KEYS.TRANSACTIONS,
    transactions
  );

  emitDataChange();

  return transactions;
},

  async addTransaction(
  item: Omit<FinancialTransaction, 'id' | 'createdAt' | 'status'>
): Promise<FinancialTransaction> {
  const parsedAmount = Math.round(Number(item.amount));

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Nominal transaksi kas harus lebih besar dari 0 Rupiah.');
  }

  if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    throw new Error('Format tanggal transaksi tidak valid (harus YYYY-MM-DD).');
  }

  const nowIso = new Date().toISOString();

  const newItem: FinancialTransaction = {
    ...item,
    amount: parsedAmount,
    id: generateSafeId('tx'),
    status: 'active',
    paymentMethod: item.paymentMethod || 'transfer_bank',
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: item.createdBy || '',
  };

  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      id: newItem.id,
      date: newItem.date,
      type: newItem.type,
      category: newItem.category,
      description: newItem.description,
      amount: newItem.amount,
      receipt_number: newItem.receiptNumber ?? null,
      payer_or_recipient: newItem.payerOrRecipient ?? null,
      payment_method: newItem.paymentMethod ?? 'transfer_bank',
      reference_no: newItem.referenceNo ?? null,
      notes: newItem.notes ?? null,
      status: newItem.status,
      household_id: newItem.householdId ?? null,
      house_number: newItem.houseNumber ?? null,
      ipl_payment_id: newItem.iplPaymentId ?? null,
      created_at: newItem.createdAt,
      updated_at: newItem.updatedAt,
      created_by: newItem.createdBy || null,
      updated_by: newItem.updatedBy ?? null,
      void_reason: newItem.voidReason ?? null,
      voided_at: newItem.voidedAt ?? null,
      voided_by: newItem.voidedBy ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[DataService] Supabase addTransaction error:', error);
    throw new Error(
      error.message || 'Gagal menambah transaksi kas ke Supabase'
    );
  }

  const created: FinancialTransaction = {
    id: data.id,
    date: data.date,
    type: data.type,
    category: data.category,
    description: data.description,
    amount: Math.max(0, Number(data.amount) || 0),
    receiptNumber: data.receipt_number || undefined,
    payerOrRecipient: data.payer_or_recipient || undefined,
    paymentMethod: data.payment_method || 'transfer_bank',
    referenceNo: data.reference_no || undefined,
    notes: data.notes || undefined,
    status: data.status || 'active',
    voidReason: data.void_reason || undefined,
    voidedAt: data.voided_at || undefined,
    voidedBy: data.voided_by || undefined,
    householdId: data.household_id || undefined,
    houseNumber: data.house_number || undefined,
    iplPaymentId: data.ipl_payment_id || undefined,
    createdAt: data.created_at || undefined,
    updatedAt: data.updated_at || undefined,
    createdBy: data.created_by || undefined,
    updatedBy: data.updated_by || undefined,
  };

  const current = this.getTransactions(true);

  setStored<FinancialTransaction[]>(
    STORAGE_KEYS.TRANSACTIONS,
    [created, ...current]
  );

  emitDataChange();

  return created;
},

  /**
   * Soft delete / void transaction mechanism.
   * Transaksi kas dibatalkan (void) dengan pencatatan audit log lengkap.
   * REQUIREMENT 9: Jika transaksi terkait dengan pembayaran IPL (iplPaymentId),
   * sistem otomatis menghitung ulang total pembayaran aktif (SUM seluruh transaksi kas aktif)
   * dan memperbarui status IPL terkait agar tetap 100% konsisten dengan Buku Kas.
   */
  async voidTransaction(
    id: string,
    reason: string = 'Pembatalan transaksi oleh bendahara',
    voidedBy: string = ''
  ): Promise<FinancialTransaction | null> {
    const nowIso = new Date().toISOString();

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<FinancialTransaction>>(`/finances/${id}/void`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, voidedBy }),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal membatalkan (void) transaksi via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker voidTransaction error:', err);
        throw err;
      }
    }

    const current = this.getTransactions(true);
    let targetTx: FinancialTransaction | null = null;
    const updated = current.map((t) => {
      if (t.id === id) {
        targetTx = {
          ...t,
          status: 'void',
          voidReason: reason,
          voidedAt: nowIso,
          voidedBy,
          updatedAt: nowIso,
        };
        return targetTx;
      }
      return t;
    });

    setStored(STORAGE_KEYS.TRANSACTIONS, updated);

    // Sinkronisasi status IPL jika transaksi yang di-void adalah pembayaran IPL
    if (targetTx && (targetTx as FinancialTransaction).iplPaymentId) {
      const iplId = (targetTx as FinancialTransaction).iplPaymentId!;
      const currentIPLs = this.getIPLPayments();
      const targetIpl = currentIPLs.find((p) => p.id === iplId);

      if (targetIpl) {
        // Hitung ulang total pembayaran IPL aktif = SUM semua financial transaction aktif yang terkait IPL tersebut
        const activeTxsForIpl = updated.filter(
          (t) => t.iplPaymentId === iplId && t.status !== 'void' && t.type === 'in'
        );
        const newPaidAmount = activeTxsForIpl.reduce((sum, t) => sum + (t.amount || 0), 0);

        let newStatus: IPLPaymentStatus = 'belum';
        if (newPaidAmount >= targetIpl.amount) {
          newStatus = 'lunas';
        } else if (newPaidAmount > 0) {
          newStatus = 'sebagian';
        }

        const activeTxIds = activeTxsForIpl.map((t) => t.id);
        const updatedIPL: IPLPayment = {
          ...targetIpl,
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: activeTxsForIpl.length > 0 ? activeTxsForIpl[0].date : undefined,
          transactionId: activeTxIds[0],
          transactionIds: activeTxIds,
          updatedAt: nowIso,
        };

        const updatedIPLList = currentIPLs.map((p) => (p.id === iplId ? updatedIPL : p));
        setStored(STORAGE_KEYS.IPL_PAYMENTS, updatedIPLList);
      }
    }

    emitDataChange();
    return targetTx;
  },

  async deleteTransaction(id: string): Promise<void> {
    await this.voidTransaction(id, 'Dibatalkan melalui aksi pengurus');
  },

  getAvailableTransactionMonths(): string[] {
    const txs = this.getTransactions(true);
    const monthSet = new Set<string>();

    monthSet.add(getCurrentSystemMonth());

    txs.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse();
  },

  getFinancialMetrics(periodFilter: FinancialPeriodFilter = { type: 'current_month' }): FinancialSummary {
    const openingBalance = this.getOpeningBalance();
    const allTxs = this.getTransactions(true);
    const activeTxs = allTxs.filter((t) => t.status !== 'void');

    let totalIn = 0;
    let totalOut = 0;
    let periodIn = 0;
    let periodOut = 0;

    let targetPrefix: string | null = null;
    if (periodFilter.type === 'current_month') {
      targetPrefix = getCurrentSystemMonth();
    } else if (periodFilter.type === 'custom_month' && periodFilter.month) {
      targetPrefix = periodFilter.month;
    }

    for (const t of activeTxs) {
      if (t.type === 'in') {
        totalIn += t.amount;
        if (targetPrefix === null || t.date.startsWith(targetPrefix)) {
          periodIn += t.amount;
        }
      } else if (t.type === 'out') {
        totalOut += t.amount;
        if (targetPrefix === null || t.date.startsWith(targetPrefix)) {
          periodOut += t.amount;
        }
      }
    }

    const currentBalance = openingBalance + totalIn - totalOut;

    // Hitung metrik IPL dinamis berdasarkan periode laporan aktif
    const recapPeriod = targetPrefix || getCurrentSystemMonth();
    const iplRecap = this.getIPLRecap(recapPeriod);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return {
      openingBalance,
      currentBalance,
      currentMonthIn: periodIn,
      currentMonthOut: periodOut,
      totalIn,
      totalOut,
      periodLabel: formatPeriodLabel(periodFilter),
      activePeriod: periodFilter,
      activeHouseholds: iplRecap.totalHouseholds,
      paidHouseholds: iplRecap.paidHouseholds,
      unpaidHouseholds: iplRecap.unpaidHouseholds,
      complianceRate: iplRecap.complianceRate,
      monthlyFeePerHouse: DEFAULT_MONTHLY_IPL_FEE,
      monthlyIPLExpected: iplRecap.expectedAmount,
      monthlyIPLCollected: iplRecap.collectedAmount,
      monthlyIPLOutstanding: iplRecap.outstandingAmount,
      asOfDate: dateFormatted,
      isDemo: false,
    };
  },

  // ==========================================
  // 7. DOCUMENTATION / GALLERY
  // ==========================================
    // ==========================================
  // 7. DOCUMENTATION
  // ==========================================

  getDocumentation(): Documentation[] {
    return getStored<Documentation[]>(
      STORAGE_KEYS.DOCUMENTATION,
      []
    );
  },

  async fetchDocumentation(): Promise<Documentation[]> {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataService] Supabase fetchDocumentation error:', error);
      throw new Error(
        error.message || 'Gagal memuat dokumentasi dari Supabase'
      );
    }

    const documentation: Documentation[] = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      category: item.category,
      description: item.description || '',
      image: item.image_url,
      photographer: item.photographer || '',
      createdAt: item.created_at,
    }));

    setStored<Documentation[]>(
      STORAGE_KEYS.DOCUMENTATION,
      documentation
    );

    emitDataChange();

    return documentation;
  },

  async addDocumentation(
    item: Omit<Documentation, 'id' | 'createdAt' | 'image'>,
    imageFile: File
  ): Promise<Documentation> {
    const id = generateSafeId('doc');

    const extension =
      imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';

    const filePath = `${id}-${Date.now()}.${extension}`;

    // 1. Upload foto ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documentation')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error(
        '[DataService] Supabase uploadDocumentation error:',
        uploadError
      );
      throw new Error(
        uploadError.message || 'Gagal mengunggah foto dokumentasi'
      );
    }

    // 2. Ambil URL publik foto
    const { data: publicUrlData } = supabase.storage
      .from('documentation')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // 3. Simpan metadata ke tabel documentation
    const { data, error } = await supabase
      .from('documentation')
      .insert({
        id,
        title: item.title,
        date: item.date,
        category: item.category,
        description: item.description,
        image_url: imageUrl,
        photographer: item.photographer,
      })
      .select()
      .single();

    if (error) {
      console.error(
        '[DataService] Supabase addDocumentation error:',
        error
      );
      throw new Error(
        error.message || 'Gagal menyimpan dokumentasi'
      );
    }

    const documentation: Documentation = {
      id: data.id,
      title: data.title,
      date: data.date,
      category: data.category,
      description: data.description || '',
      image: data.image_url,
      photographer: data.photographer || '',
      createdAt: data.created_at,
    };

    const current = this.getDocumentation();

    setStored<Documentation[]>(
      STORAGE_KEYS.DOCUMENTATION,
      [documentation, ...current]
    );

    emitDataChange();

    return documentation;
  },

    async updateDocumentation(
    id: string,
    item: Partial<Omit<Documentation, 'id' | 'createdAt'>>,
    imageFile?: File
  ): Promise<Documentation> {
    // Ambil data lama dari database
    const { data: existing, error: fetchError } = await supabase
      .from('documentation')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new Error(
        fetchError?.message || 'Dokumentasi tidak ditemukan'
      );
    }

    let imageUrl = existing.image_url;
    let oldFilePath: string | null = null;
    let newFilePath: string | null = null;

    // Jika admin memilih foto baru
    if (imageFile) {
      const extension =
        imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';

      newFilePath = `${id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('documentation')
        .upload(newFilePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message || 'Gagal mengunggah foto baru'
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from('documentation')
        .getPublicUrl(newFilePath);

      imageUrl = publicUrlData.publicUrl;

      // Ambil path foto lama untuk dihapus setelah update database berhasil
      try {
        const oldUrl = new URL(existing.image_url);
        const marker = '/storage/v1/object/public/documentation/';
        const index = oldUrl.pathname.indexOf(marker);

        if (index !== -1) {
          oldFilePath = decodeURIComponent(
            oldUrl.pathname.substring(index + marker.length)
          );
        }
      } catch {
        oldFilePath = null;
      }
    }

    // Update data dokumentasi
    const { data, error } = await supabase
      .from('documentation')
      .update({
        title: item.title ?? existing.title,
        date: item.date ?? existing.date,
        category: item.category ?? existing.category,
        description: item.description ?? existing.description,
        photographer: item.photographer ?? existing.photographer,
        image_url: imageUrl,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Jika database gagal di-update, hapus foto baru
      if (newFilePath) {
        await supabase.storage
          .from('documentation')
          .remove([newFilePath]);
      }

      throw new Error(
        error.message || 'Gagal memperbarui dokumentasi'
      );
    }

    // Database berhasil → hapus foto lama
    if (oldFilePath) {
      const { error: storageError } = await supabase.storage
        .from('documentation')
        .remove([oldFilePath]);

      if (storageError) {
        console.error(
          '[DataService] Gagal menghapus foto lama:',
          storageError
        );
      }
    }

    const documentation: Documentation = {
      id: data.id,
      title: data.title,
      date: data.date,
      category: data.category,
      description: data.description || '',
      image: data.image_url,
      photographer: data.photographer || '',
      createdAt: data.created_at,
    };

    // Update local cache
    const current = this.getDocumentation();

    setStored<Documentation[]>(
      STORAGE_KEYS.DOCUMENTATION,
      current.map((doc) =>
        doc.id === id ? documentation : doc
      )
    );

    emitDataChange();

    return documentation;
  },

    async deleteDocumentation(id: string): Promise<void> {
    // Cari data foto terlebih dahulu.
    // maybeSingle() mencegah error 406 jika data sudah tidak ada.
    const { data: existing, error: fetchError } = await supabase
      .from('documentation')
      .select('image_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new Error(
        fetchError.message || 'Gagal mencari dokumentasi'
      );
    }

    // Hapus data dari database jika masih ada
    const { error: deleteError } = await supabase
      .from('documentation')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(
        deleteError.message || 'Gagal menghapus dokumentasi'
      );
    }

    // Jika data database memiliki foto,
    // coba hapus file foto dari Storage.
    if (existing?.image_url) {
      try {
        const imageUrl = new URL(existing.image_url);
        const marker =
          '/storage/v1/object/public/documentation/';
        const index = imageUrl.pathname.indexOf(marker);

        if (index !== -1) {
          const filePath = decodeURIComponent(
            imageUrl.pathname.substring(
              index + marker.length
            )
          );

          if (filePath) {
            const { error: storageError } =
              await supabase.storage
                .from('documentation')
                .remove([filePath]);

            if (storageError) {
              console.error(
                '[DataService] Gagal menghapus foto dari Storage:',
                storageError
              );
            }
          }
        }
      } catch (error) {
        console.error(
          '[DataService] Gagal memproses URL foto:',
          error
        );
      }
    }

    // Bersihkan local cache
    const current = this.getDocumentation();

    setStored<Documentation[]>(
      STORAGE_KEYS.DOCUMENTATION,
      current.filter((doc) => doc.id !== id)
    );

    emitDataChange();
  },
  // ==========================================
  // 8. CITIZEN REPORTS & SUGGESTIONS
  // ==========================================
  getReports(): CitizenReport[] {
    return getStored<CitizenReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  },

  async fetchReports(): Promise<CitizenReport[]> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<CitizenReport[]>>('/reports');
        if (!json.success) {
          throw new Error(json.error || 'Gagal memuat laporan warga dari Worker API');
        }
        return json.data || [];
      } catch (err) {
        console.error('[DataService] Worker fetchReports error:', err);
        throw err;
      }
    }
    return this.getReports();
  },

  async submitReport(report: Omit<CitizenReport, 'id' | 'date' | 'status' | 'createdAt'>): Promise<CitizenReport> {
    const today = new Date().toISOString().split('T')[0];
    const newReport: CitizenReport = {
      ...report,
      id: generateSafeId('rep'),
      date: today,
      status: 'menunggu',
      createdAt: new Date().toISOString(),
    };

    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<CitizenReport>>('/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport),
        });
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Gagal mengirim aspirasi via Worker API');
        }
        emitDataChange();
        return json.data;
      } catch (err) {
        console.error('[DataService] Worker submitReport error:', err);
        throw err;
      }
    }

    const current = this.getReports();
    const updated = [newReport, ...current];
    setStored(STORAGE_KEYS.REPORTS, updated);
    emitDataChange();
    return newReport;
  },

  async updateReportStatus(id: string, status: CitizenReport['status']): Promise<void> {
    if (DATA_CONFIG.mode === 'cloudflare_worker') {
      try {
        const json = await safeFetch<ApiResponse<void>>(`/reports/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!json.success) {
          throw new Error(json.error || 'Gagal memperbarui status laporan via Worker API');
        }
        emitDataChange();
        return;
      } catch (err) {
        console.error('[DataService] Worker updateReportStatus error:', err);
        throw err;
      }
    }

    const current = this.getReports();
    const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
    setStored(STORAGE_KEYS.REPORTS, updated);
    emitDataChange();
  },

// ==========================================
// 9. RONDA / SISKAMLING SCHEDULE
// ==========================================
getRondaSchedules(): RondaSchedule[] {
  return [...RONDA_SCHEDULES];
},

async fetchRondaSchedules(): Promise<RondaSchedule[]> {
  const { data, error } = await supabase
    .from('ronda_schedules')
    .select('id, day, team, coordinator, houses')
    .order('id', { ascending: true });

  if (error) {
    console.error('[DataService] Supabase fetchRondaSchedules error:', error);
    throw new Error(error.message || 'Gagal memuat jadwal ronda');
  }

  const schedules: RondaSchedule[] = (data ?? []).map((item) => ({
    id: item.id,
    day: item.day,
    team: item.team,
    coordinator: item.coordinator,
    houses: Array.isArray(item.houses) ? item.houses : [],
  }));

  return schedules;
},

async addRondaSchedule(
  item: Omit<RondaSchedule, 'id'>
): Promise<RondaSchedule> {
  const { data, error } = await supabase
    .from('ronda_schedules')
    .insert({
      day: item.day,
      team: item.team,
      coordinator: item.coordinator,
      houses: item.houses,
    })
    .select('id, day, team, coordinator, houses')
    .single();

  if (error) {
    console.error('[DataService] Supabase addRondaSchedule error:', error);
    throw new Error(error.message || 'Gagal menambah jadwal ronda');
  }

  const schedule: RondaSchedule = {
    id: data.id,
    day: data.day,
    team: data.team,
    coordinator: data.coordinator,
    houses: Array.isArray(data.houses) ? data.houses : [],
  };

  await this.fetchRondaSchedules();
  emitDataChange();

  return schedule;
},

async updateRondaSchedule(
  id: string,
  item: Partial<Omit<RondaSchedule, 'id'>>
): Promise<RondaSchedule> {
  const { data, error } = await supabase
    .from('ronda_schedules')
    .update({
      ...(item.day !== undefined ? { day: item.day } : {}),
      ...(item.team !== undefined ? { team: item.team } : {}),
      ...(item.coordinator !== undefined
        ? { coordinator: item.coordinator }
        : {}),
      ...(item.houses !== undefined ? { houses: item.houses } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, day, team, coordinator, houses')
    .single();

  if (error) {
    console.error('[DataService] Supabase updateRondaSchedule error:', error);
    throw new Error(error.message || 'Gagal memperbarui jadwal ronda');
  }

  const schedule: RondaSchedule = {
    id: data.id,
    day: data.day,
    team: data.team,
    coordinator: data.coordinator,
    houses: Array.isArray(data.houses) ? data.houses : [],
  };

  await this.fetchRondaSchedules();
  emitDataChange();

  return schedule;
},

async deleteRondaSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('ronda_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DataService] Supabase deleteRondaSchedule error:', error);
    throw new Error(error.message || 'Gagal menghapus jadwal ronda');
  }

  await this.fetchRondaSchedules();
  emitDataChange();
},

  // ==========================================
  // 10. DATA LIFECYCLE & SUBSCRIPTIONS
  // ==========================================
  resetAllData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEYS.OPENING_BALANCE);
      localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
      localStorage.removeItem(STORAGE_KEYS.AGENDAS);
      localStorage.removeItem(STORAGE_KEYS.WORK_PROGRAMS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.DOCUMENTATION);
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
      localStorage.removeItem(STORAGE_KEYS.HOUSEHOLDS);
      localStorage.removeItem(STORAGE_KEYS.IPL_PAYMENTS);
    }
    emitDataChange();
  },

  subscribe(listener: DataListener): () => void {
    changeListeners.add(listener);
    return () => {
      changeListeners.delete(listener);
    };
  },

  // ==========================================
  // 11. CLOUDFLARE D1 & WORKER CODE GENERATION
  // ==========================================
  generateD1SchemaSql(): string {
    return `-- ==========================================================
-- Schema Cloudflare D1 (SQLite Edge) untuk Portal Warga Blok H
-- Griya Adika Narama - RT 04 / RW 12
-- Perintah deploy: npx wrangler d1 execute narama-db --file=./schema.sql
-- ==========================================================

-- 1. Tabel Master Konfigurasi & Saldo Awal Kas
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inisialisasi Saldo Kas Awal Pembukuan (Bukan transaksi pemasukan)
INSERT OR IGNORE INTO system_settings (key, value, description)
VALUES ('initial_opening_balance', '5000000', 'Saldo Kas Awal Pembukuan Paguyuban (IDR)');

-- 2. Tabel Unit Rumah Warga (Household)
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  house_number TEXT UNIQUE NOT NULL, -- Contoh: H-01, H-02
  resident_name TEXT NOT NULL,
  occupancy_status TEXT NOT NULL CHECK(occupancy_status IN ('huni', 'semi-huni', 'kosong')),
  is_active INTEGER DEFAULT 1,
  phone TEXT,
  family_members INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Pembayaran IPL (Iuran Pengelolaan Lingkungan)
-- ATURAN UTAMA: 1 Household + 1 Periode = 1 Record Unik
CREATE TABLE IF NOT EXISTS ipl_payments (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  house_number TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  period TEXT NOT NULL, -- Format YYYY-MM
  amount INTEGER NOT NULL CHECK(amount > 0),
  paid_amount INTEGER DEFAULT 0 CHECK(paid_amount >= 0),
  status TEXT NOT NULL CHECK(status IN ('belum', 'lunas', 'sebagian')),
  paid_at TIMESTAMP,
  transaction_id TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id),
  UNIQUE(household_id, period)
);

-- Constraint Unik D1: Mencegah duplikasi pembayaran untuk household & periode yang sama
CREATE UNIQUE INDEX IF NOT EXISTS idx_ipl_household_period
ON ipl_payments(household_id, period);

-- 4. Tabel Transaksi Buku Kas Warga (Dengan Dukungan Audit Trail & Soft Delete / Void)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- Format YYYY-MM-DD
  type TEXT NOT NULL CHECK(type IN ('in', 'out')), -- Arus kas: in / out
  category TEXT NOT NULL, -- Pos anggaran transaksi
  description TEXT NOT NULL, -- Uraian transaksi
  amount INTEGER NOT NULL CHECK(amount > 0), -- Nominal positif (IDR)
  receipt_number TEXT, -- Nomor bukti kuitansi
  payer_or_recipient TEXT, -- Pembayar / Penerima
  payment_method TEXT DEFAULT 'transfer_bank', -- tunai, transfer_bank, qris, dll
  reference_no TEXT, -- Nomor referensi mutasi bank / slip transfer
  notes TEXT, -- Catatan audit bendahara
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'void')), -- 'active' dihitung saldo, 'void' dibatalkan
  void_reason TEXT, -- Alasan pembatalan jika status 'void'
  voided_at TIMESTAMP, -- Waktu pembatalan
  voided_by TEXT, -- Aktor pembatalan
  household_id TEXT, -- Relasi opsional ke rumah warga (jika IPL)
  house_number TEXT,
  ipl_payment_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT DEFAULT 'bendahara_demo',
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_ipl_payment ON transactions(ipl_payment_id);

-- 5. Tabel Pengumuman Warga
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  tagline TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Agenda & Kegiatan Lingkungan
CREATE TABLE IF NOT EXISTS agendas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  pic TEXT,
  status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Program Kerja Pengurus
CREATE TABLE IF NOT EXISTS work_programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  term TEXT NOT NULL CHECK(term IN ('pendek', 'menengah', 'panjang')),
  period TEXT NOT NULL,
  description TEXT,
  pic TEXT,
  budget_estimated INTEGER DEFAULT 0,
  budget_realized INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'rencana' CHECK(status IN ('rencana', 'berjalan', 'selesai', 'evaluasi')),
  targets_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Galeri Dokumentasi
CREATE TABLE IF NOT EXISTS documentation (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  photographer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Lapor Warga / Aspirasi
CREATE TABLE IF NOT EXISTS citizen_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  house_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'menunggu' CHECK(status IN ('menunggu', 'diproses', 'selesai')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
  },

  generateCloudflareWorkerExample(): string {
    return `/**
 * Cloudflare Worker API Layer (src/worker.ts)
 * Siap dideploy bersama Cloudflare D1 Database Binding: env.DB
 *
 * ARSITEKTUR KEUANGAN & INTEGRITAS DATA:
 * 1. Atomisitas Transaksi (D1 Batch): Mutasi kas dan update IPL dieksekusi bersamaan via env.DB.batch.
 * 2. Cegah Duplikasi: 1 Household + 1 Periode = 1 Record IPL.
 * 3. Pembayaran Bertahap: additionalPayment = targetPaid - existingPaid. Hanya selisih positif yang dicatat ke kas.
 * 4. Zero Silent Fallback: Exception langsung dikembalikan sebagai respons HTTP 400 / 500.
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN?: string; // Misal: https://portal-narama.pages.dev
}

function jsonResponse<T>(data: T, status: number = 200, origin: string = '*'): Response {
  return new Response(
    JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}

function errorResponse(message: string, status: number = 400, origin: string = '*'): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const originHeader = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN
      ? (env.ALLOWED_ORIGIN.split(',').includes(originHeader) ? originHeader : env.ALLOWED_ORIGIN.split(',')[0])
      : '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }

    try {
      // -------------------------------------------------------------
      // 1. HOUSEHOLDS API
      // -------------------------------------------------------------
      if (url.pathname === '/api/households' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT id, house_number, resident_name, occupancy_status, is_active, phone, family_members, notes, created_at, updated_at FROM households ORDER BY house_number ASC'
        ).all();
        const mapped = (results || []).map((row: any) => ({
          id: row.id,
          houseNumber: row.house_number,
          residentName: row.resident_name,
          occupancyStatus: row.occupancy_status,
          isActive: Boolean(row.is_active),
          phone: row.phone,
          familyMembers: row.family_members,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        return jsonResponse(mapped, 200, allowedOrigin);
      }

      if (url.pathname === '/api/households' && request.method === 'POST') {
        const body = await request.json();
        const id = body.id || 'hh-' + Date.now();
        const now = new Date().toISOString();
        await env.DB.prepare(
          'INSERT INTO households (id, house_number, resident_name, occupancy_status, is_active, phone, family_members, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          id,
          body.houseNumber,
          body.residentName,
          body.occupancyStatus || 'huni',
          body.isActive !== false ? 1 : 0,
          body.phone || null,
          body.familyMembers || 1,
          body.notes || null,
          now,
          now
        ).run();
        return jsonResponse({ id, ...body, createdAt: now, updatedAt: now }, 201, allowedOrigin);
      }

      if (url.pathname.startsWith('/api/households/') && url.pathname.endsWith('/deactivate') && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        const now = new Date().toISOString();
        await env.DB.prepare('UPDATE households SET is_active = 0, updated_at = ? WHERE id = ?').bind(now, id).run();
        return jsonResponse({ id, isActive: false, updatedAt: now }, 200, allowedOrigin);
      }

      // -------------------------------------------------------------
      // 2. IPL PAYMENTS & ATOMIC BATCH OPERATION
      // -------------------------------------------------------------
      if (url.pathname === '/api/ipl-payments' && request.method === 'GET') {
        const period = url.searchParams.get('period');
        let query = 'SELECT * FROM ipl_payments ORDER BY house_number ASC';
        let stmt = env.DB.prepare(query);
        if (period) {
          query = 'SELECT * FROM ipl_payments WHERE period = ? ORDER BY house_number ASC';
          stmt = env.DB.prepare(query).bind(period);
        }
        const { results } = await stmt.all();
        const mapped = (results || []).map((row: any) => ({
          id: row.id,
          householdId: row.household_id,
          houseNumber: row.house_number,
          residentName: row.resident_name,
          period: row.period,
          amount: Number(row.amount),
          paidAmount: Number(row.paid_amount),
          status: row.status,
          paidAt: row.paid_at,
          transactionId: row.transaction_id,
          receiptNumber: row.receipt_number,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        return jsonResponse(mapped, 200, allowedOrigin);
      }

      if (url.pathname === '/api/ipl-payments' && request.method === 'POST') {
        const body = await request.json();
        const now = new Date().toISOString();
        const amount = Number(body.amount) || 50000;
        const requestedPaid = Number(body.paidAmount) || 0;

        if (amount <= 0) {
          return errorResponse('Tarif tagihan IPL harus lebih besar dari 0 Rupiah.', 400, allowedOrigin);
        }
        if (requestedPaid < 0) {
          return errorResponse('Nominal pembayaran tidak boleh bernilai negatif.', 400, allowedOrigin);
        }
        if (requestedPaid > amount) {
          return errorResponse('Nominal pembayaran IPL tidak boleh melebihi tagihan.', 400, allowedOrigin);
        }

        // Pengecekan record existing (Aturan: 1 Household + 1 Periode = 1 Record)
        const existingRow: any = await env.DB.prepare(
          'SELECT * FROM ipl_payments WHERE household_id = ? AND period = ?'
        ).bind(body.householdId, body.period).first();

        const existingPaid = existingRow ? Number(existingRow.paid_amount || 0) : 0;
        const targetPaid = requestedPaid;
        const additionalPayment = targetPaid - existingPaid;

        const status = targetPaid >= amount ? 'lunas' : targetPaid > 0 ? 'sebagian' : 'belum';
        const iplId = existingRow ? existingRow.id : (body.id || 'ipl-' + Date.now());

        const batchStatements = [];
        let txId: string | null = null;

        // Jika ada penambahan pembayaran kas, catat mutasi kas masuk baru sebesar additionalPayment
        if (additionalPayment > 0) {
          txId = 'tx-' + Date.now();
          const cleanPeriod = body.period.replace(/-/g, '');
          const cleanHouse = body.houseNumber.replace(/[^a-zA-Z0-9]/g, '');
          const receiptNum = body.receiptNumber || ('IPL/' + cleanPeriod + '/' + cleanHouse);
          const desc = 'Iuran IPL Periode ' + body.period + ' - ' + body.houseNumber + ' (' + body.residentName + ')';

          batchStatements.push(
            env.DB.prepare(
              'INSERT INTO transactions (' +
              'id, date, type, category, description, amount, receipt_number, ' +
              'payer_or_recipient, payment_method, reference_no, notes, status, household_id, house_number, ipl_payment_id, created_at, updated_at' +
              ') VALUES (?, ?, "in", "iuran-bulanan", ?, ?, ?, ?, ?, ?, ?, "active", ?, ?, ?, ?, ?)'
            ).bind(
              txId,
              body.date || now.slice(0, 10),
              desc,
              additionalPayment,
              receiptNum,
              body.residentName + ' (' + body.houseNumber + ')',
              body.paymentMethod || 'transfer_bank',
              body.referenceNo || null,
              body.notes || ('Pembayaran IPL ' + status),
              body.householdId,
              body.houseNumber,
              iplId,
              now,
              now
            )
          );
        }

        if (existingRow) {
          batchStatements.push(
            env.DB.prepare(
              'UPDATE ipl_payments SET ' +
              'amount = ?, paid_amount = ?, status = ?, ' +
              'paid_at = CASE WHEN ? > 0 THEN ? ELSE paid_at END, ' +
              'notes = COALESCE(?, notes), updated_at = ? WHERE id = ?'
            ).bind(
              amount,
              targetPaid,
              status,
              targetPaid,
              now,
              body.notes || null,
              now,
              iplId
            )
          );
        } else {
          batchStatements.push(
            env.DB.prepare(
              'INSERT INTO ipl_payments (' +
              'id, household_id, house_number, resident_name, period, ' +
              'amount, paid_amount, status, paid_at, transaction_id, notes, created_at, updated_at' +
              ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              iplId,
              body.householdId,
              body.houseNumber,
              body.residentName,
              body.period,
              amount,
              targetPaid,
              status,
              targetPaid > 0 ? now : null,
              txId,
              body.notes || null,
              now,
              now
            )
          );
        }

        // Operasi Atomik Batch D1
        await env.DB.batch(batchStatements);

        return jsonResponse({
          payment: {
            id: iplId,
            householdId: body.householdId,
            houseNumber: body.houseNumber,
            residentName: body.residentName,
            period: body.period,
            amount,
            paidAmount: targetPaid,
            status,
            paidAt: targetPaid > 0 ? now : undefined,
            transactionId: txId || existingRow?.transaction_id,
            notes: body.notes,
            updatedAt: now,
          },
          additionalPayment,
          transactionId: txId,
        }, 201, allowedOrigin);
      }

      // -------------------------------------------------------------
      // 3. FINANCES (BUKU KAS) API
      // -------------------------------------------------------------
      if (url.pathname === '/api/finances' && request.method === 'GET') {
        const includeVoid = url.searchParams.get('includeVoid') === 'true';
        const query = includeVoid
          ? 'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
          : 'SELECT * FROM transactions WHERE status = "active" ORDER BY date DESC, created_at DESC';

        const { results } = await env.DB.prepare(query).all();
        const mapped = (results || []).map((row: any) => ({
          id: row.id,
          date: row.date,
          type: row.type,
          category: row.category,
          description: row.description,
          amount: Number(row.amount),
          receiptNumber: row.receipt_number,
          payerOrRecipient: row.payer_or_recipient,
          paymentMethod: row.payment_method,
          referenceNo: row.reference_no,
          notes: row.notes,
          status: row.status || 'active',
          voidReason: row.void_reason,
          voidedAt: row.voided_at,
          voidedBy: row.voided_by,
          householdId: row.household_id,
          houseNumber: row.house_number,
          iplPaymentId: row.ipl_payment_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
          updatedBy: row.updated_by,
        }));
        return jsonResponse(mapped, 200, allowedOrigin);
      }

      if (url.pathname === '/api/finances' && request.method === 'POST') {
        const body = await request.json();
        const id = body.id || 'tx-' + Date.now();
        const now = new Date().toISOString();

        await env.DB.prepare(
          'INSERT INTO transactions (' +
          'id, date, type, category, description, amount, ' +
          'receipt_number, payer_or_recipient, payment_method, reference_no, ' +
          'notes, status, created_at, updated_at, created_by' +
          ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active", ?, ?, ?)'
        ).bind(
          id,
          body.date,
          body.type,
          body.category,
          body.description,
          Number(body.amount),
          body.receiptNumber || null,
          body.payerOrRecipient || null,
          body.paymentMethod || 'transfer_bank',
          body.referenceNo || null,
          body.notes || null,
          now,
          now,
          body.createdBy || 'bendahara'
        ).run();

        return jsonResponse({ id, ...body, status: 'active', createdAt: now }, 201, allowedOrigin);
      }

      if (url.pathname.startsWith('/api/finances/') && url.pathname.endsWith('/void') && request.method === 'PUT') {
        const parts = url.pathname.split('/');
        const id = parts[3];
        const body = await request.json().catch(() => ({}));
        const now = new Date().toISOString();

        await env.DB.prepare(
          'UPDATE transactions SET status = "void", void_reason = ?, voided_at = ?, voided_by = ?, updated_at = ? WHERE id = ?'
        ).bind(
          body.reason || 'Dibatalkan oleh pengurus',
          now,
          body.voidedBy || 'admin',
          now,
          id
        ).run();

        return jsonResponse({ id, status: 'void', voidedAt: now }, 200, allowedOrigin);
      }

      return errorResponse('Endpoint tidak ditemukan (404)', 404, allowedOrigin);
    } catch (err: any) {
      return errorResponse(err.message || 'Internal Server Error', 500, allowedOrigin);
    }
  },
};`;
  },
};

if (typeof window !== 'undefined') {
  (window as any).__migrateLocalTransactionsToSupabase =
    migrateLocalTransactionsToSupabase;
}