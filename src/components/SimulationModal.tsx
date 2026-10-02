import React, { useState } from 'react';
import { 
  X, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  UserPlus, 
  UserMinus, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import type { SimulationResult } from '../types/index.ts';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult | null;
  loading: boolean;
  onExecuteSync: () => void;
  isExecuting: boolean;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  simulation,
  loading,
  onExecuteSync,
  isExecuting,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'create' | 'add' | 'remove' | 'anomalies'>('all');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Play className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Mode Simulation Différentielle</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AUCUNE MODIFICATION RÉELLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Analyse comparative des élèves attendus vs équipes Microsoft Teams actuelles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">Calcul du delta différentiel Microsoft Graph...</p>
              <p className="text-xs text-slate-500">Comparaison des 1 395 comptes M365 et des 412 équipes Teams</p>
            </div>
          ) : simulation ? (
            <>
              {/* Summary KPIs - Conforme Section 22 Cahier des charges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Équipes à créer</span>
                    <PlusCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400 mt-1">{simulation.teamsToCreateCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{simulation.teamsExistingCount} déjà existantes (conservées)</div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Élèves à ajouter</span>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">+{simulation.membersToAddCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{simulation.membersExistingCount} déjà en place (inchangés)</div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Élèves à retirer</span>
                    <UserMinus className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">-{simulation.membersToRemoveCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Changements de classe / groupe</div>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Principe différentiel strict :</strong> Seules les modifications ci-dessous seront appliquées sur Microsoft Teams. 
                  Les 1 223 affectations déjà existantes et conformes ne subiront aucun appel API inutile.
                </div>
              </div>

              {/* Sub-tabs Filter for Details */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveSubTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSubTab === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Toutes les actions ({simulation.actionsList.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('create')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSubTab === 'create'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Créations d'équipes ({simulation.teamsToCreate.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('add')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSubTab === 'add'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Ajouts de membres ({simulation.membersToAdd.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('remove')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSubTab === 'remove'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Retraits de membres ({simulation.membersToRemove.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('anomalies')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeSubTab === 'anomalies'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Anomalies ({simulation.anomalies.length})
                </button>
              </div>

              {/* Detailed Action List (Conforme Section 22 Cahier des charges) */}
              <div className="space-y-2">
                
                {/* 1. All or Additions */}
                {(activeSubTab === 'all' || activeSubTab === 'add') &&
                  simulation.membersToAdd.map((m, idx) => (
                    <div
                      key={`add-${idx}`}
                      className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                          +
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>{m.userName}</span>
                            <span className="text-slate-400 font-normal">({m.userRole})</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-mono font-medium">{m.teamName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{m.reason} • {m.upn}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        AJOUT DIFFÉRENTIEL
                      </span>
                    </div>
                  ))}

                {/* 2. All or Removals */}
                {(activeSubTab === 'all' || activeSubTab === 'remove') &&
                  simulation.membersToRemove.map((m, idx) => (
                    <div
                      key={`rem-${idx}`}
                      className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                          -
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>{m.userName}</span>
                            <span className="text-slate-400 font-normal">({m.userRole})</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-amber-300 font-mono font-medium">{m.teamName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{m.reason} • {m.upn}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        RETRAIT
                      </span>
                    </div>
                  ))}

                {/* 3. All or Creations */}
                {(activeSubTab === 'all' || activeSubTab === 'create') &&
                  simulation.teamsToCreate.map((t, idx) => (
                    <div
                      key={`cre-${idx}`}
                      className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                          +
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-2">
                            <span>Créer Équipe Teams :</span>
                            <span className="text-blue-300 font-mono font-bold">{t.name}</span>
                            <span className="text-slate-400 font-normal">(Classe {t.classCode} • {t.subjectName})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{t.reason} • Modèle Class Education</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        CRÉATION ÉQUIPE
                      </span>
                    </div>
                  ))}

                {/* 4. Anomalies */}
                {(activeSubTab === 'all' || activeSubTab === 'anomalies') &&
                  simulation.anomalies.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-rose-200">{a.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{a.description}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        NON BLOQUANT
                      </span>
                    </div>
                  ))}

              </div>
            </>
          ) : null}

        </div>

        {/* Modal Footer with Confirmation Safety Check */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
            />
            <span>J'ai vérifié la simulation et confirme l'application sur Microsoft Teams</span>
          </label>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onExecuteSync();
                onClose();
              }}
              disabled={!confirmed || isExecuting}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isExecuting ? 'Application en cours...' : 'Appliquer les modifications Teams'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
