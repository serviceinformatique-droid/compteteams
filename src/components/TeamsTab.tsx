import React, { useState } from 'react';
import { 
  MessagesSquare, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Archive,
  ExternalLink,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import type { TeamItem, ClassItem } from '../types/index.ts';

interface TeamsTabProps {
  teams: TeamItem[];
  classes: ClassItem[];
  onSyncTeam: (team: TeamItem) => void;
  onUpdateTeam: (id: string, teamData: Partial<TeamItem>) => void;
  isSyncing: boolean;
}

export const TeamsTab: React.FC<TeamsTabProps> = ({
  teams,
  classes,
  onSyncTeam,
  onUpdateTeam,
  isSyncing,
}) => {
  const [search, setSearch] = useState('');
  const [managedFilter, setManagedFilter] = useState<'all' | 'auto' | 'manual'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);

  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.classCode.toLowerCase().includes(search.toLowerCase()) ||
      t.subjectName.toLowerCase().includes(search.toLowerCase());

    const matchManaged =
      managedFilter === 'all'
        ? true
        : managedFilter === 'auto'
        ? t.autoManaged
        : !t.autoManaged;

    const matchClass = classFilter === 'all' || t.classCode === classFilter;

    return matchSearch && matchManaged && matchClass;
  });

  const autoManagedCount = teams.filter((t) => t.autoManaged).length;
  const manualCount = teams.filter((t) => !t.autoManaged).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Équipes Microsoft Teams ({teams.length})
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Convention : [CLASSE]-[MATIÈRE]
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Modèle Teams Class Education. Protection stricte des équipes créées manuellement (Section 27).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Automatiques : <strong className="text-emerald-400">{autoManagedCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Manuelles protégées : <strong className="text-amber-400">{manualCount}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher équipe (ex: 601-Français, HGGSP)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Managed Filter */}
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => setManagedFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                managedFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes ({teams.length})
            </button>
            <button
              onClick={() => setManagedFilter('auto')}
              className={`px-3 py-1 rounded-md transition ${
                managedFilter === 'auto' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gestion Auto ({autoManagedCount})
            </button>
            <button
              onClick={() => setManagedFilter('manual')}
              className={`px-3 py-1 rounded-md transition ${
                managedFilter === 'manual' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manuelles ({manualCount})
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
                Classe {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((t) => (
          <div
            key={t.id}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition hover:border-indigo-500/60 shadow-sm"
          >
            <div>
              {/* Top status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <MessagesSquare className="w-4 h-4 text-indigo-400" />
                  {t.name}
                </span>

                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.autoManaged
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {t.autoManaged ? 'Auto NDM' : 'Manuelle'}
                </span>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Matière :</span>
                  <span className="font-medium text-slate-200">{t.subjectName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Classe :</span>
                  <span className="font-mono text-slate-200">{t.classCode}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Membres / Élèves :</span>
                  <span className="text-slate-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <strong>{t.memberCount}</strong> élèves
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Enseignant(s) :</span>
                  <span className="text-slate-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    {t.teacherCount} prof
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
              <button
                onClick={() => onSyncTeam(t)}
                disabled={isSyncing || !t.autoManaged}
                title={t.autoManaged ? "Synchroniser cette équipe (Section 55)" : "Équipe manuelle protégée"}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  t.autoManaged
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                Sync Équipe
              </button>

              <div className="flex items-center gap-1">
                {/* Toggle Auto Managed flag (Section 27) */}
                <button
                  onClick={() => onUpdateTeam(t.id, { autoManaged: !t.autoManaged })}
                  title={t.autoManaged ? "Protéger (Désactiver gestion auto)" : "Activer la gestion auto"}
                  className={`p-1.5 rounded-lg transition ${
                    t.autoManaged
                      ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                      : 'text-amber-400 hover:text-emerald-400 hover:bg-slate-700'
                  }`}
                >
                  {t.autoManaged ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setSelectedTeam(t)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                >
                  Fiche
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Fiche Équipe (Section 34 Cahier des charges) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Fiche Équipe Teams (Section 34)
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
                <span className="text-slate-400">Année Scolaire :</span>
                <span className="text-slate-200">{selectedTeam.schoolYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enseignants (Propriétaires) :</span>
                <span className="font-semibold text-indigo-300">{selectedTeam.teacherCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Élèves (Membres) :</span>
                <span className="font-semibold text-emerald-300">{selectedTeam.memberCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gestion Automatique (Section 27) :</span>
                <span className={`font-bold ${selectedTeam.autoManaged ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedTeam.autoManaged ? 'OUI (Synchronisé par NDM)' : 'NON (Équipe manuelle protégée)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dernière synchronisation :</span>
                <span className="text-slate-300">{new Date(selectedTeam.lastSync || Date.now()).toLocaleString('fr-FR')}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  onUpdateTeam(selectedTeam.id, { autoManaged: !selectedTeam.autoManaged });
                  setSelectedTeam({ ...selectedTeam, autoManaged: !selectedTeam.autoManaged });
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Basculer Gestion Automatique (OUI / NON)
              </button>

              <button
                onClick={() => {
                  onSyncTeam(selectedTeam);
                  setSelectedTeam(null);
                }}
                disabled={!selectedTeam.autoManaged || isSyncing}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Synchroniser maintenant
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
