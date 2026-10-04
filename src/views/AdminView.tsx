import React, { useState, useEffect } from 'react';
import {
  TabKey,
  CitizenReport,
  Household,
  OccupancyStatus,
  OrganizationMember,
  CommunityGroup,
  CommunityGroupCategory,
  CommunityAchievement,
} from '../types/portal';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import {
  Lock,
  UserCheck,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Bell,
  Calendar,
  Wallet,
  CheckCircle2,
  MessageSquare,
  Cloud,
  Terminal,
  Database,
  AlertTriangle,
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
  Trash2,
  UserPlus,
} from 'lucide-react';

interface AdminViewProps {
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onSelectTab: (tab: TabKey) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isAdmin,
  onLoginSuccess,
  onLogout,
  onSelectTab,
}) => {
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin sub-tabs: Laporan Warga vs Cloudflare D1 Console vs Pengaturan Data
  const [adminTab, setAdminTab] = useState<
  'laporan' | 'warga' | 'pengurus' | 'komunitas' | 'cloudflare' | 'data'
>('laporan');
  const [reports, setReports] = useState<CitizenReport[]>(() => DataService.getReports());
  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdSearch, setHouseholdSearch] = useState('');
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [isSavingHousehold, setIsSavingHousehold] = useState(false);
  const [householdError, setHouseholdError] = useState('');
  const [organizationMembers, setOrganizationMembers] = useState<
  OrganizationMember[]
>([]);
const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>(
  []
);

const [communityAchievements, setCommunityAchievements] = useState<
  CommunityAchievement[]
>([]);

const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);

const [communityError, setCommunityError] = useState<string | null>(null);
const [isCommunityAchievementModalOpen, setIsCommunityAchievementModalOpen] =
  useState(false);
const [editingCommunityAchievement, setEditingCommunityAchievement] =
  useState<CommunityAchievement | null>(null);
const [isSavingCommunityAchievement, setIsSavingCommunityAchievement] =
  useState(false);

const [communityAchievementTitle, setCommunityAchievementTitle] =
  useState('');
const [communityAchievementRecipient, setCommunityAchievementRecipient] =
  useState('');
const [communityAchievementDescription, setCommunityAchievementDescription] =
  useState('');
const [communityAchievementDate, setCommunityAchievementDate] =
  useState('');
const [communityAchievementPhotoUrl, setCommunityAchievementPhotoUrl] =
  useState('');
const [communityAchievementPhotoFile, setCommunityAchievementPhotoFile] =
  useState<File | null>(null);
const [communityAchievementPhotoPreview, setCommunityAchievementPhotoPreview] =
  useState('');
const [isCommunityGroupModalOpen, setIsCommunityGroupModalOpen] =
  useState(false);
const [editingCommunityGroup, setEditingCommunityGroup] =
  useState<CommunityGroup | null>(null);
const [isSavingCommunityGroup, setIsSavingCommunityGroup] =
  useState(false);

const [communityGroupName, setCommunityGroupName] = useState('');
const [communityGroupCategory, setCommunityGroupCategory] =
  useState<CommunityGroupCategory>('atlet');
const [communityGroupDescription, setCommunityGroupDescription] =
  useState('');
const [communityGroupActivityInfo, setCommunityGroupActivityInfo] =
  useState('');
const [communityGroupSchedule, setCommunityGroupSchedule] =
  useState('');
const [communityGroupWhatsappUrl, setCommunityGroupWhatsappUrl] =
  useState('');
const [communityGroupPhotoUrl, setCommunityGroupPhotoUrl] =
  useState('');
const [communityGroupPhotoFile, setCommunityGroupPhotoFile] =
  useState<File | null>(null);
const [communityGroupPhotoPreview, setCommunityGroupPhotoPreview] =
  useState('');
const [isLoadingOrganizationMembers, setIsLoadingOrganizationMembers] =
  useState(false);
const [organizationMemberError, setOrganizationMemberError] =
  useState('');

  const [houseNumber, setHouseNumber] = useState('');
  const [residentName, setResidentName] = useState('');
  const [occupancyStatus, setOccupancyStatus] =
    useState<OccupancyStatus>('huni');
  const [phone, setPhone] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [householdNotes, setHouseholdNotes] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedWorker, setCopiedWorker] = useState(false);
  const [isOrganizationMemberModalOpen, setIsOrganizationMemberModalOpen] =
  useState(false);
  const [editingOrganizationMember, setEditingOrganizationMember] =
  useState<OrganizationMember | null>(null);
  const [isSavingOrganizationMember, setIsSavingOrganizationMember] =
  useState(false);
  const [organizationMemberName, setOrganizationMemberName] = useState('');
const [organizationMemberPosition, setOrganizationMemberPosition] =
  useState('');
const [organizationMemberDivision, setOrganizationMemberDivision] =
  useState('');
const [organizationMemberPhone, setOrganizationMemberPhone] =
  useState('');
const [organizationMemberPhotoUrl, setOrganizationMemberPhotoUrl] =
  useState('');
  const [organizationMemberPhotoFile, setOrganizationMemberPhotoFile] =
  useState<File | null>(null);
const [organizationMemberPhotoPreview, setOrganizationMemberPhotoPreview] =
  useState('');
const [organizationMemberBio, setOrganizationMemberBio] = useState('');
const [organizationMemberResponsibilities, setOrganizationMemberResponsibilities] =
  useState('');
const [organizationMemberDisplayOrder, setOrganizationMemberDisplayOrder] =
  useState('0');
const [organizationMemberPeriodStart, setOrganizationMemberPeriodStart] =
  useState('2026-01-01');
const [organizationMemberPeriodEnd, setOrganizationMemberPeriodEnd] =
  useState('2029-12-31');
const [organizationMemberIsActive, setOrganizationMemberIsActive] =
  useState(true);

  // Reactive subscription to DataService
  useEffect(() => {
  let cancelled = false;

  const loadReports = async () => {
    try {
      const data = await DataService.fetchReports();

      if (!cancelled) {
        setReports(data);
      }
    } catch (err) {
      console.error('[AdminView] Gagal memuat laporan warga:', err);
    }
  };

  const loadHouseholds = async () => {
    try {
      const data = await DataService.fetchHouseholds();

      if (!cancelled) {
        setHouseholds(data);
      }
    } catch (err) {
      console.error('[AdminView] Gagal memuat data warga:', err);
    }
  };

  const loadOrganizationMembers = async () => {
    try {
      setIsLoadingOrganizationMembers(true);
      setOrganizationMemberError('');

      const data = await DataService.fetchOrganizationMembers();

      if (!cancelled) {
        setOrganizationMembers(data);
      }
    } catch (err) {
      console.error(
        '[AdminView] Gagal memuat data pengurus:',
        err
      );

      if (!cancelled) {
        setOrganizationMemberError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data pengurus.'
        );
      }
    } finally {
      if (!cancelled) {
        setIsLoadingOrganizationMembers(false);
      }
    }
  };

  void loadReports();
  void loadHouseholds();
  void loadOrganizationMembers();

  const unsubscribe = DataService.subscribe(() => {
    void loadReports();
    void loadHouseholds();
    void loadOrganizationMembers();
  });
  
const handleSaveOrganizationMember = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!organizationMemberName.trim()) {
    setOrganizationMemberError('Nama pengurus wajib diisi.');
    return;
  }

  if (!organizationMemberPosition.trim()) {
    setOrganizationMemberError('Jabatan wajib diisi.');
    return;
  }

  try {
    setIsSavingOrganizationMember(true);
    setOrganizationMemberError('');

    const payload = {
      name: organizationMemberName.trim(),
      position: organizationMemberPosition.trim(),
      division: organizationMemberDivision.trim() || null,
      phone: organizationMemberPhone.trim() || null,
      photoUrl: organizationMemberPhotoUrl.trim() || null,
      bio: organizationMemberBio.trim() || null,
      responsibilities:
        organizationMemberResponsibilities.trim() || null,
      parentId: editingOrganizationMember?.parentId ?? null,
      displayOrder:
        Number(organizationMemberDisplayOrder) || 0,
      isActive: organizationMemberIsActive,
      periodStart: organizationMemberPeriodStart,
      periodEnd: organizationMemberPeriodEnd,
    };

    if (editingOrganizationMember) {
      await DataService.updateOrganizationMember(
        editingOrganizationMember.id,
        payload
      );
    } else {
      await DataService.addOrganizationMember(payload);
    }

    await loadOrganizationMembers();

    setIsOrganizationMemberModalOpen(false);
    setEditingOrganizationMember(null);
  } catch (err) {
    console.error(
      '[AdminView] Gagal menyimpan data pengurus:',
      err
    );

    setOrganizationMemberError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data pengurus.'
    );
  } finally {
    setIsSavingOrganizationMember(false);
  }
};
  return () => {
    cancelled = true;
    unsubscribe();
  };
}, []);
const loadCommunityData = async () => {
  try {
    setIsLoadingCommunity(true);
    setCommunityError(null);

    const [groups, achievements] = await Promise.all([
      DataService.fetchCommunityGroups(),
      DataService.fetchCommunityAchievements(),
    ]);

    setCommunityGroups(groups);
    setCommunityAchievements(achievements);
  } catch (err) {
    console.error(
      '[AdminView] Gagal memuat data komunitas:',
      err
    );

    setCommunityError(
      err instanceof Error
        ? err.message
        : 'Gagal memuat data komunitas.'
    );
  } finally {
    setIsLoadingCommunity(false);
  }
};

useEffect(() => {
  loadCommunityData();
}, []);
const openCommunityGroupModal = (
  group: CommunityGroup | null = null
) => {
  setEditingCommunityGroup(group);
  setCommunityGroupName(group?.name ?? '');
  setCommunityGroupCategory(group?.category ?? 'atlet');
  setCommunityGroupDescription(group?.description ?? '');
  setCommunityGroupActivityInfo(group?.activityInfo ?? '');
  setCommunityGroupSchedule(group?.schedule ?? '');
  setCommunityGroupWhatsappUrl(group?.whatsappGroupUrl ?? '');
  setCommunityGroupPhotoUrl(group?.photoUrl ?? '');
  setCommunityGroupPhotoFile(null);
  setCommunityGroupPhotoPreview(group?.photoUrl ?? '');
  setIsCommunityGroupModalOpen(true);
};
  const openOrganizationMemberModal = (
    
  
  member: OrganizationMember | null = null
) => {
  setEditingOrganizationMember(member);
  setOrganizationMemberName(member?.name ?? '');
  setOrganizationMemberPosition(member?.position ?? '');
  setOrganizationMemberDivision(member?.division ?? '');
  setOrganizationMemberPhone(member?.phone ?? '');
  setOrganizationMemberPhotoUrl(member?.photoUrl ?? '');
  setOrganizationMemberPhotoFile(null);
  setOrganizationMemberPhotoPreview(member?.photoUrl ?? '');
  setOrganizationMemberBio(member?.bio ?? '');
  setOrganizationMemberResponsibilities(
    member?.responsibilities ?? ''
  );
  setOrganizationMemberDisplayOrder(
    String(member?.displayOrder ?? 0)
  );
  setOrganizationMemberPeriodStart(
    member?.periodStart ?? '2026-01-01'
  );
  setOrganizationMemberPeriodEnd(
    member?.periodEnd ?? '2029-12-31'
  );
  setOrganizationMemberIsActive(member?.isActive ?? true);

  setOrganizationMemberError('');
  setIsOrganizationMemberModalOpen(true);
};
  const handleSaveOrganizationMember = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!organizationMemberName.trim()) {
    setOrganizationMemberError('Nama pengurus wajib diisi.');
    return;
  }

  if (!organizationMemberPosition.trim()) {
    setOrganizationMemberError('Jabatan wajib diisi.');
    return;
  }

  try {
    setIsSavingOrganizationMember(true);
    setOrganizationMemberError('');

    const basePayload = {
      name: organizationMemberName.trim(),
      position: organizationMemberPosition.trim(),
      division: organizationMemberDivision.trim() || null,
      phone: organizationMemberPhone.trim() || null,
      photoUrl: editingOrganizationMember?.photoUrl ?? null,
      bio: organizationMemberBio.trim() || null,
      responsibilities:
        organizationMemberResponsibilities.trim() || null,
      parentId: editingOrganizationMember?.parentId ?? null,
      displayOrder:
        Number(organizationMemberDisplayOrder) || 0,
      isActive: organizationMemberIsActive,
      periodStart: organizationMemberPeriodStart,
      periodEnd: organizationMemberPeriodEnd,
    };

    if (editingOrganizationMember) {
      let photoUrl = editingOrganizationMember.photoUrl ?? null;

      if (organizationMemberPhotoFile) {
        photoUrl = await DataService.uploadOrganizationMemberPhoto(
          editingOrganizationMember.id,
          organizationMemberPhotoFile
        );
      }

      await DataService.updateOrganizationMember(
        editingOrganizationMember.id,
        {
          ...basePayload,
          photoUrl,
        }
      );
    } else {
      const createdMember =
        await DataService.addOrganizationMember(basePayload);

      if (organizationMemberPhotoFile) {
        const photoUrl =
          await DataService.uploadOrganizationMemberPhoto(
            createdMember.id,
            organizationMemberPhotoFile
          );

        await DataService.updateOrganizationMember(
          createdMember.id,
          {
            photoUrl,
          }
        );
      }
    }

    setOrganizationMemberPhotoFile(null);
    setOrganizationMemberPhotoPreview('');

    setIsOrganizationMemberModalOpen(false);
    setEditingOrganizationMember(null);

    const data = await DataService.fetchOrganizationMembers();
    setOrganizationMembers(data);
  } catch (err) {
    console.error(
      '[AdminView] Gagal menyimpan data pengurus:',
      err
    );

    setOrganizationMemberError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data pengurus.'
    );
  } finally {
    setIsSavingOrganizationMember(false);
  }
};

  const d1SchemaSql = DataService.generateD1SchemaSql();
  const workerCode = DataService.generateCloudflareWorkerExample();

  const handleLoginSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsSubmitting(true);
  setErrorMsg('');

  const res = await AuthService.login(email, password);

  setIsSubmitting(false);

  if (res.success) {
    onLoginSuccess();
  } else {
    setErrorMsg(res.error || 'Email atau kata sandi tidak cocok.');
  }
};

  const handleUpdateReportStatus = async (
  id: string,
  newStatus: CitizenReport['status']
) => {
  try {
    await DataService.updateReportStatus(id, newStatus);

    const data = await DataService.fetchReports();
    setReports(data);
  } catch (err) {
    console.error('[AdminView] Gagal memperbarui status laporan:', err);
  }
};
  const resetHouseholdForm = () => {
  setHouseNumber('');
  setResidentName('');
  setOccupancyStatus('huni');
  setPhone('');
  setFamilyMembers('');
  setHouseholdNotes('');
  setHouseholdError('');
  setEditingHousehold(null);
};

const openAddHousehold = () => {
  resetHouseholdForm();
  setIsHouseholdModalOpen(true);
};

const openEditHousehold = (household: Household) => {
  setEditingHousehold(household);
  setHouseNumber(household.houseNumber);
  setResidentName(household.residentName);
  setOccupancyStatus(household.occupancyStatus);
  setPhone(household.phone || '');
  setFamilyMembers(
    household.familyMembers !== undefined
      ? String(household.familyMembers)
      : ''
  );
  setHouseholdNotes(household.notes || '');
  setHouseholdError('');
  setIsHouseholdModalOpen(true);
};

const handleSaveHousehold = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!houseNumber.trim()) {
    setHouseholdError('Nomor rumah wajib diisi.');
    return;
  }

  if (!residentName.trim()) {
    setHouseholdError('Nama warga/kepala keluarga wajib diisi.');
    return;
  }

  setIsSavingHousehold(true);
  setHouseholdError('');

  try {
    if (editingHousehold) {
      await DataService.updateHousehold({
        ...editingHousehold,
        houseNumber: houseNumber.trim(),
        residentName: residentName.trim(),
        occupancyStatus,
        phone: phone.trim() || undefined,
        familyMembers: familyMembers
          ? Number(familyMembers)
          : undefined,
        notes: householdNotes.trim() || undefined,
      });
    } else {
      await DataService.addHousehold({
        houseNumber: houseNumber.trim(),
        residentName: residentName.trim(),
        occupancyStatus,
        isActive: true,
        phone: phone.trim() || undefined,
        familyMembers: familyMembers
          ? Number(familyMembers)
          : undefined,
        notes: householdNotes.trim() || undefined,
      });
    }

    setHouseholds(await DataService.fetchHouseholds());
    setIsHouseholdModalOpen(false);
    resetHouseholdForm();
  } catch (err) {
    setHouseholdError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data warga.'
    );
  } finally {
    setIsSavingHousehold(false);
  }
};
const handleSaveCommunityGroup = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!communityGroupName.trim()) {
    setCommunityError('Nama komunitas wajib diisi.');
    return;
  }

  try {
    setIsSavingCommunityGroup(true);
    setCommunityError(null);

    const basePayload = {
      name: communityGroupName.trim(),
      category: communityGroupCategory,
      description: communityGroupDescription.trim() || null,
      activityInfo: communityGroupActivityInfo.trim() || null,
      schedule: communityGroupSchedule.trim() || null,
      whatsappGroupUrl: communityGroupWhatsappUrl.trim() || null,
      photoUrl: communityGroupPhotoUrl || null,
      displayOrder:
        editingCommunityGroup?.displayOrder ??
        communityGroups.length,
      isActive: editingCommunityGroup?.isActive ?? true,
    };

    if (editingCommunityGroup) {
      let photoUrl = basePayload.photoUrl;

      if (communityGroupPhotoFile) {
        photoUrl = await DataService.uploadCommunityGroupPhoto(
          editingCommunityGroup.id,
          communityGroupCategory,
          communityGroupPhotoFile
        );
      }

      await DataService.updateCommunityGroup(
        editingCommunityGroup.id,
        {
          ...basePayload,
          photoUrl,
        }
      );
    } else {
      const createdGroup = await DataService.addCommunityGroup(
        basePayload
      );

      if (communityGroupPhotoFile) {
        const photoUrl =
          await DataService.uploadCommunityGroupPhoto(
            createdGroup.id,
            communityGroupCategory,
            communityGroupPhotoFile
          );

        await DataService.updateCommunityGroup(
          createdGroup.id,
          { photoUrl }
        );
      }
    }

    await loadCommunityData();
    setIsCommunityGroupModalOpen(false);
    setEditingCommunityGroup(null);
  } catch (err) {
    console.error(
      '[AdminView] Gagal menyimpan komunitas:',
      err
    );

    setCommunityError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data komunitas.'
    );
  } finally {
    setIsSavingCommunityGroup(false);
  }
};
const handleDeleteCommunityGroup = async (
  group: CommunityGroup
) => {
  const confirmed = window.confirm(
    `Hapus komunitas "${group.name}"?`
  );

  if (!confirmed) return;

  try {
    setCommunityError(null);

    await DataService.deleteCommunityGroup(group.id);
    await loadCommunityData();
  } catch (err) {
    console.error(
      '[AdminView] Gagal menghapus komunitas:',
      err
    );

    setCommunityError(
      err instanceof Error
        ? err.message
        : 'Gagal menghapus komunitas.'
    );
  }
};
const openCommunityAchievementModal = (
  achievement: CommunityAchievement | null = null
) => {
  setEditingCommunityAchievement(achievement);
  setCommunityAchievementTitle(achievement?.title ?? '');
  setCommunityAchievementRecipient(achievement?.recipient ?? '');
  setCommunityAchievementDescription(
    achievement?.description ?? ''
  );
  setCommunityAchievementDate(
    achievement?.achievementDate ?? ''
  );
  setCommunityAchievementPhotoUrl(
    achievement?.photoUrl ?? ''
  );
  setCommunityAchievementPhotoFile(null);
  setCommunityAchievementPhotoPreview(
    achievement?.photoUrl ?? ''
  );
  setIsCommunityAchievementModalOpen(true);
};
const handleCommunityGroupPhotoChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0] ?? null;

  setCommunityGroupPhotoFile(file);

  if (file) {
    setCommunityGroupPhotoPreview(URL.createObjectURL(file));
  } else {
    setCommunityGroupPhotoPreview(communityGroupPhotoUrl);
  }
};

const handleCommunityAchievementPhotoChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0] ?? null;

  setCommunityAchievementPhotoFile(file);

  if (file) {
    setCommunityAchievementPhotoPreview(
      URL.createObjectURL(file)
    );
  } else {
    setCommunityAchievementPhotoPreview(
      communityAchievementPhotoUrl
    );
  }
};
const handleSaveCommunityAchievement = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  if (!communityAchievementTitle.trim()) {
    setCommunityError('Judul prestasi wajib diisi.');
    return;
  }

  if (!communityAchievementRecipient.trim()) {
    setCommunityError('Nama penerima prestasi wajib diisi.');
    return;
  }

  try {
    setIsSavingCommunityAchievement(true);
    setCommunityError(null);

    const basePayload = {
      title: communityAchievementTitle.trim(),
      recipient: communityAchievementRecipient.trim(),
      description:
        communityAchievementDescription.trim() || null,
      achievementDate:
        communityAchievementDate || null,
      photoUrl: communityAchievementPhotoUrl || null,
      displayOrder:
        editingCommunityAchievement?.displayOrder ??
        communityAchievements.length,
      isActive:
        editingCommunityAchievement?.isActive ?? true,
    };

    if (editingCommunityAchievement) {
      let photoUrl = basePayload.photoUrl;

      if (communityAchievementPhotoFile) {
        photoUrl =
          await DataService.uploadCommunityAchievementPhoto(
            editingCommunityAchievement.id,
            communityAchievementPhotoFile
          );
      }

      await DataService.updateCommunityAchievement(
        editingCommunityAchievement.id,
        {
          ...basePayload,
          photoUrl,
        }
      );
    } else {
      const createdAchievement =
        await DataService.addCommunityAchievement(
          basePayload
        );

      if (communityAchievementPhotoFile) {
        const photoUrl =
          await DataService.uploadCommunityAchievementPhoto(
            createdAchievement.id,
            communityAchievementPhotoFile
          );

        await DataService.updateCommunityAchievement(
          createdAchievement.id,
          { photoUrl }
        );
      }
    }

    await loadCommunityData();
    setIsCommunityAchievementModalOpen(false);
    setEditingCommunityAchievement(null);
  } catch (err) {
    console.error(
      '[AdminView] Gagal menyimpan prestasi:',
      err
    );

    setCommunityError(
      err instanceof Error
        ? err.message
        : 'Gagal menyimpan data prestasi.'
    );
  } finally {
    setIsSavingCommunityAchievement(false);
  }
};
const handleDeleteCommunityAchievement = async (
  achievement: CommunityAchievement
) => {
  const confirmed = window.confirm(
    `Hapus prestasi "${achievement.title}"?`
  );

  if (!confirmed) return;

  try {
    setCommunityError(null);

    await DataService.deleteCommunityAchievement(
      achievement.id
    );

    await loadCommunityData();
  } catch (err) {
    console.error(
      '[AdminView] Gagal menghapus prestasi:',
      err
    );

    setCommunityError(
      err instanceof Error
        ? err.message
        : 'Gagal menghapus prestasi.'
    );
  }
};
const handleDeactivateHousehold = async (household: Household) => {
  const confirmed = window.confirm(
    `Nonaktifkan data ${household.houseNumber} - ${household.residentName}?\n\n` +
      `Data tidak akan dihapus agar histori transaksi tetap tersimpan.`
  );

  if (!confirmed) return;

  try {
    await DataService.deactivateHousehold(household.id);
    setHouseholds(await DataService.fetchHouseholds());
  } catch (err) {
    alert(
      err instanceof Error
        ? err.message
        : 'Gagal menonaktifkan data warga.'
    );
  }
};
  const handleResetData = () => {
    if (window.confirm('Kembalikan semua data ke dummy bawaan awal Griya Adika Narama?')) {
      DataService.resetAllData();
      alert('Data berhasil di-reset ke versi awal.');
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(d1SchemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCopyWorker = () => {
    navigator.clipboard.writeText(workerCode);
    setCopiedWorker(true);
    setTimeout(() => setCopiedWorker(false), 2000);
  };
  const filteredHouseholds = households
  .filter((h) => {
    const keyword = householdSearch.trim().toLowerCase();

    if (!keyword) return true;

    return (
      h.houseNumber.toLowerCase().includes(keyword) ||
      h.residentName.toLowerCase().includes(keyword) ||
      (h.phone || '').toLowerCase().includes(keyword)
    );
  })
  .sort((a, b) =>
    a.houseNumber.localeCompare(b.houseNumber, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

const activeHouseholds = households.filter((h) => h.isActive);
const huniCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'huni'
).length;
const semiHuniCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'semi-huni'
).length;
const kosongCount = activeHouseholds.filter(
  (h) => h.occupancyStatus === 'kosong'
).length;

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Login Administrasi Blok H</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Masuk untuk mengelola pengumuman, agenda kegiatan, kas keuangan, dan aspirasi warga.
            </p>
          </div>

          {/* Supabase Authentication Notice  */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Akses Pengurus:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Gunakan akun pengurus yang telah terdaftar pada sistem untuk mengakses panel administrasi Blok H.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Admin
              </label>

              <input
                type="email"
                required
                placeholder="email pengurus"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"/>      
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Panel Pengurus'}
            </button>
          </form>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Mode Administrasi</span>
            <span aria-hidden="true">·</span>
            <span>Pengurus Paguyuban Blok H</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Panel Pengurus Griya Adika Narama
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80">
            Kelola konten portal, tindak lanjuti keluhan warga, dan siapkan integrasi Cloudflare D1.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onLogout}
            className="px-3.5 py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>

      {/* Admin Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab('pengumuman')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Bell className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Kelola Pengumuman</span>
          <span className="text-[11px] text-slate-500 block">Buat & sematkan berita</span>
        </button>

        <button
          onClick={() => onSelectTab('agenda')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Kelola Agenda</span>
          <span className="text-[11px] text-slate-500 block">Jadwal kerja bakti & rapat</span>
        </button>

        <button
          onClick={() => onSelectTab('keuangan')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <Wallet className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Buku Kas & IPL</span>
          <span className="text-[11px] text-slate-500 block">Catat masuk & keluar kas</span>
        </button>

        <button
          onClick={() => onSelectTab('komunitas')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500/40 text-left space-y-1 shadow-2xs transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="block text-xs font-bold text-slate-800">Komunitas
          </span>
          <span className="text-[11px] text-slate-500 block">Atur progres & anggaran</span>
        </button>
      </div>

      {/* Sub-tabs for Admin Management */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setAdminTab('laporan')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            adminTab === 'laporan'
              ? 'bg-emerald-800 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Aspirasi & Lapor Warga ({reports.length})</span>
                </button>
                </div>

      {/* Tab 1: Aspirasi & Laporan Warga */}
      {adminTab === 'laporan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Daftar Keluhan & Masukan Masuk</h3>
            <span className="text-xs text-slate-500">
              Total {reports.length} laporan dari warga Blok H
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rep.residentName}</span>
                    <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Rumah {rep.houseNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{rep.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase text-[11px] font-semibold text-slate-700">
                      {rep.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Status:</span>
                    <select
                      value={rep.status}
                      onChange={(e) => handleUpdateReportStatus(rep.id, e.target.value as any)}
                      className="text-xs font-semibold rounded-md border border-slate-300 py-1 px-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="menunggu">Menunggu Tindak Lanjut</option>
                      <option value="diproses">Sedang Diproses Satpam/Seksi</option>
                      <option value="selesai">Selesai Ditangani</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{rep.description}</p>
                </div>

                {rep.phone && rep.phone !== '-' && (
                  <div className="text-[11px] text-slate-500 pt-1">
                    Kontak Pelapor:{' '}
                    <a
                      href={`https://wa.me/${rep.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-800 font-semibold hover:underline"
                    >
                      {rep.phone} (Hubungi via WA)
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setAdminTab('warga')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
          adminTab === 'warga'
            ? 'bg-emerald-800 text-white'
            : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Data Warga ({activeHouseholds.length})</span>
      </button>
<button
  onClick={() => setAdminTab('pengurus')}
  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
    adminTab === 'pengurus'
      ? 'bg-emerald-800 text-white'
      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
  }`}
>
  <Users className="w-3.5 h-3.5" />
  <span>Pengurus ({organizationMembers.length})</span>
</button>
<button
  onClick={() => setAdminTab('komunitas')}
  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
    adminTab === 'komunitas'
      ? 'bg-emerald-800 text-white'
      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
  }`}
>
  <Users className="w-3.5 h-3.5" />
  <span>Komunitas ({communityGroups.length + communityAchievements.length})</span>
</button>
{adminTab === 'pengurus' && (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Struktur & Pengurus Blok H
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Kelola data pengurus periode 2026–2029.
        </p>
      </div>

      <button
        type="button"
        onClick={() => openOrganizationMemberModal()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900"
      >
        <UserPlus className="h-4 w-4" />
        Tambah Pengurus
      </button>
    </div>

    {/* Error */}
    {organizationMemberError && (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
        {organizationMemberError}
      </div>
    )}

    {/* Loading */}
    {isLoadingOrganizationMembers ? (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />

        <p className="mt-3 text-xs text-slate-500">
          Memuat data pengurus...
        </p>
      </div>
    ) : organizationMembers.length === 0 ? (
      /* Empty state */
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-slate-300" />

        <h4 className="mt-3 text-sm font-bold text-slate-800">
          Belum ada data pengurus
        </h4>

        <p className="mt-1 text-xs text-slate-500">
          Tambahkan susunan pengurus Blok H untuk periode 2026–2029.
        </p>

        <button
          type="button"
          onClick={() => openOrganizationMemberModal()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Pengurus
        </button>
      </div>
    ) : (
      /* Table */
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Pengurus
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Jabatan
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Divisi
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Periode
                </th>

                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {[...organizationMembers]
                .sort(
                  (a, b) =>
                    a.displayOrder - b.displayOrder
                )
                .map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    {/* Pengurus */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-emerald-50">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={`Foto ${member.name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-emerald-700">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {member.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Urutan: {member.displayOrder}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-semibold text-emerald-700">
                        {member.position}
                      </p>
                    </td>

                    {/* Divisi */}
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-600">
                        {member.division || '-'}
                      </span>
                    </td>

                    {/* Periode */}
                    <td className="px-4 py-4">
                      <p className="text-xs text-slate-600">
                        {member.periodStart}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        s/d {member.periodEnd}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {member.isActive
                          ? 'Aktif'
                          : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openOrganizationMemberModal(
                              member
                            )
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                          title="Edit pengurus"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const confirmed =
                              window.confirm(
                                `Hapus data pengurus "${member.name}"?`
                              );

                            if (!confirmed) {
                              return;
                            }

                            try {
                              setOrganizationMemberError('');

                              await DataService.deleteOrganizationMember(
                                member.id
                              );
                            } catch (err) {
                              console.error(
                                '[AdminView] Gagal menghapus data pengurus:',
                                err
                              );

                              setOrganizationMemberError(
                                err instanceof Error
                                  ? err.message
                                  : 'Gagal menghapus data pengurus.'
                              );
                            }
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Hapus pengurus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}
      {/* Tab Data Warga */}
{adminTab === 'warga' && (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">
          Master Data Warga
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Data ini menjadi referensi unit rumah untuk Keuangan dan IPL.
        </p>
      </div>

      <button
        onClick={openAddHousehold}
        className="px-3 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah Data Warga
      </button>
    </div>

    {/* Statistik */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Total Rumah
    </div>
    <div className="text-xl font-bold text-slate-900 mt-1">
      {households.length}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Huni
    </div>
    <div className="text-xl font-bold text-emerald-700 mt-1">
      {huniCount}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Semi Huni
    </div>
    <div className="text-xl font-bold text-slate-900 mt-1">
      {semiHuniCount}
    </div>
  </div>

  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className="text-[11px] text-slate-500">
      Kosong
    </div>
    <div className="text-xl font-bold text-slate-500 mt-1">
      {kosongCount}
    </div>
  </div>
</div>

    {/* Search */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

      <input
        type="text"
        value={householdSearch}
        onChange={(e) => setHouseholdSearch(e.target.value)}
        placeholder="Cari nomor rumah, nama warga, atau nomor HP..."
        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
      />
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                No. Rumah
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Nama Warga
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Status Tinggal
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Anggota
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">
                Status
              </th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredHouseholds.map((household) => (
              <tr
                key={household.id}
                className={!household.isActive ? 'bg-slate-50/70' : ''}
              >
                <td className="px-4 py-3 font-mono font-semibold text-emerald-800">
                  {household.houseNumber}
                </td>

                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    {household.residentName}
                  </div>

                  {household.phone && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {household.phone}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {household.occupancyStatus === 'huni'
                  ? 'Huni'
                  : household.occupancyStatus === 'semi-huni'
                  ? 'Semi Huni'
                  : 'Kosong'}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {household.familyMembers ?? '-'}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-md text-[10px] font-semibold ${
                      household.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {household.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditHousehold(household)}
                      title="Edit data"
                      className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {household.isActive && (
                      <button
                        onClick={() =>
                          handleDeactivateHousehold(household)
                        }
                        title="Nonaktifkan data"
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-300"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredHouseholds.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-xs text-slate-400"
                >
                  Belum ada data warga yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
      {isHouseholdModalOpen && (
  <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {editingHousehold
              ? 'Edit Data Warga'
              : 'Tambah Data Warga'}
          </h3>

          <p className="text-[11px] text-slate-500 mt-0.5">
            Data warga menjadi master referensi unit rumah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsHouseholdModalOpen(false);
            resetHouseholdForm();
          }}
          className="text-slate-400 hover:text-slate-700 text-xl leading-none"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleSaveHousehold}
        className="p-5 space-y-4"
      >
        {householdError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs">
            {householdError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nomor Rumah *
          </label>

          <input
            value={houseNumber}
            onChange={(e) =>
              setHouseNumber(e.target.value.toUpperCase())
            }
            placeholder="Contoh: HA-01"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Warga / Kepala Keluarga *
          </label>

          <input
            value={residentName}
            onChange={(e) => setResidentName(e.target.value)}
            placeholder="Nama lengkap"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status Tinggal *
          </label>

          <select
            value={occupancyStatus}
            onChange={(e) =>
              setOccupancyStatus(
                e.target.value as OccupancyStatus
              )
            }
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="huni">Huni</option>
            <option value="semi-huni">Semi Huni</option>
            <option value="kosong">Kosong</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor HP
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Anggota Keluarga
            </label>

            <input
              type="number"
              min="1"
              value={familyMembers}
              onChange={(e) => setFamilyMembers(e.target.value)}
              placeholder="Contoh: 4"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan
          </label>

          <textarea
            value={householdNotes}
            onChange={(e) => setHouseholdNotes(e.target.value)}
            rows={3}
            placeholder="Catatan internal pengurus..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setIsHouseholdModalOpen(false);
              resetHouseholdForm();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isSavingHousehold}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
          >
            {isSavingHousehold
              ? 'Menyimpan...'
              : editingHousehold
              ? 'Simpan Perubahan'
              : 'Simpan Data Warga'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {adminTab === 'komunitas' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Komunitas Blok H
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Kelola komunitas Atlet, Gamers, dan Galeri Prestasi Blok H.
              </p>
            </div>
          </div>

          {/* Error */}
          {communityError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {communityError}
            </div>
          )}

          {/* Loading */}
          {isLoadingCommunity ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
              <p className="mt-3 text-xs text-slate-500">
                Memuat data komunitas...
              </p>
            </div>
          ) : (
            <>
              {/* Komunitas */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Atlet & Gamers
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Tambah, edit, atau hapus komunitas warga Blok H.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCommunityGroupModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Komunitas
                  </button>
                </div>

                {communityGroups.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-xs text-slate-500">
                      Belum ada komunitas Atlet atau Gamers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communityGroups.map((group) => (
                      <div
                        key={group.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {group.photoUrl ? (
                            <img
                              src={group.photoUrl}
                              alt={group.name}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <Users className="h-7 w-7" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="truncate text-sm font-bold text-slate-900">
                                {group.name}
                              </h5>

                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                {group.category === 'atlet'
                                  ? 'Atlet'
                                  : 'Gamers'}
                              </span>
                            </div>

                            {group.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {group.description}
                              </p>
                            )}

                            {group.schedule && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                Jadwal: {group.schedule}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCommunityGroupModal(group)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCommunityGroup(group)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Galeri Prestasi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Galeri Prestasi
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Kelola dokumentasi prestasi warga dan komunitas Blok H.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCommunityAchievementModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Prestasi
                  </button>
                </div>

                {communityAchievements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-xs text-slate-500">
                      Belum ada data prestasi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communityAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {achievement.photoUrl ? (
                            <img
                              src={achievement.photoUrl}
                              alt={achievement.title}
                              className="h-16 w-16 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                              <span className="text-xl">🏆</span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-slate-900">
                              {achievement.title}
                            </h5>

                            <p className="mt-1 text-xs font-medium text-slate-600">
                              {achievement.recipient}
                            </p>

                            {achievement.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                {achievement.description}
                              </p>
                            )}

                            {achievement.achievementDate && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                Tanggal: {achievement.achievementDate}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openCommunityAchievementModal(
                                achievement
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCommunityAchievement(
                                achievement
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
            {/* Modal Tambah / Edit Komunitas */}
      {isCommunityGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCommunityGroup
                    ? 'Edit Komunitas'
                    : 'Tambah Komunitas'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Data komunitas Atlet atau Gamers Blok H.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCommunityGroupModalOpen(false);
                  setEditingCommunityGroup(null);
                  setCommunityError(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Tutup"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <form
              onSubmit={handleSaveCommunityGroup}
              className="overflow-y-auto"
            >
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Nama Komunitas
                    </label>
                    <input
                      type="text"
                      value={communityGroupName}
                      onChange={(e) =>
                        setCommunityGroupName(e.target.value)
                      }
                      placeholder="Contoh: Blok H Futsal"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Kategori
                    </label>
                    <select
                      value={communityGroupCategory}
                      onChange={(e) =>
                        setCommunityGroupCategory(
                          e.target.value as CommunityGroupCategory
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="atlet">Atlet</option>
                      <option value="gamers">Gamers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Deskripsi
                  </label>
                  <textarea
                    value={communityGroupDescription}
                    onChange={(e) =>
                      setCommunityGroupDescription(e.target.value)
                    }
                    rows={3}
                    placeholder="Jelaskan komunitas dan anggotanya..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Informasi Kegiatan
                  </label>
                  <textarea
                    value={communityGroupActivityInfo}
                    onChange={(e) =>
                      setCommunityGroupActivityInfo(e.target.value)
                    }
                    rows={3}
                    placeholder="Contoh: Latihan rutin, sparing, turnamen..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Jadwal Kegiatan
                    </label>
                    <input
                      type="text"
                      value={communityGroupSchedule}
                      onChange={(e) =>
                        setCommunityGroupSchedule(e.target.value)
                      }
                      placeholder="Contoh: Minggu, 16.00 WIB"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Link Grup WhatsApp
                    </label>
                    <input
                      type="url"
                      value={communityGroupWhatsappUrl}
                      onChange={(e) =>
                        setCommunityGroupWhatsappUrl(e.target.value)
                      }
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Foto Komunitas
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCommunityGroupPhotoChange}
                    className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />

                  {communityGroupPhotoPreview && (
                    <div className="mt-3">
                      <img
                        src={communityGroupPhotoPreview}
                        alt="Preview foto komunitas"
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCommunityGroupModalOpen(false);
                    setEditingCommunityGroup(null);
                    setCommunityError(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingCommunityGroup}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCommunityGroup && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {editingCommunityGroup
                    ? 'Simpan Perubahan'
                    : 'Simpan Komunitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Prestasi */}
      {isCommunityAchievementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCommunityAchievement
                    ? 'Edit Prestasi'
                    : 'Tambah Prestasi'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Data prestasi warga atau komunitas Blok H.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCommunityAchievementModalOpen(false);
                  setEditingCommunityAchievement(null);
                  setCommunityError(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Tutup"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <form
              onSubmit={handleSaveCommunityAchievement}
              className="overflow-y-auto"
            >
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Judul Prestasi
                    </label>
                    <input
                      type="text"
                      value={communityAchievementTitle}
                      onChange={(e) =>
                        setCommunityAchievementTitle(e.target.value)
                      }
                      placeholder="Contoh: Juara 1 Turnamen Futsal"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Penerima / Peraih
                    </label>
                    <input
                      type="text"
                      value={communityAchievementRecipient}
                      onChange={(e) =>
                        setCommunityAchievementRecipient(
                          e.target.value
                        )
                      }
                      placeholder="Nama warga / komunitas"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Deskripsi Prestasi
                  </label>
                  <textarea
                    value={communityAchievementDescription}
                    onChange={(e) =>
                      setCommunityAchievementDescription(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Ceritakan pencapaian atau kegiatan..."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Tanggal Prestasi
                  </label>
                  <input
                    type="date"
                    value={communityAchievementDate}
                    onChange={(e) =>
                      setCommunityAchievementDate(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Foto Prestasi
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCommunityAchievementPhotoChange}
                    className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
                  />

                  {communityAchievementPhotoPreview && (
                    <div className="mt-3">
                      <img
                        src={communityAchievementPhotoPreview}
                        alt="Preview foto prestasi"
                        className="h-40 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCommunityAchievementModalOpen(false);
                    setEditingCommunityAchievement(null);
                    setCommunityError(null);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingCommunityAchievement}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCommunityAchievement && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {editingCommunityAchievement
                    ? 'Simpan Perubahan'
                    : 'Simpan Prestasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Tambah / Edit Pengurus */}
      {isOrganizationMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingOrganizationMember
                    ? 'Edit Pengurus'
                    : 'Tambah Pengurus'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Data struktur pengurus Blok H periode 2026–2029.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOrganizationMemberModalOpen(false);
                  setEditingOrganizationMember(null);
                  setOrganizationMemberError('');
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Tutup"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSaveOrganizationMember}
              className="overflow-y-auto"
            >
              <div className="space-y-4 px-5 py-5 sm:px-6">
                {organizationMemberError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {organizationMemberError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Nama */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Nama Pengurus <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={organizationMemberName}
                      onChange={(e) =>
                        setOrganizationMemberName(e.target.value)
                      }
                      placeholder="Nama lengkap pengurus"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Jabatan */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Jabatan <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={organizationMemberPosition}
                      onChange={(e) =>
                        setOrganizationMemberPosition(e.target.value)
                      }
                      placeholder="Contoh: Ketua Koordinator"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Divisi */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Divisi
                    </label>

                    <input
                      type="text"
                      value={organizationMemberDivision}
                      onChange={(e) =>
                        setOrganizationMemberDivision(e.target.value)
                      }
                      placeholder="Contoh: Sosial & Lingkungan"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Nomor HP */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Nomor HP
                    </label>

                    <input
                      type="tel"
                      value={organizationMemberPhone}
                      onChange={(e) =>
                        setOrganizationMemberPhone(e.target.value)
                      }
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Foto URL */}
                  <div className="space-y-3">
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
      Foto Pengurus
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0] ?? null;

        setOrganizationMemberPhotoFile(file);

        if (file) {
          const previewUrl = URL.createObjectURL(file);
          setOrganizationMemberPhotoPreview(previewUrl);
        } else {
          setOrganizationMemberPhotoPreview(
            editingOrganizationMember?.photoUrl ?? ''
          );
        }
      }}
      className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-xs text-slate-600 file:mr-3 file:cursor-pointer file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
    />

    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
      Pilih foto dari komputer. Format gambar JPG, PNG, atau WebP.
    </p>
  </div>

  {organizationMemberPhotoPreview && (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white bg-emerald-50 shadow-sm">
        <img
          src={organizationMemberPhotoPreview}
          alt="Preview foto pengurus"
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-700">
          Preview Foto
        </p>

        {organizationMemberPhotoFile ? (
          <p className="mt-1 truncate text-[11px] text-slate-500">
            {organizationMemberPhotoFile.name}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-slate-400">
            Foto saat ini
          </p>
        )}
      </div>
    </div>
  )}
</div>

                  {/* Tanggung Jawab */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Tanggung Jawab
                    </label>

                    <textarea
                      value={organizationMemberResponsibilities}
                      onChange={(e) =>
                        setOrganizationMemberResponsibilities(
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Jelaskan tanggung jawab utama pengurus..."
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Bio */}
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Tentang / Bio
                    </label>

                    <textarea
                      value={organizationMemberBio}
                      onChange={(e) =>
                        setOrganizationMemberBio(e.target.value)
                      }
                      rows={3}
                      placeholder="Deskripsi singkat tentang pengurus..."
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Urutan */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Urutan Tampil
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={organizationMemberDisplayOrder}
                      onChange={(e) =>
                        setOrganizationMemberDisplayOrder(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Angka lebih kecil tampil lebih awal.
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Status
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setOrganizationMemberIsActive(
                          !organizationMemberIsActive
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                        organizationMemberIsActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span>
                        {organizationMemberIsActive
                          ? 'Pengurus Aktif'
                          : 'Pengurus Nonaktif'}
                      </span>

                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          organizationMemberIsActive
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Periode */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Periode Mulai
                    </label>

                    <input
                      type="date"
                      value={organizationMemberPeriodStart}
                      onChange={(e) =>
                        setOrganizationMemberPeriodStart(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Periode Selesai
                    </label>

                    <input
                      type="date"
                      value={organizationMemberPeriodEnd}
                      onChange={(e) =>
                        setOrganizationMemberPeriodEnd(
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsOrganizationMemberModalOpen(false);
                    setEditingOrganizationMember(null);
                    setOrganizationMemberError('');
                  }}
                  className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-colors hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingOrganizationMember}
                  className="rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingOrganizationMember
                    ? 'Menyimpan...'
                    : editingOrganizationMember
                    ? 'Simpan Perubahan'
                    : 'Simpan Pengurus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
