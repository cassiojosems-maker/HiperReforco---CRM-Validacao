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
import { AuthGate } from './components/AuthGate';
import { InterviewRecord, StatusCRM, RoteiroType } from './types/validation';
import {
  getStoredInterviews,
  saveStoredInterviews,
  saveInterviewToFirestore,
  deleteInterviewFromFirestore,
  subscribeToCrmInterviews,
  subscribeToPublicSubmissions,
  verifyValidationToken,
  exportToCsvUtf8Bom,
  exportToJson,
  resetToSeedData,
} from './services/storageService';
import { Check, Info, Lock, ShieldAlert, KeyRound, AlertTriangle } from 'lucide-react';

// 2.7 - Controle de ativação do formulário público externo reaberto após 2.4, 2.5 e 2.6
const FORMULARIO_PUBLICO_ATIVO = false;

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
  const [respondentToken, setRespondentToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    loading: boolean;
    valid: boolean;
    used: boolean;
    error?: string;
  }>({ loading: true, valid: false, used: false });

  // Inicializa dados do localStorage ou seeds e sincroniza com o Firestore
  useEffect(() => {
    // 1. Carrega do cache offline imediatamente
    const loaded = getStoredInterviews();
    setInterviews(loaded);

    // 2. Checa se é modo respondente (?mode=form)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'form') {
      setIsRespondentMode(true);
      const rot = (params.get('roteiro') || 'A').toUpperCase() as RoteiroType;
      const validRoteiro = (['A', 'B', 'C', 'D', 'E', 'G'].includes(rot) ? rot : 'A') as RoteiroType;
      setRespondentRoteiro(validRoteiro);

      // 2.4: Validação obrigatória de token único
      const token = params.get('t');
      setRespondentToken(token);

      if (!token) {
        setTokenStatus({
          loading: false,
          valid: false,
          used: false,
          error: 'Link sem token de convite. O acesso ao formulário requer um token individual exclusivo.',
        });
        return;
      }

      // Verifica token no Firestore
      verifyValidationToken(token).then((res) => {
        setTokenStatus({
          loading: false,
          valid: res.valid,
          used: res.used,
          error: res.error,
        });
        if (res.roteiro) {
          setRespondentRoteiro(res.roteiro);
        }
      });
      return;
    }

    // 3. Se for modo interno CRM: Conecta subscrição em tempo real com o Firestore (2.1)
    const unsubscribeCrm = subscribeToCrmInterviews(
      (firestoreRecords) => {
        if (firestoreRecords.length > 0) {
          setInterviews((prev) => {
            const remoteMap = new Map(firestoreRecords.map((r) => [r.id, r]));
            const merged = [...firestoreRecords];
            // Garante que não perde seeds locais se não estiverem no Firestore ainda
            for (const item of prev) {
              if (!remoteMap.has(item.id)) {
                merged.push(item);
              }
            }
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Subscrição CRM Firestore aguardando autorização:', err);
      }
    );

    // 4. Subscrição em tempo real para novas submissões externas (validacao_respostas)
    const unsubscribePublic = subscribeToPublicSubmissions((publicRecords) => {
      if (publicRecords.length > 0) {
        setInterviews((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newItems = publicRecords.filter((p) => !existingIds.has(p.id));
          if (newItems.length > 0) {
            showToast(`${newItems.length} nova(s) resposta(s) recebida(s) no Firestore!`);
            return [...newItems, ...prev];
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribeCrm();
      unsubscribePublic();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Salvar registro de entrevista no Firestore e no cache
  const handleSaveRecord = async (record: InterviewRecord) => {
    setInterviews((prev) => {
      const exists = prev.some((i) => i.id === record.id);
      let updated: InterviewRecord[];
      if (exists) {
        updated = prev.map((i) => (i.id === record.id ? record : i));
      } else {
        updated = [record, ...prev];
      }
      return updated;
    });

    try {
      await saveInterviewToFirestore(record);
    } catch (err) {
      console.warn('Erro ao salvar no Firestore (mantido no cache):', err);
    }

    setActiveRecord(null);
    setCurrentTab('crm');
    showToast(`Entrevista gravada com sucesso no Firestore (${record.roteiro} · ${record.municipio})!`);
  };

  // Submissão pelo formulário externo
  const handleSubmitExternal = (record: InterviewRecord) => {
    setInterviews((prev) => [record, ...prev]);
    showToast('Nova resposta de campo recebida via formulário!');
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
      const target = prev.find((i) => i.id === id);
      const updated = prev.map((i) => (i.id === id ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i));
      if (target) {
        saveInterviewToFirestore({ ...target, status: newStatus, updatedAt: new Date().toISOString() });
      }
      return updated;
    });
    showToast(`Estágio alterado para: ${newStatus.toUpperCase()}`);
  };

  // Renovar acompanhamento / registrar contato hoje
  const handleRenewUpdate = (id: string) => {
    setInterviews((prev) => {
      const target = prev.find((i) => i.id === id);
      const updatedDate = new Date().toISOString();
      const updated = prev.map((i) => (i.id === id ? { ...i, updatedAt: updatedDate } : i));
      if (target) {
        saveInterviewToFirestore({ ...target, updatedAt: updatedDate });
      }
      return updated;
    });
    showToast('Acompanhamento renovado com sucesso! Contato registrado hoje.');
  };

  // Excluir entrevista
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const idToDelete = deleteConfirmId;
    setInterviews((prev) => prev.filter((i) => i.id !== idToDelete));
    try {
      await deleteInterviewFromFirestore(idToDelete);
    } catch (e) {
      console.warn('Erro ao deletar no Firestore:', e);
    }
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
  const handleMeetTranscriptionLoaded = async (record: InterviewRecord) => {
    setInterviews((prev) => [record, ...prev]);
    try {
      await saveInterviewToFirestore(record);
    } catch (e) {
      console.warn('Erro ao gravar transcrição no Firestore:', e);
    }
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

  // =========================================================================
  // FLUXO DO FORMULÁRIO PÚBLICO (?mode=form) COM VALIDAÇÃO DE TOKEN (2.4, 2.7)
  // =========================================================================
  if (isRespondentMode) {
    if (!FORMULARIO_PUBLICO_ATIVO) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/70 border border-indigo-700/50 text-indigo-400">
              <Info className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Pesquisa Temporariamente Indisponível
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Esta pesquisa está temporariamente indisponível. Em breve retomaremos a coleta.
            </p>
          </div>
        </div>
      );
    }

    // Carregando validação do token
    if (tokenStatus.loading) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 border border-indigo-700 text-indigo-400 animate-pulse">
              <KeyRound className="h-7 w-7" />
            </div>
            <h2 className="text-base font-bold text-white">Validando Token de Convite...</h2>
            <p className="text-xs text-slate-400">
              Verificando autenticidade do link individual no servidor seguro...
            </p>
          </div>
        </div>
      );
    }

    // 2.4: Token já consumido
    if (tokenStatus.used) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900/95 p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-950/70 border border-rose-700/60 text-rose-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Convite Já Utilizado</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Este link de pesquisa já foi utilizado e as respostas já foram registradas no sistema. Cada convite é individual e de uso único para preservar a integridade da amostra.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">
              Token: {respondentToken} · Consumido
            </div>
          </div>
        </div>
      );
    }

    // 2.4: Token inválido ou ausente
    if (!tokenStatus.valid) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/40 bg-slate-900/95 p-8 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-950/70 border border-amber-700/60 text-amber-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Acesso Restrito: Token Inválido</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tokenStatus.error || 'O link acessado não possui um token de convite válido ou autorizado.'}
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-400 text-left">
              Para responder a esta pesquisa de campo, é necessário acessar o link exclusivo com token individual gerado pela equipe de pesquisa.
            </div>
          </div>
        </div>
      );
    }

    // Token válido: renderiza o formulário com o token
    return (
      <PublicRespondentView
        initialRoteiro={respondentRoteiro}
        token={respondentToken || undefined}
        onSubmit={async (record) => {
          setInterviews((prev) => [record, ...prev]);
        }}
        onAdminReturn={() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          url.searchParams.delete('roteiro');
          url.searchParams.delete('t');
          window.history.pushState({}, '', url.toString());
          setIsRespondentMode(false);
          setCurrentTab('crm');
        }}
      />
    );
  }

  // =========================================================================
  // FLUXO DO CRM INTERNO: PROTEGIDO POR LOGIN GOOGLE + ALLOWLIST (2.2, 2.3)
  // =========================================================================
  return (
    <AuthGate>
      {({ currentUser, onLogout }) => (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Toast de Notificação */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/90 px-4 py-3 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md animate-slide-up">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

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
            currentUser={currentUser}
            onLogout={onLogout}
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

            {/* Visão 3: Central de Links Tokenizados de Campo */}
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

          {/* Modal Seguro de Confirmação de Exclusão */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Confirmar Exclusão de Entrevista</h3>
                <p className="text-xs text-slate-300">
                  Tem certeza que deseja remover este registro do CRM no Firestore? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Excluir Registro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação de Restauração de Dados Seeds */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-bold text-white">Restaurar Dados Exemplo do Caderno</h3>
                <p className="text-xs text-slate-300">
                  Deseja carregar as 5 entrevistas exemplo documentadas no Caderno de Validação oficial? Seus dados existentes serão mantidos.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmReset}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Confirmar Restauração
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AuthGate>
  );
}
