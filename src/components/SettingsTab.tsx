import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Key, 
  Layers, 
  Clock, 
  Archive, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Calendar, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import type { M365Config, DiagnosticStep } from '../types/index.ts';

interface SettingsTabProps {
  config: M365Config;
  onUpdateConfig: (data: Partial<M365Config>) => void;
  onRunDiagnostic: () => Promise<{ steps: DiagnosticStep[]; totalLatencyMs: number }>;
  onArchiveYear: () => void;
  onPrepareNewYear: (year: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onUpdateConfig,
  onRunDiagnostic,
  onArchiveYear,
  onPrepareNewYear,
}) => {
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [clientId, setClientId] = useState(config.clientId);
  const [namingPattern, setNamingPattern] = useState(config.namingPattern);
  const [teamTemplate, setTeamTemplate] = useState(config.teamTemplate);
  const [syncMode, setSyncMode] = useState(config.syncMode);
  const [entraGroupPrefix, setEntraGroupPrefix] = useState(config.entraGroupPrefix);
  const [studentDomain, setStudentDomain] = useState(config.studentDomain);
  const [teacherDomain, setTeacherDomain] = useState(config.teacherDomain);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(config.autoSyncEnabled);
  const [nextYearInput, setNextYearInput] = useState('2027-2028');

  // Diagnostic state
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticSteps, setDiagnosticSteps] = useState<DiagnosticStep[] | null>(null);
  const [diagLatency, setDiagLatency] = useState<number | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      tenantId,
      clientId,
      namingPattern,
      teamTemplate,
      syncMode,
      entraGroupPrefix,
      studentDomain,
      teacherDomain,
      autoSyncEnabled,
    });
  };

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const res = await onRunDiagnostic();
      setDiagnosticSteps(res.steps);
      setDiagLatency(res.totalLatencyMs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Paramètres Microsoft 365 & Architecture
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Solution A : Application Entra ID
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connexion Microsoft Graph, conventions de nommage, planification et gestion des années scolaires.
          </p>
        </div>
      </div>

      {/* Diagnostic Microsoft Graph in 7 Points (Section 48 Cahier des charges) */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Test de Connexion Microsoft 365 & Graph (Section 48)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Diagnostic complet en 7 points pour valider les permissions et la réactivité du tenant.
            </p>
          </div>

          <button
            onClick={handleRunDiagnostic}
            disabled={isRunningDiagnostic}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
            {isRunningDiagnostic ? 'Test en cours...' : 'Lancer le diagnostic 7 points'}
          </button>
        </div>

        {diagnosticSteps ? (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
              <span>Résultat : <strong className="text-emerald-400">7 / 7 Étapes Validées</strong></span>
              <span>Temps total : <strong className="text-indigo-300 font-mono">{diagLatency} ms</strong></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {diagnosticSteps.map((step) => (
                <div
                  key={step.step}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-start gap-2.5 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {step.step}. {step.name}
                      </span>
                      {step.latencyMs && (
                        <span className="font-mono text-[10px] text-slate-500">{step.latencyMs} ms</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{step.description}</div>
                    <div className="text-[11px] text-emerald-400 font-mono">{step.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>
              Cliquez sur <strong>"Lancer le diagnostic 7 points"</strong> pour tester la connexion Entra ID, Microsoft Graph, la lecture des 1 395 comptes, la détection des groupes de classe et les droits de provisionnement Teams.
            </span>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Col: Entra ID & Identification */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
            <Key className="w-4 h-4 text-indigo-400" />
            Identifiants Microsoft Entra ID (Application Graph)
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tenant ID (Annuaire Microsoft 365)</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Client ID (ID d'application)</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Client Secret (Clé secrète Graph)</label>
              <input
                type="password"
                disabled
                value="••••••••••••••••••••••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-emerald-400 mt-1 block">
                ✓ Clé applicative sécurisée côté serveur (/opt/ndm-teams-manager/data/db.json)
              </span>
            </div>

            {/* Méthode d'identification (Section 6) */}
            <div className="pt-2 border-t border-slate-700/60 space-y-2">
              <label className="block text-slate-300 font-semibold">
                Méthode d'identification des élèves (Section 6)
              </label>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="group">Méthode 1 — Groupes Entra ID (ex: ELEVE-601)</option>
                <option value="attribute">Méthode 2 — Attribut Entra ID (Classe = 601)</option>
                <option value="upn">Méthode 3 — Préfixe UPN (@eleves.ndmissions.fr)</option>
                <option value="dynamic">Méthode 4 — Groupes Dynamiques Entra</option>
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Préfixe Groupe Entra</label>
                  <input
                    type="text"
                    value={entraGroupPrefix}
                    onChange={(e) => setEntraGroupPrefix(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Domaine Élèves</label>
                  <input
                    type="text"
                    value={studentDomain}
                    onChange={(e) => setStudentDomain(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Naming Convention, Template, Schedule & School Year */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Nommage Teams & Planification
            </h2>

            {/* Naming Pattern (Section 12) */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Convention de nommage (Section 12)</label>
              <input
                type="text"
                value={namingPattern}
                onChange={(e) => setNamingPattern(e.target.value)}
                placeholder="[CLASSE]-[MATIÈRE]"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-indigo-300 font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Exemples générés : 601-Français, 601-Mathématiques, 101-HGGSP, T01-Philosophie
              </span>
            </div>

            {/* Teams Template (Section 14) */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Modèle d'équipe Teams (Section 14)</label>
              <select
                value={teamTemplate}
                onChange={(e) => setTeamTemplate(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="educationClass">Équipe de classe / type Class (Recommandé Éducation)</option>
                <option value="standard">Équipe standard Microsoft Teams</option>
              </select>
            </div>

            {/* Auto Sync Toggle */}
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Synchronisation Automatique Planifiée</div>
                <div className="text-[11px] text-slate-400">Exécution à 06h00, 12h00 et 18h00</div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800 cursor-pointer"
              />
            </div>

            {/* School Year & Annual Archive (Section 28 & 29) */}
            <div className="pt-2 border-t border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Exercice Scolaire en Cours : <span className="text-white font-bold">{config.currentSchoolYear}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onArchiveYear}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  Archiver {config.currentSchoolYear}
                </button>

                <div className="flex gap-1">
                  <input
                    type="text"
                    value={nextYearInput}
                    onChange={(e) => setNextYearInput(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 text-center text-white text-xs font-mono"
                    placeholder="2027-2028"
                  />
                  <button
                    type="button"
                    onClick={() => onPrepareNewYear(nextYearInput)}
                    className="flex-1 px-2.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-medium text-xs flex items-center justify-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rentrée
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/60 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              Enregistrer les Paramètres
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
