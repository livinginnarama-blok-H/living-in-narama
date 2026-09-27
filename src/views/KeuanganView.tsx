import React, { useState, useEffect, useMemo } from 'react';
import {
  FinanceTransaction,
  FinancialPeriodFilter,
  FinancialSummary,
  FinancialTransactionCategory,
  FinancialTransactionType,
  PaymentMethod,
  Household,
  IPLPayment,
} from '../types/portal';
import {
  DataService,
  getCurrentSystemMonth,
  formatAuditDate,
  DEFAULT_MONTHLY_IPL_FEE,
} from '../services/dataService';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Printer,
  Copy,
  Check,
  Building,
  X,
  Calendar,
  AlertCircle,
  Ban,
  RotateCcw,
  CreditCard,
  FileText,
  Clock,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

interface KeuanganViewProps {
  isAdmin: boolean;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({ isAdmin }) => {
  // Period filter state: default is current system month
  const [periodFilter, setPeriodFilter] = useState<FinancialPeriodFilter>({
    type: 'current_month',
  });

  // Active view tab: Buku Kas vs Rekapitulasi IPL
  const [activeSubTab, setActiveSubTab] = useState<'buku_kas' | 'rekap_ipl'>('buku_kas');

  // Available recorded months from data repository
  const [availableMonths, setAvailableMonths] = useState<string[]>(() =>
    DataService.getAvailableTransactionMonths()
  );

  // Financial transactions & summary metrics from DataService (Single Source of Truth)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() =>
    DataService.getTransactions(true)
  );

  const [metrics, setMetrics] = useState<FinancialSummary>(() =>
    DataService.getFinancialMetrics(periodFilter)
  );

  // Households and IPL Payments from DataService
  const [households, setHouseholds] = useState<Household[]>(() =>
    DataService.getHouseholds()
  );

  const [iplPayments, setIplPayments] = useState<IPLPayment[]>(() =>
    DataService.getIPLPayments()
  );

  // Filtering states for Buku Kas
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'void'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);

  // Filtering states for Rekap IPL
  const [iplStatusFilter, setIplStatusFilter] = useState<'all' | 'lunas' | 'sebagian' | 'belum'>('all');
  const [iplSearchQuery, setIplSearchQuery] = useState('');

  // Feedback error/success message
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Subscribe to centralized DataService
  useEffect(() => {
    const unsubscribe = DataService.subscribe(() => {
      setTransactions(DataService.getTransactions(true));
      setAvailableMonths(DataService.getAvailableTransactionMonths());
      setMetrics(DataService.getFinancialMetrics(periodFilter));
      setHouseholds(DataService.getHouseholds());
      setIplPayments(DataService.getIPLPayments());
    });
    return unsubscribe;
  }, [periodFilter]);

  // Recalculate metrics when period filter changes
  useEffect(() => {
    setMetrics(DataService.getFinancialMetrics(periodFilter));
  }, [periodFilter]);

  // Admin Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newType, setNewType] = useState<FinancialTransactionType>('in');
  const [newCategory, setNewCategory] = useState<FinancialTransactionCategory>('iuran-bulanan');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState(150000);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPayer, setNewPayer] = useState('');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('transfer_bank');
  const [newRefNo, setNewRefNo] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newHouseholdId, setNewHouseholdId] = useState('');

  // Admin Record IPL Modal State (Mendukung Pembayaran Bertahap)
  const [isIplModalOpen, setIsIplModalOpen] = useState(false);
  const [iplTargetHouseholdId, setIplTargetHouseholdId] = useState('');
  const [iplStagePayment, setIplStagePayment] = useState<number>(DEFAULT_MONTHLY_IPL_FEE);
  const [iplMethod, setIplMethod] = useState<PaymentMethod>('transfer_bank');
  const [iplRefNo, setIplRefNo] = useState('');
  const [iplNotes, setIplNotes] = useState('');

  // Admin Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [targetVoidTx, setTargetVoidTx] = useState<FinanceTransaction | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState('');

  // Transaction Detail Modal State
  const [detailTx, setDetailTx] = useState<FinanceTransaction | null>(null);

  // Active period prefix for IPL lookup
  const activePeriodMonth = useMemo(() => {
    if (periodFilter.type === 'custom_month' && periodFilter.month) {
      return periodFilter.month;
    }
    return getCurrentSystemMonth();
  }, [periodFilter]);

  // Existing IPL Payment lookup for target household in modal
  const currentModalExistingPayment = useMemo(() => {
    if (!iplTargetHouseholdId) return null;
    return iplPayments.find(
      (p) => p.householdId === iplTargetHouseholdId && p.period === activePeriodMonth
    ) || null;
  }, [iplTargetHouseholdId, activePeriodMonth, iplPayments]);

  const existingPaidForModal = currentModalExistingPayment ? currentModalExistingPayment.paidAmount : 0;
  const remainingForModal = Math.max(0, DEFAULT_MONTHLY_IPL_FEE - existingPaidForModal);

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Period filter
      if (periodFilter.type === 'current_month') {
        const curMonth = getCurrentSystemMonth();
        if (!t.date.startsWith(curMonth)) return false;
      } else if (periodFilter.type === 'custom_month' && periodFilter.month) {
        if (!t.date.startsWith(periodFilter.month)) return false;
      }
      // 'all' includes all dates

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Status filter (active vs void)
      const txStatus = t.status || 'active';
      if (statusFilter !== 'all' && txStatus !== statusFilter) return false;

      // Search query filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.payerOrRecipient && t.payerOrRecipient.toLowerCase().includes(query)) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(query)) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(query))
      );
    });
  }, [transactions, periodFilter, typeFilter, statusFilter, searchQuery]);

  // Filtered IPL rows for display (1 Household = 1 Baris per Periode)
  const filteredIPLRows = useMemo(() => {
    const periodPayments = iplPayments.filter((p) => p.period === activePeriodMonth);
    const paymentMap = new Map<string, IPLPayment>();
    periodPayments.forEach((p) => {
      paymentMap.set(p.householdId, p);
    });

    return households
    .filter((hh) => paymentMap.has(hh.id))
    .map((hh) => {  
      const payment = paymentMap.get(hh.id);
      const paid = payment ? payment.paidAmount : 0;
      const amount = payment ? payment.amount : DEFAULT_MONTHLY_IPL_FEE;
      const status = payment ? payment.status : 'belum';

      return {
        household: hh,
        payment,
        amount,
        paidAmount: paid,
        status,
        remainingAmount: Math.max(0, amount - paid),
      };
    }).filter((row) => {
      if (iplStatusFilter !== 'all' && row.status !== iplStatusFilter) return false;
      if (!iplSearchQuery) return true;
      const q = iplSearchQuery.toLowerCase();
      return (
        row.household.houseNumber.toLowerCase().includes(q) ||
        row.household.residentName.toLowerCase().includes(q) ||
        (row.payment?.receiptNumber && row.payment.receiptNumber.toLowerCase().includes(q))
      );
    });
  }, [households, iplPayments, activePeriodMonth, iplStatusFilter, iplSearchQuery]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('7292868671');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Period Selector change handler
  const handlePeriodChange = (val: string) => {
    if (val === 'all') {
      setPeriodFilter({ type: 'all' });
    } else if (val === 'current_month') {
      setPeriodFilter({ type: 'current_month' });
    } else {
      setPeriodFilter({ type: 'custom_month', month: val });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!newDesc.trim() || newAmount <= 0) {
      setActionError('Keterangan transaksi dan nominal valid wajib diisi.');
      return;
    }

    try {
      const receiptPrefix = newType === 'in' ? 'KAS-IN' : 'KAS-OUT';
      const cleanDate = newDate.replace(/-/g, '').slice(0, 6);
      const randomSeq = Math.floor(100 + Math.random() * 900);

      const targetHh = households.find((h) => h.id === newHouseholdId);

      await DataService.addTransaction({
        date: newDate,
        type: newType,
        category: newCategory,
        description: newDesc.trim(),
        amount: Number(newAmount),
        payerOrRecipient:
          newPayer.trim() ||
          (targetHh
            ? `${targetHh.residentName} (${targetHh.houseNumber})`
            : newType === 'in'
            ? 'Warga Blok H'
            : 'Operasional Lingkungan'),
        receiptNumber: `${receiptPrefix}/${cleanDate}/${randomSeq}`,
        paymentMethod: newMethod,
        referenceNo: newRefNo.trim() || undefined,
        notes: newNotes.trim() || undefined,
        householdId: targetHh ? targetHh.id : undefined,
        houseNumber: targetHh ? targetHh.houseNumber : undefined,
        createdBy: 'bendahara_demo',
      });

      setIsAddModalOpen(false);
      setNewDesc('');
      setNewAmount(150000);
      setNewPayer('');
      setNewRefNo('');
      setNewNotes('');
      setNewHouseholdId('');
      setActionSuccess('Transaksi kas berhasil dicatat ke Buku Kas.');
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan transaksi kas.');
    }
  };

  const handleOpenIplModal = (householdId?: string) => {
    setActionError(null);
    setActionSuccess(null);
    const targetId = householdId || households[0]?.id || '';
    setIplTargetHouseholdId(targetId);

    // Hitung sisa tagihan untuk prefill modal
    const existing = iplPayments.find((p) => p.householdId === targetId && p.period === activePeriodMonth);
    const existingPaid = existing ? existing.paidAmount : 0;
    const remaining = Math.max(0, DEFAULT_MONTHLY_IPL_FEE - existingPaid);

    setIplStagePayment(remaining > 0 ? remaining : DEFAULT_MONTHLY_IPL_FEE);
    setIplMethod('transfer_bank');
    setIplRefNo('');
    setIplNotes('');
    setIsIplModalOpen(true);
  };

  const handleIplSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!iplTargetHouseholdId) {
      setActionError('Pilih unit rumah warga terlebih dahulu.');
      return;
    }

    const stageAmt = Math.round(Number(iplStagePayment));
    if (isNaN(stageAmt) || stageAmt <= 0) {
      setActionError('Nominal pembayaran tahap ini harus lebih besar dari 0 Rupiah.');
      return;
    }

    // REQUIREMENT 6: Validasi nominal tidak boleh melebihi tagihan
    const newTotal = existingPaidForModal + stageAmt;
    if (newTotal > DEFAULT_MONTHLY_IPL_FEE) {
      setActionError('Nominal pembayaran IPL tidak boleh melebihi tagihan.');
      return;
    }

    try {
      const res = await DataService.addIPLPayment({
        householdId: iplTargetHouseholdId,
        period: activePeriodMonth,
        amount: DEFAULT_MONTHLY_IPL_FEE,
        paidAmount: newTotal,
        paymentAmount: stageAmt,
        paymentMethod: iplMethod,
        referenceNo: iplRefNo.trim() || undefined,
        notes: iplNotes.trim() || undefined,
        recordedBy: 'bendahara_demo',
      });

      setIsIplModalOpen(false);
      const msg = res.transaction
        ? `Pembayaran IPL tahap ini sebesar ${formatCurrency(res.transaction.amount)} untuk unit ${res.payment.houseNumber} berhasil dicatat & otomatis masuk ke Buku Kas (No: ${res.transaction.receiptNumber}).`
        : `Status IPL unit ${res.payment.houseNumber} berhasil diperbarui.`;
      setActionSuccess(msg);
    } catch (err: any) {
      setActionError(err.message || 'Gagal mencatat pembayaran IPL.');
    }
  };

  const handleOpenVoidModal = (tx: FinanceTransaction) => {
    setTargetVoidTx(tx);
    setVoidReasonInput('');
    setIsVoidModalOpen(true);
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVoidTx) return;

    try {
      await DataService.voidTransaction(
        targetVoidTx.id,
        voidReasonInput.trim() || 'Dibatalkan oleh pengurus (audit log tersimpan)',
        'bendahara_demo'
      );
      setIsVoidModalOpen(false);
      setTargetVoidTx(null);
      setVoidReasonInput('');
      setActionSuccess('Transaksi kas berhasil dibatalkan (void audit tersimpan & status IPL disinkronisasi).');
    } catch (err: any) {
      setActionError(err.message || 'Gagal membatalkan transaksi.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Current selected dropdown value
  const currentSelectValue =
    periodFilter.type === 'all'
      ? 'all'
      : periodFilter.type === 'current_month'
      ? 'current_month'
      : periodFilter.month || 'current_month';

  return (
    <div className="space-y-6">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Wallet className="w-4 h-4 text-emerald-700" />
          <span>Transparansi Kas & Anggaran Warga</span>
        </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Laporan Keuangan & Iuran Blok H
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buku kas transparan dan rekapitulasi iuran pengelolaan lingkungan (IPL) warga Blok H.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Period Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={currentSelectValue}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="current_month">Bulan Berjalan ({getCurrentSystemMonth()})</option>
              <option value="all">Seluruh Transaksi (Semua Waktu)</option>
              <optgroup label="Pilih Bulan Khusus">
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Periode {m}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Laporan</span>
          </button>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenIplModal()}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Catat Iuran IPL</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Kas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts for Actions */}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Period Indicator Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Periode Laporan Aktif: <strong className="text-slate-900">{metrics.periodLabel}</strong>
          </span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[11px] text-slate-500">Per: {metrics.asOfDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">
            Arus Kas: Saldo Awal + Total Masuk - Total Keluar
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Kas Terkini */}
        <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-xs space-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-800/30 rounded-full blur-xl" />
          <span className="text-[11px] font-medium text-emerald-300 block">Saldo Kas Terkini</span>
          <p className="text-2xl font-black text-white tabular-nums tracking-tight">
            {formatCurrency(metrics.currentBalance)}
          </p>
          <div className="text-[11px] text-emerald-300/80 pt-1 flex items-center justify-between">
            <span>Saldo Awal Pembukuan:</span>
            <span className="font-semibold text-white">{formatCurrency(metrics.openingBalance)}</span>
          </div>
        </div>

        {/* Card 2: Pemasukan Periode Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              Pemasukan Periode Ini
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-800 tabular-nums">
            {formatCurrency(metrics.currentMonthIn)}
          </p>
          <p className="text-[11px] text-slate-500">
            Total Kumulatif: {formatCurrency(metrics.totalIn)}
          </p>
        </div>

        {/* Card 3: Pengeluaran Periode Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              Pengeluaran Periode Ini
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-700 tabular-nums">
            {formatCurrency(metrics.currentMonthOut)}
          </p>
          <p className="text-[11px] text-slate-500">
            Total Kumulatif: {formatCurrency(metrics.totalOut)}
          </p>
        </div>

        {/* Card 4: Kepatuhan IPL Dinamis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 block">Kepatuhan Iuran (IPL)</span>
            <span className="text-xs font-bold text-emerald-700">{metrics.complianceRate}%</span>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {metrics.paidHouseholds} / {metrics.activeHouseholds} <span className="text-xs font-normal text-slate-500">Unit Lunas</span>
          </p>
          <div className="text-[11px] text-slate-500 flex justify-between pt-0.5">
            <span>Terkumpul: <strong className="text-emerald-700 font-semibold">{formatCurrency(metrics.monthlyIPLCollected)}</strong></span>
            <span>Tunggakan: <strong className="text-amber-700 font-semibold">{formatCurrency(metrics.monthlyIPLOutstanding)}</strong></span>
          </div>
        </div>
      </div>

      {/* Info Rekening Pembayaran Iuran Warga */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-2xl border border-emerald-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <Building className="w-4 h-4 text-emerald-700" />
            <span>Rekening Kas Paguyuban Blok H</span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            [Bank BSI Syariah] · No. Rekening: 7292868671 [A/N Muhamad Chaqun Nazili]
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Atas Nama: <strong className="text-slate-800">[Kas Paguyuban Blok H - Rekening Contoh]</strong>.
            Besaran tarif iuran Rp50.000/bulan per unit + Rp.10.0000/bulan untuk Kongsi Kematian, total Rp.60.000. Pembayaran terdata akan otomatis masuk dalam buku kas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyAccount}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            {copiedBank ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            <span>{copiedBank ? 'Tersalin!' : 'Salin No. Rekening'}</span>
          </button>
          <div className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
            <span>Kontak Bendahara: 082123251043 Muhamad Chaqun Nazili</span>
          </div>
        </div>
      </div>

      {/* View Switcher: Buku Kas vs Rekapitulasi IPL */}
      <div className="flex items-center border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSubTab('buku_kas')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'buku_kas'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Buku Kas & Transaksi Kas ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rekap_ipl')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === 'rekap_ipl'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekapitulasi Iuran (IPL) Warga ({households.length} Unit)</span>
        </button>
      </div>

      {/* TAB 1: BUKU KAS & TRANSAKSI */}
      {activeSubTab === 'buku_kas' && (
        <div className="space-y-4">
          {/* Filter and Search Bar for Transactions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* In / Out / All segmented control */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Arus ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setTypeFilter('in')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === 'in' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  onClick={() => setTypeFilter('out')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    typeFilter === 'out' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran
                </button>
              </div>

              {/* Status filter: Aktif vs Dibatalkan (Void) for Admin Audit */}
              {isAdmin && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setStatusFilter('void')}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      statusFilter === 'void' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dibatalkan (Void)
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi / kuitansi / referensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>
          </div>

          {/* Transactions Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tanggal & No. Bukti</th>
                    <th className="py-3 px-4">Keterangan Transaksi</th>
                    <th className="py-3 px-4">Kategori & Metode</th>
                    <th className="py-3 px-4">Pihak Terkait</th>
                    <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Audit / Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">
                        Tidak ada transaksi untuk filter periode yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isVoid = tx.status === 'void';
                      return (
                        <tr
                          key={tx.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isVoid ? 'bg-amber-50/40 text-slate-400 line-through' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isVoid && (
                                <span className="no-underline text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                  VOID
                                </span>
                              )}
                              <span className={`font-semibold ${isVoid ? 'text-slate-500' : 'text-slate-900'} block`}>
                                {tx.date}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono no-underline block">
                              {tx.receiptNumber || '-'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className={`font-medium leading-snug ${isVoid ? 'text-slate-400' : 'text-slate-800'}`}>
                              {tx.description}
                            </p>
                            {isVoid && tx.voidReason && (
                              <p className="no-underline text-[10px] text-amber-800 font-normal mt-0.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Alasan batal: {tx.voidReason}</span>
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap no-underline">
                            <span className="text-[11px] font-medium text-emerald-900 uppercase block">
                              {tx.category.replace(/-/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize block">
                              {tx.paymentMethod ? tx.paymentMethod.replace(/_/g, ' ') : 'Transfer'}
                              {tx.referenceNo ? ` · Ref: ${tx.referenceNo}` : ''}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                            {tx.payerOrRecipient || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                            <span
                              className={
                                isVoid
                                  ? 'text-slate-400 line-through'
                                  : tx.type === 'in'
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }
                            >
                              {tx.type === 'in' ? '+ ' : '- '}
                              {formatCurrency(tx.amount)}
                            </span>
                          </td>

                          {isAdmin && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap no-underline">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetailTx(tx)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Lihat Log Audit & Detail Transaksi"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>

                                {!isVoid ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenVoidModal(tx)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Batalkan (Void) Transaksi"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 rounded">
                                    Voided
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPITULASI IURAN (IPL) WARGA */}
      {activeSubTab === 'rekap_ipl' && (
        <div className="space-y-4">
          {/* IPL Sub-header & Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setIplStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    iplStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Unit ({filteredIPLRows.length})
                </button>
                <button
                  onClick={() => setIplStatusFilter('lunas')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    iplStatusFilter === 'lunas' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lunas
                </button>
                <button
                  onClick={() => setIplStatusFilter('sebagian')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    iplStatusFilter === 'sebagian' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sebagian (Cicilan)
                </button>
                <button
                  onClick={() => setIplStatusFilter('belum')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    iplStatusFilter === 'belum' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum Lunas
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no. rumah / nama warga..."
                value={iplSearchQuery}
                onChange={(e) => setIplSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              />
            </div>
          </div>

          {/* IPL Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No. Rumah & Warga</th>
                    <th className="py-3 px-4">Status Huni</th>
                    <th className="py-3 px-4">Tarif IPL</th>
                    <th className="py-3 px-4">Terbayar</th>
                    <th className="py-3 px-4">Status Pembayaran</th>
                    <th className="py-3 px-4">Riwayat & Mutasi Kas</th>
                    {isAdmin && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIPLRows.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-400">
                        Tidak ada data iuran yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredIPLRows.map((row) => {
                      const isLunas = row.status === 'lunas';
                      const isSebagian = row.status === 'sebagian';
                      const txCount = row.payment?.transactionIds?.length || (row.payment?.transactionId ? 1 : 0);

                      return (
                        <tr key={row.household.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{row.household.houseNumber}</span>
                            <span className="text-slate-600 text-[11px] block">{row.household.residentName}</span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                              row.household.occupancyStatus === 'huni'
                                ? 'bg-emerald-50 text-emerald-800'
                                : row.household.occupancyStatus === 'semi-huni'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {row.household.occupancyStatus}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums">
                            {formatCurrency(row.amount)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold tabular-nums">
                            <span className={isLunas ? 'text-emerald-700' : isSebagian ? 'text-amber-700' : 'text-slate-400'}>
                              {formatCurrency(row.paidAmount)}
                            </span>
                            {row.remainingAmount > 0 && (
                              <span className="block text-[10px] text-slate-400 font-normal">
                                Sisa: {formatCurrency(row.remainingAmount)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isLunas
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : isSebagian
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}>
                                {isLunas ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Lunas</span>
                                  </>
                                ) : isSebagian ? (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Sebagian</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                                    <span>Belum Lunas</span>
                                  </>
                                )}
                              </span>
                              {txCount > 1 && (
                                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {txCount}x Tahap Cicilan
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            {row.payment?.paidAt ? (
                              <div>
                                <span className="block font-medium text-slate-800">
                                  {formatAuditDate(row.payment.paidAt)}
                                </span>
                                {row.payment.transactionId && (
                                  <span className="text-[10px] text-emerald-800 font-mono block">
                                    Ref Kas: {row.payment.transactionId}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Belum ada pembayaran</span>
                            )}
                          </td>

                          {isAdmin && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenIplModal(row.household.id)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border ${
                                  isLunas
                                    ? 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
                                    : 'text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                                }`}
                              >
                                {isLunas ? 'Update Data' : isSebagian ? 'Bayar Cicilan' : 'Catat Bayar'}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Transaksi Kas Baru (Admin Only) */}
      {isAdmin && isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Pencatatan Transaksi Buku Kas Baru</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Arus Kas</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const t = e.target.value as FinancialTransactionType;
                      setNewType(t);
                      if (t === 'in') {
                        setNewCategory('iuran-bulanan');
                      } else {
                        setNewCategory('operasional');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="in">Pemasukan (Kas Masuk)</option>
                    <option value="out">Pengeluaran (Kas Keluar)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pos Anggaran / Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FinancialTransactionCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    {newType === 'in' ? (
                      <>
                        <option value="iuran-bulanan">Iuran Pengelolaan Lingkungan (IPL)</option>
                        <option value="donasi">Donasi & Sumbangan Warga</option>
                        <option value="kas-sosial">Kas Sosial Lingkungan</option>
                        <option value="operasional">Pemasukan Lainnya</option>
                      </>
                    ) : (
                      <>
                        <option value="keamanan-satpam">Honor & Operasional Satpam</option>
                        <option value="kebersihan-sampah">Retribusi Truk Sampah</option>
                        <option value="penerangan-cctv">Penerangan Jalan & CCTV</option>
                        <option value="perawatan-fasum">Perawatan Fasum & Taman</option>
                        <option value="kas-sosial">Santunan Sosial Warga</option>
                        <option value="operasional">Operasional Paguyuban</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rupiah)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
              </div>

              {/* Optional Household linkage if iuran */}
              {newType === 'in' && newCategory === 'iuran-bulanan' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Relasi Unit Rumah Warga (Opsional)
                  </label>
                  <select
                    value={newHouseholdId}
                    onChange={(e) => {
                      setNewHouseholdId(e.target.value);
                      const h = households.find((item) => item.id === e.target.value);
                      if (h) {
                        setNewPayer(`${h.residentName} (${h.houseNumber})`);
                        setNewDesc(`IPL Periode ${newDate.slice(0, 7)} - ${h.houseNumber} (${h.residentName})`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="">-- Pilih Unit Rumah Terkait --</option>
                    {households.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.houseNumber} - {h.residentName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Keterangan Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran honor satpam pos utama..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {newType === 'in' ? 'Pihak Pembayar' : 'Pihak Penerima'}
                  </label>
                  <input
                    type="text"
                    placeholder={newType === 'in' ? 'Nama warga / donatur' : 'Penyedia jasa / petugas'}
                    value={newPayer}
                    onChange={(e) => setNewPayer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    <option value="transfer_bank">Transfer Bank</option>
                    <option value="qris">QRIS Paguyuban</option>
                    <option value="tunai">Tunai</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Referensi / Mutasi (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: REF-BANK-12345"
                    value={newRefNo}
                    onChange={(e) => setNewRefNo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Audit (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Catatan verifikasi bendahara..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran Iuran IPL (Mendukung Pembayaran Bertahap & Cegah Duplikasi) */}
      {isAdmin && isIplModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Pencatatan Pembayaran Iuran IPL Warga</span>
              </div>
              <button
                type="button"
                onClick={() => setIsIplModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIplSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unit Rumah Warga</label>
                <select
                  value={iplTargetHouseholdId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setIplTargetHouseholdId(newId);
                    const ex = iplPayments.find((p) => p.householdId === newId && p.period === activePeriodMonth);
                    const paid = ex ? ex.paidAmount : 0;
                    const rem = Math.max(0, DEFAULT_MONTHLY_IPL_FEE - paid);
                    setIplStagePayment(rem > 0 ? rem : DEFAULT_MONTHLY_IPL_FEE);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.houseNumber} - {h.residentName} ({h.occupancyStatus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Periode Pembayaran</label>
                <input
                  type="text"
                  disabled
                  value={`Periode Aktif: ${activePeriodMonth}`}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-700 font-mono"
                />
              </div>

              {/* Status Pembayaran Bertahap */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif Tagihan Standar:</span>
                  <span className="font-mono font-semibold">{formatCurrency(DEFAULT_MONTHLY_IPL_FEE)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sudah Terbayar:</span>
                  <span className="font-mono font-semibold text-emerald-800">{formatCurrency(existingPaidForModal)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600 font-semibold">Sisa Tagihan:</span>
                  <span className="font-mono font-bold text-amber-800">{formatCurrency(remainingForModal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran Tahap Ini (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={remainingForModal > 0 ? remainingForModal : DEFAULT_MONTHLY_IPL_FEE}
                  required
                  value={iplStagePayment}
                  onChange={(e) => setIplStagePayment(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung cicilan/pembayaran bertahap. Maksimal: {formatCurrency(remainingForModal > 0 ? remainingForModal : DEFAULT_MONTHLY_IPL_FEE)}.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={iplMethod}
                  onChange={(e) => setIplMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  <option value="transfer_bank">Transfer Bank</option>
                  <option value="qris">QRIS Paguyuban</option>
                  <option value="tunai">Tunai / Langsung ke Bendahara</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Referensi Bank / Slip (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-IPL-0901"
                  value={iplRefNo}
                  onChange={(e) => setIplRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan khusus bendahara..."
                  value={iplNotes}
                  onChange={(e) => setIplNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                />
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 leading-relaxed">
                Pencatatan tahap ini hanya akan menambah kas masuk sebesar nominal tahap ini ke Buku Kas, tanpa menggandakan record IPL.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIplModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Pembayaran IPL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Void / Pembatalan Transaksi Kas (Admin Only) */}
      {isAdmin && isVoidModalOpen && targetVoidTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Pembatalan Transaksi Kas (Soft Delete / Void)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoidModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-xs text-rose-900 space-y-1">
              <p className="font-semibold">Perhatian Integritas Keuangan:</p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Transaksi ini tidak akan dihapus permanen agar jejak audit keuangan tetap terjaga. Status akan diubah menjadi <strong className="text-rose-700">VOID</strong> dan nominalnya akan dikeluarkan dari perhitungan saldo kas. Jika ini adalah pembayaran IPL, saldo terbayar IPL akan otomatis dihitung ulang.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-medium text-slate-800">{targetVoidTx.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Kuitansi:</span>
                <span className="font-mono text-slate-800">{targetVoidTx.receiptNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uraian:</span>
                <span className="font-medium text-slate-800 text-right max-w-xs">{targetVoidTx.description}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(targetVoidTx.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan / Void (Wajib untuk Audit Log)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Salah input nominal / pembatalan mutasi iuran..."
                  value={voidReasonInput}
                  onChange={(e) => setVoidReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
                >
                  Konfirmasi Batalkan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail Transaksi & Log Audit */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Rincian & Jejak Audit Transaksi Kas</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Nominal Transaksi</span>
                  <span className={`text-lg font-black font-mono tabular-nums ${
                    detailTx.type === 'in' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {detailTx.type === 'in' ? '+ ' : '- '}
                    {formatCurrency(detailTx.amount)}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  detailTx.status === 'void'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}>
                  Status: {detailTx.status || 'active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Tanggal Transaksi</span>
                  <span className="font-semibold text-slate-800">{detailTx.date}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">No. Kuitansi</span>
                  <span className="font-mono font-semibold text-slate-800">{detailTx.receiptNumber || '-'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Kategori</span>
                  <span className="font-semibold text-slate-800 uppercase">{detailTx.category.replace(/-/g, ' ')}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Metode Pembayaran</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {detailTx.paymentMethod ? detailTx.paymentMethod.replace(/_/g, ' ') : 'Transfer'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-slate-700">
                <span className="text-[10px] text-slate-400 block">Keterangan / Uraian</span>
                <p className="font-medium text-slate-900 leading-relaxed">{detailTx.description}</p>
                {detailTx.payerOrRecipient && (
                  <p className="text-[11px] text-slate-500">
                    Pihak Terkait: <strong className="text-slate-700">{detailTx.payerOrRecipient}</strong>
                  </p>
                )}
                {detailTx.referenceNo && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    No. Ref Mutasi: {detailTx.referenceNo}
                  </p>
                )}
              </div>

              {/* Audit trail info */}
              <div className="p-2.5 bg-slate-100 rounded-lg space-y-1 text-[11px] text-slate-600">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Audit Trail (Rekam Sistem)</span>
                <div className="flex justify-between">
                  <span>Dibuat:</span>
                  <span className="font-mono">{formatAuditDate(detailTx.createdAt)} ({detailTx.createdBy || 'demo'})</span>
                </div>
                {detailTx.updatedAt && (
                  <div className="flex justify-between">
                    <span>Diperbarui:</span>
                    <span className="font-mono">{formatAuditDate(detailTx.updatedAt)}</span>
                  </div>
                )}
                {detailTx.status === 'void' && (
                  <div className="pt-1.5 border-t border-slate-200 text-amber-800 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Dibatalkan Oleh:</span>
                      <span className="font-mono">{detailTx.voidedBy || 'admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Pembatalan:</span>
                      <span className="font-mono">{formatAuditDate(detailTx.voidedAt)}</span>
                    </div>
                    {detailTx.voidReason && (
                      <p className="pt-0.5 text-rose-700">
                        Alasan: <em>{detailTx.voidReason}</em>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
