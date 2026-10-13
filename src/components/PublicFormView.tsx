import React, { useState, useEffect } from 'react';
import { RoteiroType, InterviewRecord } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import { createValidationToken, listValidationTokens, ValidationTokenData } from '../services/storageService';
import {
  Send,
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Share2,
  ExternalLink,
  Inbox,
  Clock,
  Eye,
  CheckCircle2,
  Smartphone,
  KeyRound,
  ShieldCheck,
  RefreshCw,
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
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [tokenList, setTokenList] = useState<ValidationTokenData[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const roteiroConfig = ROTEIROS_CONFIG[selectedRoteiro];

  // Carrega lista de tokens gerados
  const loadTokens = async () => {
    try {
      const list = await listValidationTokens();
      setTokenList(list);
    } catch (err) {
      console.warn('Erro ao carregar lista de tokens:', err);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  // URL tokenizada única
  const activeUrl = generatedToken
    ? `${window.location.origin}${window.location.pathname}?mode=form&roteiro=${selectedRoteiro}&t=${generatedToken}`
    : '';

  // Gerar novo token para a entrevista
  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const newToken = await createValidationToken(selectedRoteiro);
      setGeneratedToken(newToken);
      await loadTokens();
    } catch (err) {
      console.error('Falha ao gerar token no Firestore:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Texto de convite empático e transparente, sem tom de venda
  const getInviteText = (r: RoteiroType, url: string) => {
    const link = url || '[Gere o link tokenizado acima]';
    if (r === 'G') {
      return `Olá! Estamos realizando uma pesquisa independente de campo para entender a rotina prática de terapeutas infantis, neuropsicopedagogos e fonoaudiólogos no atendimento de crianças neurodivergentes e o intervalo entre as sessões. Não estamos vendendo nenhum produto ou software. Se puder responder a estas breves perguntas sobre sua rotina real pelo link de convite único: ${link}`;
    }
    if (r === 'B') {
      return `Olá! Estamos conduzindo uma pesquisa técnica sobre conformidade com a LBI e organização do atendimento de educação especial em redes públicas. Não estamos vendendo nada. Se puder compartilhar breves informações sobre o fluxo de gestão da sua secretaria pelo link individual: ${link}`;
    }
    if (r === 'D' || r === 'E') {
      return `Olá! Estamos fazendo uma pesquisa com famílias sobre rotinas de estudos, apoio pedagógico e dificuldades escolares no dia a dia. É rápida e sem nenhum intuito comercial. Acesse seu convite exclusivo: ${link}`;
    }
    return `Olá! Estamos realizando uma pesquisa independente para entender como a rotina do Atendimento Educacional Especializado (AEE) funciona na prática na nossa rede pública. Não estamos vendendo nada e não vamos te oferecer nenhum produto. Se puder responder a estas breves perguntas pelo link de uso único: ${link}`;
  };

  const inviteText = getInviteText(selectedRoteiro, activeUrl);

  const handleCopyLink = () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyInvite = () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(inviteText);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleOpenIsolatedPreview = () => {
    if (activeUrl) {
      window.open(activeUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Caixa de Geração e Envio de Links por Roteiro */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-900/70 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase">
                Central de Links Tokenizados
              </span>
              <span className="text-xs text-slate-400">2.4 — Acesso Restrito por Convite Único</span>
            </div>
            <h2 className="mt-1 text-base font-extrabold text-white">
              Geração de Link Individual de Pesquisa
            </h2>
            <p className="text-xs text-slate-300">
              O formulário não é público geral. Cada entrevistado recebe um token aleatório exclusivo, consumido após o envio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateToken}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <KeyRound className="h-4 w-4" />
              <span>{isGenerating ? 'Gerando...' : 'Gerar Novo Token de Convite'}</span>
            </button>
          </div>
        </div>

        {/* Seletor de Roteiros */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Selecione o Roteiro para o Convite:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(['A', 'B', 'C', 'D', 'E', 'G'] as RoteiroType[]).map((r) => {
              const isSelected = selectedRoteiro === r;
              const isFam = r === 'D' || r === 'E';
              const isClin = r === 'G';
              const isGest = r === 'B';

              return (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedRoteiro(r);
                    setGeneratedToken(null);
                  }}
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
        </div>

        {/* Card do Link Tokenizado Gerado */}
        {generatedToken ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Link Tokenizado Ativo (Uso Único):
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Token: {generatedToken}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 p-2.5">
              <LinkIcon className="h-4 w-4 text-indigo-400 shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={activeUrl}
                className="w-full bg-transparent text-xs text-slate-200 font-mono truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shrink-0 shadow-sm"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-950/40 hover:bg-emerald-900/50 px-3.5 py-2 text-xs font-bold text-emerald-200 transition-colors"
              >
                <Share2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{copiedInvite ? 'Convite Copiado!' : 'Copiar Mensagem WhatsApp'}</span>
              </button>

              <button
                onClick={handleOpenIsolatedPreview}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                <span>Abrir e Testar no Navegador</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center space-y-2">
            <KeyRound className="h-6 w-6 text-indigo-400 mx-auto" />
            <p className="text-xs font-bold text-white">Nenhum link gerado para esta sessão</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Clique no botão <strong>"Gerar Novo Token de Convite"</strong> acima para criar um link individual e exclusivo com o roteiro selecionado.
            </p>
          </div>
        )}

        {/* Prévia da Mensagem de Convite */}
        {generatedToken && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                Mensagem Sugerida para WhatsApp:
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
        )}
      </div>

      {/* Tabela de Tokens Emitidos */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Tokens de Convite Gerados
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTokens}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Atualizar lista de tokens"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
              {tokenList.length} token(s)
            </span>
          </div>
        </div>

        {tokenList.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Nenhum token foi gerado ainda. Clique em "Gerar Novo Token de Convite".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[11px] uppercase font-mono text-slate-400">
                <tr>
                  <th className="py-2 px-3">Token</th>
                  <th className="py-2 px-3">Roteiro</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Criado Em</th>
                  <th className="py-2 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {tokenList.map((t) => {
                  const isConsumed = t.usado || t.status === 'consumido';
                  const link = `${window.location.origin}${window.location.pathname}?mode=form&roteiro=${t.roteiro}&t=${t.token}`;
                  return (
                    <tr key={t.token} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-indigo-300">{t.token}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-bold font-mono text-[10px]">
                          Roteiro {t.roteiro}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono ${
                            isConsumed
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {isConsumed ? 'Consumido' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(t.criadoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!isConsumed && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(link);
                              alert('Link tokenizado copiado com sucesso!');
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Copiar Link
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico de Submissões Recebidas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Respostas Recebidas no Firestore (validacao_respostas)
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
              Assim que os entrevistados enviarem as respostas através do link com token, elas aparecerão aqui e no CRM.
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
