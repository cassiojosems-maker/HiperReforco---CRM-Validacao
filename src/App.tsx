/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { CrmPipelineView } from './components/CrmPipelineView';
import { LiveInterviewChecklist } from './components/LiveInterviewChecklist';
import { PublicFormView } from './components/PublicFormView';
import { PublicRespondentView } from './components/PublicRespondentView';
import { HypothesisMatrixView } from './components/HypothesisMatrixView';
import { ExecutiveReportView } from './components/ExecutiveReportView';
import { InterviewDetailModal } from './components/InterviewDetailModal';
import { MeetTranscriptionModal } from './components/MeetTranscriptionModal';
import { InterviewRecord, StatusCRM, RoteiroType } from './types/validation';
import {
  getStoredInterviews,
  saveStoredInterviews,
  exportToCsvUtf8Bom,
  exportToJson,
  resetToSeedData,
} from './services/storageService';
import { Check, Info } from 'lucide-react';

export default function App() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [currentTab, setCurrentTab] = useState<'crm' | 'live' | 'form' | 'matriz' | 'relatorio'>('crm');
  const [activeRecord, setActiveRecord] = useState<InterviewRecord | null>(null);
  const [detailModalRecord, setDetailModalRecord] = useState<InterviewRecord | null>(null);
  const [isMeetModalOpen, setIsMeetModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modo isolado de entrevistado (quando o link ?mode=form é acessado)
  const [isRespondentMode, setIsRespondentMode] = useState<boolean>(false);
  const [respondentRoteiro, setRespondentRoteiro] = useState<RoteiroType>('A');

  // Inicializa dados do localStorage ou seeds e sincroniza com o servidor
  useEffect(() => {
    const loaded = getStoredInterviews();
    setInterviews(loaded);

    // Checa se veio com query param para modo formulário público do entrevistado
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'form') {
      setIsRespondentMode(true);
      const rot = (params.get('roteiro') || 'A').toUpperCase() as RoteiroType;
      setRespondentRoteiro((['A', 'B', 'C', 'D', 'E', 'G'].includes(rot) ? rot : 'A') as RoteiroType);
      return;
    }

    // Se estiver no painel CRM, busca novas submissões externas gravadas no servidor
    const syncRemoteSubmissions = async () => {
      try {
        const res = await fetch('/api/forms/submissions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.submissions) && data.submissions.length > 0) {
            setInterviews((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newSubmissions = data.submissions.filter((s: InterviewRecord) => !existingIds.has(s.id));
              if (newSubmissions.length > 0) {
                const merged = [...newSubmissions, ...prev];
                saveStoredInterviews(merged);
                showToast(`${newSubmissions.length} nova(s) resposta(s) de formulário recebida(s)!`);
                return merged;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Fallback silencioso caso não conecte à API
      }
    };

    syncRemoteSubmissions();
    const interval = setInterval(syncRemoteSubmissions, 20000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Salvar registro de entrevista (novo ou editado)
  const handleSaveRecord = (record: InterviewRecord) => {
    setInterviews((prev) => {
      const exists = prev.some((i) => i.id === record.id);
      let updated: InterviewRecord[];
      if (exists) {
        updated = prev.map((i) => (i.id === record.id ? record : i));
      } else {
        updated = [record, ...prev];
      }
      saveStoredInterviews(updated);
      return updated;
    });

    setActiveRecord(null);
    setCurrentTab('crm');
    showToast(`Entrevista gravada com sucesso no CRM (${record.roteiro} · ${record.municipio})!`);
  };

  // Submissão pelo formulário externo
  const handleSubmitExternal = (record: InterviewRecord) => {
    setInterviews((prev) => {
      const updated = [record, ...prev];
      saveStoredInterviews(updated);
      return updated;
    });
    showToast('Nova resposta de campo recebida via formulário externo!');
  };

  // Iniciar nova entrevista do zero
  const handleNewInterview = () => {
    setActiveRecord(null);
    setCurrentTab('live');
  };

  // Abrir no checklist ao vivo para continuar ou revisar
  const handleOpenLive = (record: InterviewRecord) => {
    setActiveRecord(record);
    setCurrentTab('live');
  };

  // Atualizar estágio no Kanban
  const handleUpdateStatus = (id: string, newStatus: StatusCRM) => {
    setInterviews((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
      saveStoredInterviews(updated);
      return updated;
    });
    showToast(`Estágio alterado para: ${newStatus.toUpperCase()}`);
  };

  // Renovar acompanhamento / registrar contato hoje (remove alerta de estagnação de 7 dias)
  const handleRenewUpdate = (id: string) => {
    setInterviews((prev) => {
      const updated = prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      });
      saveStoredInterviews(updated);
      return updated;
    });
    showToast('Acompanhamento renovado com sucesso! Contato registrado hoje.');
  };

  // Excluir entrevista (sem window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setInterviews((prev) => {
      const updated = prev.filter((i) => i.id !== deleteConfirmId);
      saveStoredInterviews(updated);
      return updated;
    });
    setDeleteConfirmId(null);
    showToast('Registro de entrevista removido.');
  };

  const confirmReset = () => {
    const reset = resetToSeedData();
    setInterviews(reset);
    setShowResetConfirm(false);
    showToast('Dados de exemplo do Caderno de Validação restaurados!');
  };

  // Carregamento de transcrição de reunião via Google Meet com IA
  const handleMeetTranscriptionLoaded = (record: InterviewRecord) => {
    setInterviews((prev) => {
      const updated = [record, ...prev];
      saveStoredInterviews(updated);
      return updated;
    });
    setActiveRecord(record);
    setCurrentTab('live');
    showToast(`Transcrição do Meet analisada com sucesso via IA! Roteiro ${record.roteiro} carregado.`);
  };

  // Exportar CSV oficial UTF-8 com BOM
  const handleExportCsv = () => {
    exportToCsvUtf8Bom(interviews);
    showToast('Planilha CSV (UTF-8 com BOM) gerada com sucesso para Excel!');
  };

  // Exportar backup JSON
  const handleExportJson = () => {
    exportToJson(interviews);
    showToast('Backup JSON completo baixado.');
  };

  // Restaurar dados seed do Caderno de Validação
  const handleResetSeed = () => {
    setShowResetConfirm(true);
  };

  // Se for acesso de entrevistado pelo link externo (?mode=form), exibe unicamente a tela isolada sem CRM
  if (isRespondentMode) {
    return (
      <PublicRespondentView
        initialRoteiro={respondentRoteiro}
        onSubmit={async (record) => {
          try {
            await fetch('/api/forms/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(record),
            });
          } catch (err) {
            console.warn('Erro ao submeter resposta ao servidor:', err);
          }
          setInterviews((prev) => {
            const updated = [record, ...prev];
            saveStoredInterviews(updated);
            return updated;
          });
        }}
        onAdminReturn={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          url.searchParams.delete('roteiro');
          window.history.pushState({}, '', url.toString());
          setIsRespondentMode(false);
          setCurrentTab('crm');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header com navegação e branding */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onNewInterview={handleNewInterview}
        onOpenMeetModal={() => setIsMeetModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onResetSeed={handleResetSeed}
        totalInterviews={interviews.length}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Painel de Métricas e Regra de Ouro (visível nas abas CRM e Matriz) */}
        {(currentTab === 'crm' || currentTab === 'matriz') && (
          <MetricsOverview interviews={interviews} />
        )}

        {/* Visão 1: CRM Funil & Kanban */}
        {currentTab === 'crm' && (
          <CrmPipelineView
            interviews={interviews}
            onOpenLive={handleOpenLive}
            onUpdateStatus={handleUpdateStatus}
            onDeleteInterview={(id) => setDeleteConfirmId(id)}
            onViewDetails={(item) => setDetailModalRecord(item)}
            onRenewUpdate={handleRenewUpdate}
          />
        )}

        {/* Visão 2: Checklist de Campo Ao Vivo */}
        {currentTab === 'live' && (
          <LiveInterviewChecklist
            currentRecord={activeRecord}
            onSaveRecord={handleSaveRecord}
            onCancel={() => {
              setActiveRecord(null);
              setCurrentTab('crm');
            }}
            onOpenMeetModal={() => setIsMeetModalOpen(true)}
          />
        )}

        {/* Visão 3: Painel de Envio de Formulários de Campo (Central do Pesquisador) */}
        {currentTab === 'form' && (
          <PublicFormView
            onSubmitExternal={handleSubmitExternal}
            onOpenLiveChecklist={handleOpenLive}
            onViewRecord={(item) => setDetailModalRecord(item)}
            recentExternalSubmissions={interviews.filter(
              (i) => i.isExterna || i.tags?.includes('Formulário Externo')
            )}
          />
        )}

        {/* Visão 4: Matriz de Hipóteses H1 a H6 & Guia Anti-Viés */}
        {currentTab === 'matriz' && (
          <HypothesisMatrixView interviews={interviews} />
        )}

        {/* Visão 5: Dossiê Executivo de Validação */}
        {currentTab === 'relatorio' && (
          <ExecutiveReportView
            interviews={interviews}
            onExportCsv={handleExportCsv}
          />
        )}
      </main>

      {/* Modal de Detalhes da Ficha */}
      {detailModalRecord && (
        <InterviewDetailModal
          interview={detailModalRecord}
          onClose={() => setDetailModalRecord(null)}
          onOpenLive={handleOpenLive}
        />
      )}

      {/* Modal de Importação de Transcrição do Google Meet (IA Gemini) */}
      <MeetTranscriptionModal
        isOpen={isMeetModalOpen}
        onClose={() => setIsMeetModalOpen(false)}
        onTranscriptionLoaded={handleMeetTranscriptionLoaded}
      />

      {/* Modal Seguro de Confirmação de Exclusão (Substitui window.confirm) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Confirmar Exclusão de Entrevista</h3>
            <p className="text-xs text-slate-300">
              Tem certeza que deseja remover permanentemente este registro de entrevista do CRM? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-950"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seguro de Confirmação de Restauração de Seeds (Substitui window.confirm) */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Restaurar Dados de Exemplo</h3>
            <p className="text-xs text-slate-300">
              Deseja restaurar as entrevistas modelo do Caderno de Validação do HiperReforço (incluindo casos em Campo Grande, Dourados e follow-ups de 7 dias)?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReset}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-950"
              >
                Restaurar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="rounded-full bg-indigo-600/30 p-1 text-indigo-400">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
