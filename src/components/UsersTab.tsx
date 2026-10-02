import React, { useState, useRef } from 'react';
import { 
  Users, 
  GraduationCap, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Edit3, 
  Mail, 
  Shield, 
  BookOpen, 
  X, 
  Layers, 
  Sparkles, 
  RefreshCw,
  Upload,
  UserPlus,
  Trash2,
  FileSpreadsheet,
  Download,
  Key
} from 'lucide-react';
import type { UserItem, ClassItem, SubjectItem } from '../types/index.ts';

interface UsersTabProps {
  users: UserItem[];
  classes: ClassItem[];
  subjects: SubjectItem[];
  onUpdateUser: (id: string, user: Partial<UserItem>) => void;
  onPullM365: () => void;
  onPurgeDemo: () => void;
  isPullingM365: boolean;
  onImportCsv: (csvContent: string) => Promise<any>;
  onCreateUser: (user: Partial<UserItem>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  classes,
  subjects,
  onUpdateUser,
  onPullM365,
  onPurgeDemo,
  isPullingM365,
  onImportCsv,
  onCreateUser,
  onDeleteUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'anomaly'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student' as 'student' | 'teacher',
    classCode: '601',
  });

  const lyceeSpecialties = [
    'Mathématiques',
    'Physique-Chimie',
    'SVT',
    'SES',
    'HGGSP',
    'HLP',
    'NSI',
    'LLCER',
  ];

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.upn.toLowerCase().includes(search.toLowerCase()) ||
      (u.classCode && u.classCode.toLowerCase().includes(search.toLowerCase()));

    const matchRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'anomaly'
        ? u.status === 'anomaly'
        : u.role === roleFilter;

    const matchClass = classFilter === 'all' || u.classCode === classFilter;

    return matchSearch && matchRole && matchClass;
  });

  const studentsCount = users.filter((u) => u.role === 'student').length;
  const teachersCount = users.filter((u) => u.role === 'teacher').length;
  const anomaliesCount = users.filter((u) => u.status === 'anomaly').length;

  const handleClassChange = (newClassCode: string) => {
    if (!selectedUser) return;
    onUpdateUser(selectedUser.id, { classCode: newClassCode });
    setSelectedUser({ ...selectedUser, classCode: newClassCode });
  };

  const handleToggleSpecialty = (speName: string) => {
    if (!selectedUser) return;
    const current = selectedUser.specialties || [];
    let updated: string[];
    if (current.includes(speName)) {
      updated = current.filter((s) => s !== speName);
    } else {
      updated = [...current, speName];
    }
    onUpdateUser(selectedUser.id, { specialties: updated });
    setSelectedUser({ ...selectedUser, specialties: updated });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteCsvImport = async () => {
    if (!csvText.trim()) return;
    setIsImportingCsv(true);
    try {
      await onImportCsv(csvText);
      setIsCsvModalOpen(false);
      setCsvText('');
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleGenerateSampleCsv = () => {
    const sample = `Nom;Prénom;Email;Classe;Rôle
Martin;Lucas;lucas.martin@notredamedesmissions.com;601;Élève
Bernard;Emma;emma.bernard@notredamedesmissions.com;601;Élève
Dubois;Thomas;thomas.dubois@notredamedesmissions.com;201;Élève
Dupont;Jean;jean.dupont@ndmissions.fr;601;Enseignant
Mercier;Claire;claire.mercier@ndmissions.fr;201;Enseignant`;
    setCsvText(sample);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.firstName || !newUserForm.lastName) return;
    const email = newUserForm.email || `${newUserForm.firstName.toLowerCase()}.${newUserForm.lastName.toLowerCase()}@notredamedesmissions.com`;
    await onCreateUser({
      ...newUserForm,
      email,
      upn: email,
    });
    setIsAddUserModalOpen(false);
    setNewUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'student',
      classCode: '601',
    });
  };

  const handleDeleteCurrent = async () => {
    if (!selectedUser) return;
    if (confirm(`Confirmer la suppression définitive de ${selectedUser.firstName} ${selectedUser.lastName} ?`)) {
      await onDeleteUser(selectedUser.id);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Annuaire Utilisateurs & Synchronisation
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Serveur & Réel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Comptes réels Microsoft Entra ID ou importés par fichier officiel (Pronote / SIÈCLE / CSV). Aucun faux compte de démo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            Total : <span className="font-bold text-white">{users.length} comptes</span>
          </div>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Importer CSV / Pronote
          </button>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            Ajouter un compte
          </button>

          <button
            onClick={onPullM365}
            disabled={isPullingM365}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingM365 ? 'animate-spin' : ''}`} />
            {isPullingM365 ? 'Synchronisation Entra ID...' : 'Synchroniser Entra ID'}
          </button>

          {users.length > 0 && (
            <button
              onClick={onPurgeDemo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700 transition"
              title="Vider tous les comptes"
            >
              Purger
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher élève, enseignant, UPN, classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                roleFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1 rounded-md transition ${
                roleFilter === 'student' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Élèves ({studentsCount})
            </button>
            <button
              onClick={() => setRoleFilter('teacher')}
              className={`px-3 py-1 rounded-md transition ${
                roleFilter === 'teacher' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Enseignants ({teachersCount})
            </button>
            <button
              onClick={() => setRoleFilter('anomaly')}
              className={`px-3 py-1 rounded-md transition ${
                roleFilter === 'anomaly' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Anomalies ({anomaliesCount})
            </button>
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} ({c.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout: List + Detail Drawer */}
      {filteredUsers.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-10 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {users.length === 0 ? 'Annuaire initialisé : 0 compte de démonstration' : 'Aucun utilisateur ne correspond à votre filtre'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              {users.length === 0
                ? 'Conformément à vos exigences, tous les comptes fictifs ont été supprimés. Vous pouvez importer vos élèves et professeurs réels selon 2 méthodes :'
                : 'Modifiez vos critères de recherche ou réinitialisez le filtre ci-dessus.'}
            </p>
          </div>

          {users.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2 text-left">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Méthode 1 : Fichier CSV / Pronote
                </div>
                <p className="text-[11px] text-slate-400">
                  Importez la liste réelle de vos 37 classes (Nom, Prénom, Email, Classe, Rôle).
                </p>
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition active:scale-95 text-center"
                >
                  Importer un fichier CSV
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  Méthode 2 : Microsoft Entra ID
                </div>
                <p className="text-[11px] text-slate-400">
                  Synchronisation directe depuis votre tenant Microsoft 365 (via Graph API).
                </p>
                <button
                  onClick={onPullM365}
                  disabled={isPullingM365}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition active:scale-95 text-center"
                >
                  {isPullingM365 ? 'Connexion en cours...' : 'Synchroniser Entra ID'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Users Table */}
          <div className={`${selectedUser ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Classe</th>
                    <th className="py-3 px-4">Spécialités / Affectations</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Fiche</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === 'teacher' ? 'bg-indigo-600/30 text-indigo-400' : 'bg-blue-600/30 text-blue-400'
                          }`}>
                            {(u.firstName[0] || 'U')}{(u.lastName[0] || '')}
                          </div>
                          <div>
                            <div>{u.firstName} {u.lastName}</div>
                            <div className="text-[11px] font-mono text-slate-400">{u.upn}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'teacher'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role === 'teacher' ? 'Enseignant' : 'Élève'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {u.classCode ? (
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {u.classCode}
                          </span>
                        ) : (
                          <span className="text-amber-400 italic">Non renseignée</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.role === 'teacher' ? (
                          <span className="text-[11px] text-indigo-300">
                            {u.teachingSubjects?.length || 1} groupe(s)
                          </span>
                        ) : u.specialties && u.specialties.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.specialties.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Tronc commun standard</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> À vérifier
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white transition text-[11px]"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Drawer */}
          {selectedUser && (
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 space-y-5 h-fit shadow-md">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    {(selectedUser.firstName[0] || 'U')}{(selectedUser.lastName[0] || '')}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedUser.upn}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDeleteCurrent}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                    title="Supprimer l'utilisateur"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Class Assignment */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Affectation de Classe (Section 17)
                </label>
                <select
                  value={selectedUser.classCode || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- Sans classe affectée --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.code}>
                      Classe {c.code} ({c.name})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Tout changement de classe déclenche le transfert automatique vers les équipes Teams associées.
                </p>
              </div>

              {/* Specialties for Lycée */}
              {selectedUser.role === 'student' && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-300">
                    Spécialités Lycée (Première & Terminale)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {lyceeSpecialties.map((spe) => {
                      const isSelected = selectedUser.specialties?.includes(spe);
                      return (
                        <button
                          key={spe}
                          onClick={() => handleToggleSpecialty(spe)}
                          className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left transition ${
                            isSelected
                              ? 'bg-purple-600/30 border-purple-500/60 text-purple-200'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{spe}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Expected Teams */}
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                <span className="block text-xs font-semibold text-slate-300">
                  Équipes Teams associées
                </span>
                <div className="space-y-1 text-xs">
                  {selectedUser.classCode ? (
                    <>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                        {selectedUser.classCode}-Français
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                        {selectedUser.classCode}-Histoire-Géographie
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                        {selectedUser.classCode}-Anglais
                      </div>
                      {selectedUser.specialties?.map((spe) => (
                        <div key={spe} className="p-2 rounded bg-purple-950/40 border border-purple-800/40 text-purple-300 font-bold">
                          {selectedUser.classCode}-{spe} (Spécialité)
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-amber-400 italic text-xs">Veuillez affecter une classe.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Importer des comptes réels (CSV / Pronote / SIÈCLE)</h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Collez le contenu d'un fichier CSV ou sélectionnez un fichier (séparateurs acceptés : virgule, point-virgule ou tabulation).
            </p>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5" />
                Choisir un fichier CSV...
              </button>
              <button
                type="button"
                onClick={handleGenerateSampleCsv}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                Charger exemple CSV
              </button>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Nom;Prénom;Email;Classe;Rôle&#10;Martin;Lucas;lucas.martin@notredamedesmissions.com;601;Élève&#10;Dupont;Jean;jean.dupont@ndmissions.fr;601;Enseignant"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteCsvImport}
                disabled={!csvText.trim() || isImportingCsv}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition"
              >
                {isImportingCsv ? 'Importation...' : 'Importer dans l\'annuaire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateUserSubmit} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Ajouter un compte</h3>
              </div>
              <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email / UPN (Optionnel - généré auto)</label>
                <input
                  type="email"
                  placeholder="prenom.nom@notredamedesmissions.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Rôle</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="student">Élève</option>
                    <option value="teacher">Enseignant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Classe</label>
                  <select
                    value={newUserForm.classCode}
                    onChange={(e) => setNewUserForm({ ...newUserForm, classCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Enregistrer le compte
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
