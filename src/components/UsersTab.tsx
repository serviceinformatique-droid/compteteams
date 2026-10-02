import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import type { UserItem, ClassItem, SubjectItem } from '../types/index.ts';

interface UsersTabProps {
  users: UserItem[];
  classes: ClassItem[];
  subjects: SubjectItem[];
  onUpdateUser: (id: string, user: Partial<UserItem>) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  classes,
  subjects,
  onUpdateUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'anomaly'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Specialties available for Lycée (1ère & Terminale)
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Utilisateurs Microsoft 365 (Entra ID)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Source Unique M365
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Élèves & Enseignants synchronisés depuis le tenant Notre-Dame des Missions. Aucun compte créé en local.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
            Total indexé : <span className="font-bold text-white">1 395 comptes</span>
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Users Table (2 Cols on Desktop) */}
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
                            {u.firstName[0]}{u.lastName[0]}
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
                        {u.role === 'student' ? (
                          u.specialties && u.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.specialties.map((spe) => (
                                <span key={spe} className="px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 text-[10px] border border-purple-800/60">
                                  {spe}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Tronc commun</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {u.teachingSubjects?.length || 0} matière(s) assignée(s)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.status === 'anomaly' ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Anomalie
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                        >
                          Fiche
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fiche Utilisateur / Élève / Enseignant (Conforme Section 33 Cahier des charges) */}
        {selectedUser && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedUser.role === 'teacher' ? 'Fiche Enseignant' : 'Fiche Élève (NDM)'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <p className="text-xs font-mono text-slate-400">{selectedUser.upn}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compte M365 Info */}
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Identifiant Entra ID :</span>
                <span className="font-mono text-slate-200">{selectedUser.m365Id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statut M365 :</span>
                <span className="text-emerald-400 font-medium">Actif (Licence Education A3)</span>
              </div>
              {selectedUser.anomalyNote && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {selectedUser.anomalyNote}
                </div>
              )}
            </div>

            {/* Student Section: Class Changer (Section 17 Cahier des charges) */}
            {selectedUser.role === 'student' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Classe Attribuée</span>
                  <span className="text-[11px] text-slate-400">Section 17 : Changement auto</span>
                </div>
                <select
                  value={selectedUser.classCode || ''}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Sélectionner une classe...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} - {c.name} ({c.level} • {c.section})
                    </option>
                  ))}
                </select>

                {/* Spécialités Lycée (Section 11 Cahier des charges) */}
                {(selectedUser.classCode?.startsWith('10') || selectedUser.classCode?.startsWith('T0') || selectedUser.classCode?.startsWith('20')) && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Spécialités Lycée Choisies</span>
                      <span className="text-[10px] text-purple-400 font-medium">Section 11</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      L'élève ne sera ajouté <strong>qu'aux équipes de spécialité cochées</strong> ci-dessous :
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {lyceeSpecialties.map((spe) => {
                        const isChecked = selectedUser.specialties?.includes(spe);
                        return (
                          <button
                            key={spe}
                            type="button"
                            onClick={() => handleToggleSpecialty(spe)}
                            className={`p-2 rounded-lg text-[11px] font-medium text-left border transition flex items-center justify-between ${
                              isChecked
                                ? 'bg-purple-900/40 text-purple-200 border-purple-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            <span>{spe}</span>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Projected Teams for this student */}
                <div className="pt-2 border-t border-slate-700/60 space-y-2">
                  <span className="text-xs font-semibold text-white">Équipes Teams Automatiques</span>
                  <div className="space-y-1 text-xs font-mono max-h-40 overflow-y-auto pr-1">
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
                      <div className="text-amber-400 italic text-xs">Veuillez renseigner la classe.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Section: Assigned subjects (Section 19) */}
            {selectedUser.role === 'teacher' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Enseignements Attribués (Section 19)</span>
                  <span className="text-[11px] text-indigo-400">Rôle : Propriétaire</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {selectedUser.teachingSubjects?.map((ts, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between"
                    >
                      <span className="font-mono font-bold text-white">{ts.classCode}-{ts.subjectName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Classe {ts.classCode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
