import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  SendHorizontal,
  Lightbulb,
  FileSpreadsheet,
  Download,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Video,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'crm' | 'live' | 'form' | 'matriz' | 'relatorio';
  onSelectTab: (tab: 'crm' | 'live' | 'form' | 'matriz' | 'relatorio') => void;
  onNewInterview: () => void;
  onOpenMeetModal: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onResetSeed: () => void;
  totalInterviews: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onNewInterview,
  onOpenMeetModal,
  onExportCsv,
  onExportJson,
  onResetSeed,
  totalInterviews,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo e Branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-lg font-['Plus_Jakarta_Sans']">
                  Hiper<span className="text-indigo-400">Reforço</span>
                </span>
                <span className="rounded-full bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-300 uppercase">
                  Pilar Estratégia
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Caderno de Validação Needs-First · CRM & Evidências de Campo
              </p>
            </div>
          </div>

          {/* Navegação de Abas */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('crm')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'crm'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">CRM & Funil</span>
              <span className="ml-1 rounded-full bg-slate-900/80 px-1.5 py-0.2 text-[10px] font-mono text-indigo-200">
                {totalInterviews}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('live')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'live'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="h-4 w-4 text-emerald-400" />
              <span className="hidden md:inline">Checklist Ao Vivo</span>
              <span className="md:hidden">Ao Vivo</span>
            </button>

            <button
              onClick={() => onSelectTab('form')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'form'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SendHorizontal className="h-4 w-4 text-sky-400" />
              <span className="hidden md:inline">Enviar Formulário</span>
              <span className="md:hidden">Formulário</span>
            </button>

            <button
              onClick={() => onSelectTab('matriz')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'matriz'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="hidden lg:inline">Hipóteses H1-H6</span>
              <span className="lg:hidden">Hipóteses</span>
            </button>

            <button
              onClick={() => onSelectTab('relatorio')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'relatorio'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 text-purple-400" />
              <span className="hidden lg:inline">Dossiê Centelha</span>
              <span className="lg:hidden">Dossiê</span>
            </button>
          </nav>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMeetModal}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/50 px-3 py-1.5 text-xs font-bold text-purple-200 transition-colors shadow-sm"
              title="Importar transcrição gravada do Google Meet com IA"
            >
              <Video className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Importar Meet (IA)</span>
              <span className="sm:hidden">Meet IA</span>
            </button>

            <button
              onClick={onNewInterview}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition-colors"
              title="Iniciar nova entrevista de campo"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Entrevista</span>
            </button>

            <button
              onClick={onExportCsv}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors"
              title="Exportar CSV UTF-8 com BOM para Excel"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Exportar CSV (BOM)</span>
            </button>

            <div className="relative group">
              <button
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Configurações & Backup"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block w-48 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl shadow-black/50 z-50">
                <button
                  onClick={onExportJson}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Backup JSON</span>
                  <span className="text-[10px] text-slate-500">.json</span>
                </button>
                <button
                  onClick={onResetSeed}
                  className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>Restaurar Dados Exemplo</span>
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
