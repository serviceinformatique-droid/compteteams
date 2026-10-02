import React from 'react';
import { 
  Building2, 
  RefreshCw, 
  Play, 
  ShieldCheck, 
  Menu, 
  X,
  Server,
  AlertTriangle,
  FolderGit2
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSimulation: () => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  schoolYear: string;
  anomaliesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSimulation,
  onQuickSync,
  isSyncing,
  schoolYear,
  anomaliesCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'classes', label: 'Classes (37)' },
    { id: 'subjects', label: 'Matières' },
    { id: 'users', label: 'Élèves & Profs' },
    { id: 'teams', label: 'Équipes Teams' },
    { id: 'anomalies', label: 'Anomalies', badge: anomaliesCount > 0 ? anomaliesCount : null },
    { id: 'logs', label: 'Journal' },
    { id: 'settings', label: 'M365 & Config' },
    { id: 'deployment', label: 'Déploiement LXC / Git', highlight: true },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
              NDM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base sm:text-lg tracking-tight">Notre-Dame des Missions</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block">
                  Teams Manager
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-indigo-400" />
                Collège & Lycée • Année {schoolYear}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onOpenSimulation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Lancer une simulation sans modifier Teams"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              Mode Simulation
            </button>

            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser Teams'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={onOpenSimulation}
              className="p-1.5 rounded-lg bg-slate-800 text-amber-400 border border-slate-700"
              title="Mode Simulation"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex space-x-1 overflow-x-auto py-1 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
                    : item.highlight
                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.id === 'deployment' && <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />}
                {item.label}
                {item.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          <div className="flex gap-2 py-2 mb-2 border-b border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSimulation();
              }}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700"
            >
              <Play className="w-3.5 h-3.5" /> Simulation
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onQuickSync();
              }}
              disabled={isSyncing}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Teams
            </button>
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.id === 'deployment' && <FolderGit2 className="w-4 h-4 text-emerald-400" />}
                {item.label}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-900">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
