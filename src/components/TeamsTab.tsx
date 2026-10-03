import React, { useState } from 'react';
import { 
  MessagesSquare, 
  Search, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  X,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Send,
  Sparkles,
  Info,
  ExternalLink,
  Shield,
  Trash2,
  Plus,
  Check,
  UserPlus,
  Rocket,
  ShieldCheck,
  CheckSquare,
  Square,
  Zap,
  Sliders
} from 'lucide-react';
import type { TeamItem, ClassItem, UserItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface TeamsTabProps {
  teams: TeamItem[];
  classes: ClassItem[];
  users: UserItem[];
  onSyncTeam: (team: TeamItem) => void;
  onUpdateTeam: (id: string, teamData: Partial<TeamItem>) => void;
  onGenerateCatalog: () => void;
  onApplyOfficialAssignments: () => void;
  onAssignTeacher: (teamId: string, teacherIds: string[]) => void;
  onBulkAddAdminOwners?: (adminEmails?: string[], teamIds?: string[]) => void;
  onProvisionTeam: (teamId: string) => void;
  onImportAssignmentsCsv: (csvContent: string) => void;
  isSyncing: boolean;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  classes,
  users,
  onSyncTeam,
  onUpdateTeam,
  onGenerateCatalog,
  onApplyOfficialAssignments,
  onAssignTeacher,
  onBulkAddAdminOwners,
  onProvisionTeam,
  onImportAssignmentsCsv,
  isSyncing,
}) => {
  const [search, setSearch] = useState('');
  const [managedFilter, setManagedFilter] = useState<'all' | 'auto' | 'manual' | 'm365_ready' | 'm365_pending'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  
  // Multi-teacher assignment modal state
  const [assigningTeam, setAssigningTeam] = useState<TeamItem | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'teachers' | 'admins'>('all');

  // Admin Co-ownership Global Modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedAdminEmails, setSelectedAdminEmails] = useState<string[]>([
    'mjoubin@notredamedesmissions.com',
    'admin@notredamedesmissions.com',
    'admin@notredamedesmissions.onmicrosoft.com'
  ]);
  const [adminScope, setAdminScope] = useState<'all' | 'filtered'>('all');

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [provisioningTeamId, setProvisioningTeamId] = useState<string | null>(null);

  // Batch Provisioning Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchScope, setBatchScope] = useState<'class' | 'pending' | 'filtered'>('class');
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; teamName: string; successCount: number; failedCount: number } | null>(null);

  // Security Restrictions Modal State
  const [isRestrictionsModalOpen, setIsRestrictionsModalOpen] = useState(false);
  const [isEnforcingRestrictions, setIsEnforcingRestrictions] = useState(false);
  const [enforceResult, setEnforceResult] = useState<string | null>(null);

  const handleStartBatchProvision = async () => {
    setIsBatchRunning(true);
    let targetTeams: TeamItem[] = [];

    if (batchScope === 'class') {
      const targetClass = classFilter !== 'all' ? classFilter : '101';
      targetTeams = teams.filter(t => t.classCode === targetClass && (!t.m365TeamId || t.status !== 'synced'));
    } else if (batchScope === 'filtered') {
      targetTeams = filteredTeams.filter(t => !t.m365TeamId || t.status !== 'synced');
    } else {
      targetTeams = teams.filter(t => !t.m365TeamId || t.status !== 'synced');
    }

    if (targetTeams.length === 0) {
      alert('Aucune équipe en attente de création trouvée pour ce périmètre.');
      setIsBatchRunning(false);
      return;
    }

    setBatchProgress({
      current: 0,
      total: targetTeams.length,
      teamName: targetTeams[0].name,
      successCount: 0,
      failedCount: 0,
    });

    let successAcc = 0;
    let failedAcc = 0;

    for (let i = 0; i < targetTeams.length; i++) {
      const currentTeam = targetTeams[i];
      setBatchProgress({
        current: i + 1,
        total: targetTeams.length,
        teamName: currentTeam.name,
        successCount: successAcc,
        failedCount: failedAcc,
      });

      try {
        const res = await api.provisionTeamM365(currentTeam.id);
        if (res.success) {
          successAcc++;
        } else {
          failedAcc++;
        }
      } catch (e) {
        failedAcc++;
      }

      setBatchProgress({
        current: i + 1,
        total: targetTeams.length,
        teamName: currentTeam.name,
        successCount: successAcc,
        failedCount: failedAcc,
      });

      // Pause to avoid Graph throttling
      await new Promise(r => setTimeout(r, 1200));
    }

    setIsBatchRunning(false);
    onGenerateCatalog(); // refresh data
  };

  const handleApplyRestrictionsAll = async () => {
    setIsEnforcingRestrictions(true);
    setEnforceResult(null);
    try {
      const res = await api.enforceTeamRestrictions({ all: true });
      if (res.success) {
        setEnforceResult(`Restrictions appliquées avec succès sur ${res.count || 0} équipes Microsoft Teams !`);
      } else {
        setEnforceResult(`Erreur: ${res.error}`);
      }
    } catch (err: any) {
      setEnforceResult(`Erreur lors de l'application: ${err.message}`);
    } finally {
      setIsEnforcingRestrictions(false);
    }
  };

  // Assignable staff (teachers and administrators)
  const assignableStaff = users.filter((u) => (u.role === 'teacher' || u.role === 'admin') && u.status === 'active');
  const adminStaff = users.filter((u) => u.role === 'admin' || (u.email && (u.email.toLowerCase().includes('mjoubin') || u.email.toLowerCase().includes('admin@'))));

  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.classCode.toLowerCase().includes(search.toLowerCase()) ||
      t.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedTeachers && t.assignedTeachers.some(at => at.name.toLowerCase().includes(search.toLowerCase()) || at.email.toLowerCase().includes(search.toLowerCase())));

    let matchManaged = true;
    if (managedFilter === 'auto') matchManaged = t.autoManaged;
    else if (managedFilter === 'manual') matchManaged = !t.autoManaged;
    else if (managedFilter === 'm365_ready') matchManaged = Boolean(t.m365TeamId);
    else if (managedFilter === 'm365_pending') matchManaged = !t.m365TeamId;

    const matchClass = classFilter === 'all' || t.classCode === classFilter;

    return matchSearch && matchManaged && matchClass;
  });

  const autoManagedCount = teams.filter((t) => t.autoManaged).length;
  const m365RealCount = teams.filter((t) => t.m365TeamId).length;
  const withTeachersCount = teams.filter((t) => (t.teacherCount || 0) > 0).length;

  const handleExecuteProvision = async (teamId: string) => {
    setProvisioningTeamId(teamId);
    try {
      await onProvisionTeam(teamId);
    } finally {
      setProvisioningTeamId(null);
    }
  };

  const openAssignModal = (team: TeamItem) => {
    setAssigningTeam(team);
    setSelectedTeacherIds(team.assignedTeacherIds ? [...team.assignedTeacherIds] : []);
    setTeacherSearch('');
    setStaffRoleFilter('all');
  };

  const toggleTeacherSelection = (userId: string) => {
    setSelectedTeacherIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveAssignments = () => {
    if (!assigningTeam) return;
    onAssignTeacher(assigningTeam.id, selectedTeacherIds);
    setAssigningTeam(null);
  };

  const handleAddAllAdminsToCurrentTeam = () => {
    const adminIds = adminStaff.map(a => a.id);
    setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...adminIds])));
  };

  const handleAddMjoubinToCurrentTeam = () => {
    const mjoubin = users.find(u => u.email.toLowerCase() === 'mjoubin@notredamedesmissions.com' || u.upn.toLowerCase() === 'mjoubin@notredamedesmissions.com');
    if (mjoubin) {
      setSelectedTeacherIds(prev => Array.from(new Set([...prev, mjoubin.id])));
    }
  };

  const handleExecuteBulkAdmins = () => {
    if (onBulkAddAdminOwners) {
      const targetTeamIds = adminScope === 'filtered' ? filteredTeams.map(t => t.id) : undefined;
      onBulkAddAdminOwners(selectedAdminEmails, targetTeamIds);
    }
    setIsAdminModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Équipes Microsoft Teams ({teams.length})
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Format : [CLASSE]-[MATIÈRE]
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {m365RealCount} créées sur M365
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Multi-propriétaires actif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Génération, assignation de plusieurs enseignants (co-propriétaires, suppléants) et comptes administrateurs Office (<code className="text-amber-400">mjoubin</code> & Admins).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 border border-emerald-400/40"
            title="Créer automatiquement toutes les équipes en masse sans devoir cliquer une par une"
          >
            <Rocket className="w-4 h-4 text-emerald-100 animate-pulse" />
            Tout créer sur Teams (En masse)
          </button>

          <button
            onClick={() => setIsRestrictionsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition active:scale-95 border border-purple-500/30"
            title="Appliquer les restrictions strictes sur les membres des équipes (interdire création de canaux/apps, etc.)"
          >
            <ShieldCheck className="w-4 h-4 text-purple-200" />
            Restrictions membres
          </button>

          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition active:scale-95"
            title="Associer mjoubin@notredamedesmissions.com et les administrateurs Office en co-propriétaires de toutes les équipes"
          >
            <Shield className="w-4 h-4 text-amber-100" />
            Co-propriété Admins
          </button>

          <button
            onClick={onApplyOfficialAssignments}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Applique la grille officielle des équipes et professeurs par matière pour l'ensemble des 37 classes (document officiel UnDeuxTEMPS / Axess)"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Affecter Profs Officiels
          </button>

          <button
            onClick={onGenerateCatalog}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/30 transition active:scale-95"
            title="Régénérer ou compléter le catalogue d'équipes pour chacune des 37 classes"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            Catalogue 37 Classes
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Importer une grille personnalisée de professeurs par classe et par matière (CSV/Excel)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Importer CSV
          </button>
        </div>
      </div>

      {/* Guide Banner for multi-teachers & admin co-ownership */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-white text-sm">
              Attribution de plusieurs professeurs et des administrateurs Office
            </div>
            <p>
              1. <strong>Multi-propriétaires par équipe :</strong> Chaque équipe Teams accepte plusieurs propriétaires (professeur principal, co-enseignants, suppléants et administrateurs Office). Cliquez sur <strong>« Assigner »</strong> pour cocher autant de personnes que souhaité.
            </p>
            <p>
              2. <strong>Compte <code className="text-amber-300 font-mono">mjoubin@notredamedesmissions.com</code> & Administrateurs :</strong> Utilisez le bouton orange <strong>« Co-propriété Admins Office »</strong> ci-dessus pour ajouter en 1 clic l'équipe informatique en co-propriétaire sur l'ensemble des 565 équipes Teams.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 text-xs gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700">
          <span className="text-slate-400">Équipes avec propriétaires :</span>
          <span className="font-bold text-emerald-400 text-sm">{withTeachersCount} / {teams.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher équipe, matière, professeur ou mjoubin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setManagedFilter('all')}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                managedFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes ({teams.length})
            </button>
            <button
              onClick={() => setManagedFilter('m365_ready')}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                managedFilter === 'm365_ready' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sur M365 ({m365RealCount})
            </button>
            <button
              onClick={() => setManagedFilter('m365_pending')}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                managedFilter === 'm365_pending' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              À Créer ({teams.length - m365RealCount})
            </button>
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Toutes les 37 Classes</option>
            <optgroup label="Collège (24 classes)">
              {classes.filter(c => c.section === 'Collège').map(c => (
                <option key={c.id} value={c.code}>Classe {c.code} ({c.studentCount} élèves)</option>
              ))}
            </optgroup>
            <optgroup label="Lycée (13 classes)">
              {classes.filter(c => c.section === 'Lycée').map(c => (
                <option key={c.id} value={c.code}>Classe {c.code} ({c.studentCount} élèves)</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((t) => {
          const isRealOnM365 = Boolean(t.m365TeamId);
          const isCurrentProvisioning = provisioningTeamId === t.id;
          const assignedCount = t.assignedTeachers?.length || 0;

          return (
            <div
              key={t.id}
              className={`bg-slate-800/80 border rounded-2xl p-4 flex flex-col justify-between transition shadow-sm hover:shadow-md ${
                isRealOnM365 ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div>
                {/* Team Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.classCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700/60 text-slate-300">
                        {t.subjectCode || 'TRONC'}
                      </span>
                      {isRealOnM365 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          M365 Cloud
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Prêt à créer
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mt-1.5 truncate" title={t.name}>
                      {t.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {t.subjectName}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0 text-slate-400">
                    <MessagesSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>

                {/* Team Stats */}
                <div className="mt-3.5 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Élèves (Membres)</span>
                    <span className="font-bold text-white text-sm font-mono">{t.memberCount} élèves</span>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Propriétaires (Owners)</span>
                    <span className="font-bold text-indigo-300 text-sm font-mono">{assignedCount} assigné(s)</span>
                  </div>
                </div>

                {/* Assigned Teachers / Admins list */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      Propriétaire(s) Teams :
                    </span>
                    <button
                      onClick={() => openAssignModal(t)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {assignedCount > 0 ? 'Gérer' : 'Assigner'}
                    </button>
                  </div>

                  {t.assignedTeachers && t.assignedTeachers.length > 0 ? (
                    <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-700 space-y-1.5">
                      {t.assignedTeachers.map((prof, idx) => {
                        const isAdmin = prof.email.toLowerCase().includes('mjoubin') || prof.email.toLowerCase().includes('admin');
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs gap-1.5 bg-slate-800/60 px-2 py-1 rounded-lg">
                            <div className="flex items-center gap-1.5 truncate">
                              {isAdmin ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Admin Office" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" title="Enseignant" />
                              )}
                              <span className="font-medium text-white truncate text-[11px]">{prof.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono">
                              {prof.email.split('@')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2 text-[11px] text-amber-300 flex items-center justify-between">
                      <span>Aucun propriétaire assigné</span>
                      <button
                        onClick={() => openAssignModal(t)}
                        className="font-bold underline text-amber-200 hover:text-white"
                      >
                        + Assigner
                      </button>
                    </div>
                  )}

                  {/* M365 ID if exists */}
                  {t.m365TeamId && (
                    <div className="pt-1 text-[10px] text-slate-500 font-mono truncate">
                      ID M365 : {t.m365TeamId}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                {!isRealOnM365 ? (
                  <button
                    onClick={() => handleExecuteProvision(t.id)}
                    disabled={isSyncing || isCurrentProvisioning}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/20"
                    title="Crée le groupe et active Teams réellement sur Microsoft 365"
                  >
                    {isCurrentProvisioning ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Création Teams...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Créer sur Teams
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => onSyncTeam(t)}
                    disabled={isSyncing}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync Membres
                  </button>
                )}

                <button
                  onClick={() => setSelectedTeam(t)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                >
                  Fiche
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Multi-Assignation d'Enseignants et Administrateurs Office */}
      {assigningTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between shrink-0">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Affectation Multi-Propriétaires
                </span>
                <h3 className="text-lg font-bold text-white mt-1 font-mono">
                  {assigningTeam.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cochez les professeurs et administrateurs Office qui seront propriétaires (owners) de cette équipe sur Teams.
                </p>
              </div>
              <button
                onClick={() => setAssigningTeam(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-click add buttons for Admins & mjoubin */}
            <div className="shrink-0 flex flex-wrap items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Ajouts rapides :</span>
              <button
                onClick={handleAddMjoubinToCurrentTeam}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                + Mikael JOUBIN (mjoubin@...)
              </button>
              <button
                onClick={handleAddAllAdminsToCurrentTeam}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 transition"
              >
                <UserPlus className="w-3 h-3 text-indigo-400" />
                + Tous les Admins Office
              </button>
            </div>

            {/* Currently Selected Badges */}
            <div className="shrink-0">
              <span className="text-xs text-slate-400 font-medium block mb-1.5">
                Propriétaires sélectionnés ({selectedTeacherIds.length}) :
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                {selectedTeacherIds.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">Aucun propriétaire sélectionné</span>
                ) : (
                  selectedTeacherIds.map(id => {
                    const u = users.find(user => user.id === id);
                    if (!u) return null;
                    const isAdmin = u.role === 'admin' || (u.email && (u.email.toLowerCase().includes('mjoubin') || u.email.toLowerCase().includes('admin@')));
                    return (
                      <span
                        key={id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          isAdmin
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40'
                        }`}
                      >
                        {isAdmin && <Shield className="w-3 h-3 text-amber-400" />}
                        {u.firstName} {u.lastName}
                        <button
                          onClick={() => toggleTeacherSelection(id)}
                          className="hover:text-red-400 ml-1 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Search & Tabs */}
            <div className="shrink-0 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou email (ex: joubin, lestang, admin)..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setStaffRoleFilter('all')}
                  className={`px-3 py-1 rounded-md transition ${staffRoleFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  Tous ({assignableStaff.length})
                </button>
                <button
                  onClick={() => setStaffRoleFilter('teachers')}
                  className={`px-3 py-1 rounded-md transition ${staffRoleFilter === 'teachers' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  Enseignants ({assignableStaff.filter(u => u.role === 'teacher').length})
                </button>
                <button
                  onClick={() => setStaffRoleFilter('admins')}
                  className={`px-3 py-1 rounded-md transition ${staffRoleFilter === 'admins' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  Admins Office ({adminStaff.length})
                </button>
              </div>
            </div>

            {/* Staff Checkbox List */}
            <div className="overflow-y-auto space-y-1 pr-1 flex-1 min-h-[160px]">
              {assignableStaff
                .filter((t) => {
                  if (staffRoleFilter === 'teachers' && t.role !== 'teacher') return false;
                  if (staffRoleFilter === 'admins' && !(t.role === 'admin' || t.email.toLowerCase().includes('mjoubin') || t.email.toLowerCase().includes('admin@'))) return false;

                  const q = teacherSearch.toLowerCase();
                  return (
                    t.lastName.toLowerCase().includes(q) ||
                    t.firstName.toLowerCase().includes(q) ||
                    t.email.toLowerCase().includes(q) ||
                    t.upn.toLowerCase().includes(q)
                  );
                })
                .slice(0, 50)
                .map((prof) => {
                  const isChecked = selectedTeacherIds.includes(prof.id);
                  const isAdmin = prof.role === 'admin' || prof.email.toLowerCase().includes('mjoubin') || prof.email.toLowerCase().includes('admin@');

                  return (
                    <div
                      key={prof.id}
                      onClick={() => toggleTeacherSelection(prof.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition select-none ${
                        isChecked
                          ? 'bg-indigo-600/25 border-indigo-500 text-white'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {prof.firstName} {prof.lastName}
                            {isAdmin ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Admin Office
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                                Enseignant
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{prof.email || prof.upn}</div>
                        </div>
                      </div>

                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {isChecked ? '✓ Sélectionné' : 'Ajouter'}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between shrink-0">
              <button
                onClick={() => setAssigningTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>

              <button
                onClick={handleSaveAssignments}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                Enregistrer ({selectedTeacherIds.length} propriétaire{selectedTeacherIds.length > 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Co-propriété Globale Admins Office */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                  <Shield className="w-3 h-3 text-amber-400" />
                  Supervision & Co-propriété Office 365
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">
                  Ajouter les Administrateurs en Co-propriétaires
                </h3>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cette opération ajoute les comptes administrateurs Office sélectionnés comme <strong>co-propriétaires (co-owners)</strong> sur les équipes Microsoft Teams, <strong>sans supprimer les professeurs actuels</strong>. Cela permet au service informatique d'assurer le support, la supervision et la maintenance des classes.
            </p>

            {/* Admin Accounts Checkboxes */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Comptes Administrateurs à associer :
              </span>
              {[
                { email: 'mjoubin@notredamedesmissions.com', label: 'Mikael JOUBIN (Responsable informatique)' },
                { email: 'admin@notredamedesmissions.com', label: 'Service Informatique NDM (Admin)' },
                { email: 'admin@notredamedesmissions.onmicrosoft.com', label: 'Admin Global Microsoft 365' },
              ].map(admin => {
                const isSelected = selectedAdminEmails.includes(admin.email);
                return (
                  <label key={admin.email} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedAdminEmails(prev =>
                          isSelected ? prev.filter(e => e !== admin.email) : [...prev, admin.email]
                        );
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 text-amber-600 bg-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-white">{admin.label}</div>
                      <div className="text-[11px] text-amber-300/80 font-mono">{admin.email}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Scope Selection */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-medium text-slate-400 block">Périmètre d'application :</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adminScope"
                  checked={adminScope === 'all'}
                  onChange={() => setAdminScope('all')}
                  className="w-4 h-4 text-amber-600 bg-slate-900 border-slate-700"
                />
                <span className="text-white">Toutes les équipes de l'établissement (<strong>{teams.length} équipes</strong>)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adminScope"
                  checked={adminScope === 'filtered'}
                  onChange={() => setAdminScope('filtered')}
                  className="w-4 h-4 text-amber-600 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">Uniquement les équipes filtrées ({filteredTeams.length} équipes)</span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteBulkAdmins}
                disabled={selectedAdminEmails.length === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/30 transition active:scale-95"
              >
                <Shield className="w-4 h-4" />
                Appliquer la Co-propriété
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import CSV Affectations (Classe;Matiere;Professeur) */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Import Grille Pronote / KoXo
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Affectation des Professeurs par Fichier (CSV)
                </h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Collez un export CSV contenant les colonnes : <code className="text-emerald-400 font-mono">Classe;Matière;EmailProfesseur</code> (séparateur point-virgule ou virgule).
            </p>

            <textarea
              rows={6}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={`Classe;Matiere;Professeur\n601;Français;marie.lestang@notredamedesmissions.com\n601;Mathématiques;guillaume.guedj@notredamedesmissions.com\nT01;Philosophie;gilles.eslinger@notredamedesmissions.com`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (csvContent.trim()) {
                    onImportAssignmentsCsv(csvContent);
                    setIsCsvModalOpen(false);
                    setCsvContent('');
                  }
                }}
                disabled={!csvContent.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
              >
                <Upload className="w-4 h-4" />
                Appliquer les affectations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fiche Équipe */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Fiche Équipe Teams
                </span>
                <h3 className="text-lg font-bold text-white mt-1 font-mono">
                  {selectedTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Classe :</span>
                <span className="font-bold text-white font-mono">{selectedTeam.classCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Matière :</span>
                <span className="font-semibold text-slate-200">{selectedTeam.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statut M365 :</span>
                <span className={`font-bold ${selectedTeam.m365TeamId ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedTeam.m365TeamId ? `Créée sur M365 (${selectedTeam.m365TeamId})` : 'En attente de création'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Élèves (Membres) :</span>
                <span className="font-semibold text-emerald-300">{selectedTeam.memberCount} élèves</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400">Propriétaire(s) (Owners) :</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTeam.assignedTeachers && selectedTeam.assignedTeachers.length > 0 ? (
                    selectedTeam.assignedTeachers.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                        {t.name} ({t.email})
                      </span>
                    ))
                  ) : (
                    <span className="text-amber-400 italic">Aucun propriétaire</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dernière synchronisation :</span>
                <span className="text-slate-300">{selectedTeam.lastSync ? new Date(selectedTeam.lastSync).toLocaleString('fr-FR') : 'Jamais'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const t = selectedTeam;
                  setSelectedTeam(null);
                  openAssignModal(t);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Gérer les propriétaires
              </button>

              {!selectedTeam.m365TeamId ? (
                <button
                  onClick={async () => {
                    await handleExecuteProvision(selectedTeam.id);
                    setSelectedTeam(null);
                  }}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Créer sur Teams maintenant
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSyncTeam(selectedTeam);
                    setSelectedTeam(null);
                  }}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Membres
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Création en Masse */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Création en masse Microsoft Teams</h3>
                  <p className="text-xs text-slate-400">Automatisation complète sans devoir créer les équipes une par une</p>
                </div>
              </div>
              <button
                onClick={() => !isBatchRunning && setIsBatchModalOpen(false)}
                disabled={isBatchRunning}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Traitement 100% automatisé inclus :
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Création du groupe unifié Microsoft 365 (`POST /groups`)</li>
                <li><strong>Activation de l'équipe Teams (`PUT /groups/team`)</strong> pour visibilité immédiate dans Teams</li>
                <li><strong>Application des restrictions membres strictes</strong> (aucun canal/app créé par les élèves)</li>
                <li>Ajout de tous les élèves de la classe (`PATCH /groups`)</li>
                <li>Attribution des co-propriétaires enseignants et administrateurs Office</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Périmètre de création :</label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:border-slate-600">
                  <input
                    type="radio"
                    name="batchScope"
                    value="class"
                    checked={batchScope === 'class'}
                    onChange={() => setBatchScope('class')}
                    disabled={isBatchRunning}
                    className="text-emerald-500"
                  />
                  <span>
                    <strong>Classe sélectionnée uniquement</strong> ({classFilter !== 'all' ? `Classe ${classFilter}` : 'Classe 101 par défaut'})
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer hover:border-slate-600">
                  <input
                    type="radio"
                    name="batchScope"
                    value="pending"
                    checked={batchScope === 'pending'}
                    onChange={() => setBatchScope('pending')}
                    disabled={isBatchRunning}
                    className="text-emerald-500"
                  />
                  <span>
                    <strong>Toutes les équipes en attente</strong> ({teams.filter(t => !t.m365TeamId).length} équipes non encore créées)
                  </span>
                </label>
              </div>
            </div>

            {batchProgress && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-300">Progression : {batchProgress.current} / {batchProgress.total}</span>
                  <span className="text-emerald-400 font-bold">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
                <div className="text-slate-400 truncate">
                  En cours : <span className="text-white font-mono">{batchProgress.teamName}</span>
                </div>
                <div className="flex gap-3 text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-semibold">{batchProgress.successCount} réussies</span>
                  {batchProgress.failedCount > 0 && (
                    <span className="text-rose-400 font-semibold">{batchProgress.failedCount} échecs</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                disabled={isBatchRunning}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={handleStartBatchProvision}
                disabled={isBatchRunning}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                {isBatchRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Lancer la création en masse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restrictions Membres */}
      {isRestrictionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Autorisations des membres (Restrictions Teams)</h3>
                  <p className="text-xs text-slate-400">Paramétrage strict conforme au cahier des charges pédagogique</p>
                </div>
              </div>
              <button
                onClick={() => setIsRestrictionsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ces restrictions sont automatiquement injectées dans chaque équipe lors de sa création. Vous pouvez également les ré-appliquer sur l'ensemble des équipes déjà existantes :
            </p>

            {/* Checklist exactly matching user screenshot */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs text-slate-300">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                Autorisations des membres
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à créer et mettre à jour des canaux (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60 pl-6">
                <Square className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-400">Autoriser les membres à créer des canaux privés (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à supprimer et restaurer des canaux (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à ajouter et supprimer des applications (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à charger des applications personnalisées (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à créer, mettre à jour et supprimer des onglets (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Les propriétaires peuvent supprimer tous les messages (Activé)</span>
              </div>

              <div className="flex items-center gap-2.5 opacity-60">
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Autoriser les membres à créer, mettre à jour et supprimer des connecteurs (Désactivé)</span>
              </div>

              <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Autoriser les membres à créer, modifier et supprimer des balises (Activé)</span>
              </div>

              <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Autoriser les membres à supprimer leurs messages (Activé)</span>
              </div>

              <div className="flex items-center gap-2.5 text-emerald-400 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Autoriser les membres à modifier leurs messages (Activé)</span>
              </div>
            </div>

            {enforceResult && (
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-purple-200">
                {enforceResult}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRestrictionsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={handleApplyRestrictionsAll}
                disabled={isEnforcingRestrictions}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition"
              >
                {isEnforcingRestrictions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Application en cours...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Appliquer sur toutes les équipes Teams actives
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
