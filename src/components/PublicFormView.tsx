import React, { useState } from 'react';
import { RoteiroType, InterviewRecord } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import {
  Send,
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ShieldCheck,
  Share2,
  ExternalLink,
  Lock,
  Inbox,
  Clock,
  Eye,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

interface PublicFormViewProps {
  onSubmitExternal: (record: InterviewRecord) => void;
  onOpenLiveChecklist?: (record: InterviewRecord) => void;
  onViewRecord?: (record: InterviewRecord) => void;
  recentExternalSubmissions?: InterviewRecord[];
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({
  onSubmitExternal,
  onOpenLiveChecklist,
  onViewRecord,
  recentExternalSubmissions = [],
}) => {
  const [selectedRoteiro, setSelectedRoteiro] = useState<RoteiroType>('G');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const roteiroConfig = ROTEIROS_CONFIG[selectedRoteiro];

  // URL limpa e isolada para o entrevistado
  const shareableUrl = `${window.location.origin}${window.location.pathname}?mode=form&roteiro=${selectedRoteiro}`;

  // Texto de convite empático e transparente, sem tom de venda
  const getInviteText = (r: RoteiroType) => {
    if (r === 'G') {
      return `Olá! Estamos realizando uma pesquisa independente de campo para entender a rotina prática de terapeutas infantis, neuropsicopedagogos e fonoaudiólogos no atendimento de crianças neurodivergentes e o intervalo entre as sessões. Não estamos vendendo nenhum produto ou software. Se puder responder a estas breves perguntas sobre sua rotina real, vai nos ajudar muito: ${shareableUrl}`;
    }
    if (r === 'B') {
      return `Olá! Estamos conduzindo uma pesquisa técnica sobre conformidade com a LBI e organização do atendimento de educação especial em redes públicas. Não estamos vendendo nada. Se puder compartilhar breves informações sobre o fluxo de gestão da sua secretaria: ${shareableUrl}`;
    }
    if (r === 'D' || r === 'E') {
      return `Olá! Estamos fazendo uma pesquisa com famílias sobre rotinas de estudos, apoio pedagógico e dificuldades escolares no dia a dia. É rápida e sem nenhum intuito comercial: ${shareableUrl}`;
    }
    return `Olá! Estamos realizando uma pesquisa independente para entender como a rotina do Atendimento Educacional Especializado (AEE) funciona na prática na nossa rede pública. Não estamos vendendo nada e não vamos te oferecer nenhum produto. Se puder responder a estas breves perguntas sobre sua experiência real, vai nos ajudar muito: ${shareableUrl}`;
  };

  const inviteText = getInviteText(selectedRoteiro);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleOpenIsolatedPreview = () => {
    window.open(shareableUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Alerta de Blindagem de Dados e Privacidade */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/50 p-2 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Blindagem de Dados Ativa para os Entrevistados
                </h2>
                <span className="rounded-full bg-emerald-900/80 border border-emerald-600 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  SEGURO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                O link enviado ao entrevistado abre uma <strong>página limpa e isolada</strong> contendo unicamente as perguntas do questionário. O entrevistado <strong>NÃO visualiza o painel do CRM</strong>, nem as hipóteses H1-H6, nem métricas, nem os registros confidenciais de outras entrevistas.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenIsolatedPreview}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950 hover:bg-emerald-900 px-3.5 py-2 text-xs font-bold text-emerald-200 transition-colors shrink-0 shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Testar Como Entrevistado</span>
          </button>
        </div>
      </div>

      {/* Caixa de Geração e Envio de Links por Roteiro */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-900/70 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase">
                Central de Envio Remoto
              </span>
              <span className="text-xs text-slate-400">Coleta Assíncrona de Campo</span>
            </div>
            <h2 className="mt-1 text-base font-extrabold text-white">
              Selecione o Roteiro para Gerar o Link de Envio
            </h2>
            <p className="text-xs text-slate-300">
              Cada perfil de entrevistado recebe perguntas calibradas para o seu contexto específico.
            </p>
          </div>

          {/* Seletor de Roteiros */}
          <div className="flex flex-wrap gap-1.5">
            {(['A', 'B', 'C', 'D', 'E', 'G'] as RoteiroType[]).map((r) => {
              const cfg = ROTEIROS_CONFIG[r];
              const isSelected = selectedRoteiro === r;
              const isFam = r === 'D' || r === 'E';
              const isClin = r === 'G';
              const isGest = r === 'B';

              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoteiro(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? isFam
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/40 ring-2 ring-pink-400/50'
                        : isClin
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/40 ring-2 ring-teal-400/50'
                        : isGest
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/40 ring-2 ring-amber-400/50'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>Roteiro {r}</span>
                  {isFam && <span className="text-[10px] bg-pink-950/90 px-1.5 py-0.2 rounded font-mono text-pink-200">Família</span>}
                  {isClin && <span className="text-[10px] bg-teal-900/80 px-1.5 py-0.2 rounded font-mono text-teal-200">Clínica</span>}
                  {isGest && <span className="text-[10px] bg-amber-900/80 px-1.5 py-0.2 rounded font-mono text-amber-200">Gestão</span>}
                  {!isFam && !isClin && !isGest && <span className="text-[10px] bg-indigo-950 px-1.5 py-0.2 rounded font-mono text-indigo-200">Docente</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumo do Roteiro Selecionado */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {roteiroConfig.title}
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                Público: {roteiroConfig.targetAudience}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Tempo: {roteiroConfig.durationTarget}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {roteiroConfig.goldenRuleNote}
          </p>

          {/* Destaque da Identificação Calibrada */}
          {(selectedRoteiro === 'D' || selectedRoteiro === 'E') && (
            <div className="mt-2 rounded-lg bg-pink-950/30 border border-pink-700/40 p-2.5 text-[11px] text-pink-200 flex items-center gap-2">
              <span className="font-bold text-pink-300">👨‍👩‍👦 Identificação Familiar:</span>
              <span>
                Formulário calibrado sem jargões corporativos/escolares. Solicita apenas parentesco, idade/série da criança e tipo de escola (não pede sala de recursos nem cargo docente).
              </span>
            </div>
          )}
          {selectedRoteiro === 'G' && (
            <div className="mt-2 rounded-lg bg-teal-950/30 border border-teal-700/40 p-2.5 text-[11px] text-teal-200 flex items-center gap-2">
              <span className="font-bold text-teal-300">🩺 Identificação Clínica:</span>
              <span>
                Solicita clínica/consultório e especialidade (psicologia, neuropsicopedagogia, fono, TO) com foco no vão entre sessões e CFP 31/2022.
              </span>
            </div>
          )}
          {selectedRoteiro === 'B' && (
            <div className="mt-2 rounded-lg bg-amber-950/30 border border-amber-700/40 p-2.5 text-[11px] text-amber-200 flex items-center gap-2">
              <span className="font-bold text-amber-300">🏛️ Identificação Institucional:</span>
              <span>
                Solicita secretaria de educação e cargo gestor com foco em prestação de contas LBI e compras da rede.
              </span>
            </div>
          )}
        </div>

        {/* Links & Botões de Ação */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Campo da URL */}
          <div className="lg:col-span-7 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
            <LinkIcon className="h-4 w-4 text-indigo-400 shrink-0 ml-1" />
            <input
              type="text"
              readOnly
              value={shareableUrl}
              className="w-full bg-transparent text-xs text-slate-300 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shrink-0 shadow-sm"
              title="Copiar link do formulário seguro"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>

          {/* Botões WhatsApp e QR */}
          <div className="lg:col-span-5 flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 hover:bg-emerald-900/50 p-2.5 text-xs font-bold text-emerald-200 transition-colors"
            >
              <Share2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{copiedInvite ? 'Mensagem Copiada!' : 'Copiar Convite WhatsApp'}</span>
            </button>

            <button
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-xs font-bold text-slate-300 transition-colors"
              title="Gerar QR Code de campo"
            >
              <QrCode className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code Expansível */}
        {showQr && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-center space-y-3 animate-fade-in">
            <div className="mx-auto w-44 h-44 bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="w-full h-full border-4 border-slate-900 p-2 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
                  <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
                </div>
                <div className="text-[10px] font-mono font-black text-slate-900 tracking-tighter text-center">
                  HIPERREFORÇO
                  <div className="text-[8px] text-slate-600 font-sans">ROT-{selectedRoteiro}</div>
                </div>
                <div className="flex justify-between">
                  <div className="w-8 h-8 bg-slate-900 rounded-sm"></div>
                  <div className="w-3 h-3 bg-slate-900 self-end"></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Aponte a câmera do celular para abrir o formulário isolado do <strong>{roteiroConfig.title}</strong>
            </p>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-md mx-auto">
              {shareableUrl}
            </p>
          </div>
        )}

        {/* Prévia da Mensagem de Convite */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              Mensagem Sugerida para WhatsApp (Anti-Venda & Empática):
            </span>
            <button
              onClick={handleCopyInvite}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {copiedInvite ? 'Copiada!' : 'Copiar Texto'}
            </button>
          </div>
          <p className="text-xs text-slate-300 italic bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
            "{inviteText}"
          </p>
        </div>
      </div>

      {/* Histórico de Formulários Recebidos Externamente */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Respostas de Campo Recebidas via Formulário Web
            </h3>
          </div>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
            {recentExternalSubmissions.length} registro(s)
          </span>
        </div>

        {recentExternalSubmissions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-2">
            <p>Nenhuma resposta assíncrona recebida ainda.</p>
            <p className="text-[11px] text-slate-400">
              Assim que os entrevistados enviarem as respostas através do link, elas aparecerão aqui e no funil do CRM.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentExternalSubmissions.map((rec) => (
              <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white">
                      {rec.entrevistadoNome || 'Respondente'}
                    </span>
                    <span className="rounded bg-indigo-950 border border-indigo-800 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300">
                      Roteiro {rec.roteiro}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {rec.municipio} · {rec.escolaOrOrgao}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xl">
                    {rec.frasesTextuais?.[0] || 'Resposta registrada no formulário.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onViewRecord && (
                    <button
                      onClick={() => onViewRecord(rec)}
                      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  )}
                  {onOpenLiveChecklist && (
                    <button
                      onClick={() => onOpenLiveChecklist(rec)}
                      className="rounded-lg bg-emerald-600/80 hover:bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition-colors"
                    >
                      Validar no Checklist
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
