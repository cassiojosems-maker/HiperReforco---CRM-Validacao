import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  CheckCircle2,
  AlertCircle,
  Send,
  Key,
  ShieldCheck,
  HelpCircle,
  Copy,
  ExternalLink,
  History,
  Check,
  Settings,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  getEmailConfig,
  saveEmailConfig,
  sendTestNotification,
  listNotificationAudits,
  EmailNotificationConfig,
  NotificationAuditRecord,
} from '../services/emailService';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string) => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'audit'>('config');
  const [config, setConfig] = useState<EmailNotificationConfig>({
    toEmail: 'cassiojosems@gmail.com',
    serviceId: '',
    templateId: '',
    publicKey: '',
    enabled: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [audits, setAudits] = useState<NotificationAuditRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentConfig = await getEmailConfig();
      setConfig(currentConfig);
      const auditLogs = await listNotificationAudits();
      setAudits(auditLogs);
    } catch (err) {
      console.warn('Erro ao carregar configurações de e-mail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);
    try {
      await saveEmailConfig(config);
      if (onToast) onToast('Configurações de e-mail salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Salva antes de testar
      await saveEmailConfig(config);
      const res = await sendTestNotification(config);
      setTestResult({
        success: res.success,
        message: res.message,
      });
      // Recarrega lista de auditoria
      const updatedAudits = await listNotificationAudits();
      setAudits(updatedAudits);
      if (onToast) onToast(res.message);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Falha ao disparar e-mail de teste.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 shadow-md shadow-indigo-500/20 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Notificações por E-mail da Equipe
                <span className="rounded-full bg-indigo-950 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  EmailJS / Auto-Alert
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Disparo automático de resumos executivos a cada formulário externo submetido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Navegação Interna */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'config'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Configuração EmailJS
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Variáveis do Template
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Histórico & Auditoria ({audits.length})
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Toggle de ativação */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Ativar Notificações Automáticas
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Sempre que um respondente enviar respostas, a equipe receberá o resumo instantaneamente.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Destinatário */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  E-mail do Destinatário da Equipe
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={config.toEmail}
                    onChange={(e) => setConfig({ ...config, toEmail: e.target.value })}
                    placeholder="ex: cassiojosems@gmail.com ou equipe@hiperreforco.com.br"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  E-mail onde o time receberá o alerta com o resumo completo de cada formulário submetido.
                </p>
              </div>

              {/* Credenciais EmailJS */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-indigo-400" />
                    Credenciais do Serviço EmailJS
                  </span>
                  <a
                    href="https://dashboard.emailjs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Painel EmailJS <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Service ID (ex: service_hiperreforco)
                    </label>
                    <input
                      type="text"
                      value={config.serviceId}
                      onChange={(e) => setConfig({ ...config, serviceId: e.target.value })}
                      placeholder="service_..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Template ID (ex: template_submissao)
                    </label>
                    <input
                      type="text"
                      value={config.templateId}
                      onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
                      placeholder="template_..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Public Key / User ID (Account &gt; General &gt; Public Key)
                  </label>
                  <input
                    type="text"
                    value={config.publicKey}
                    onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                    placeholder="Chave pública do EmailJS..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Caso ainda não tenha preenchido as chaves, o sistema opera em modo de auditoria/simulação e registra o resumo com segurança.
                  </p>
                </div>
              </div>

              {/* Feedback de Teste */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-200'
                      : 'border-amber-600/40 bg-amber-950/40 text-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">{testResult.message}</div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || isSaving}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
                >
                  <Send className={`h-3.5 w-3.5 ${isTesting ? 'animate-pulse text-indigo-400' : ''}`} />
                  {isTesting ? 'Enviando Teste...' : 'Disparar E-mail de Teste Agora'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 text-xs text-indigo-200 leading-relaxed">
                <strong>Como configurar o template no EmailJS:</strong>
                <ol className="list-decimal pl-5 mt-1.5 space-y-1 text-slate-300 text-[11px]">
                  <li>Acesse <strong>EmailJS Dashboard &gt; Email Templates &gt; Create New Template</strong>.</li>
                  <li>No campo <strong>Subject</strong>, utilize: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{"{{subject}}"}</code>.</li>
                  <li>No campo <strong>To Email</strong>, utilize: <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{"{{to_email}}"}</code>.</li>
                  <li>No corpo do e-mail, inclua <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{"{{{summary_html}}}"}</code> (para visualização rica) ou <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">{"{{summary_content}}"}</code> (para texto estruturado).</li>
                </ol>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Tags & Variáveis Disponíveis para o Template
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800 text-xs">
                  {[
                    { varName: '{{subject}}', desc: 'Assunto oficial com Roteiro e Nome do Respondente' },
                    { varName: '{{to_email}}', desc: 'E-mail do destinatário da equipe configurado' },
                    { varName: '{{respondent_name}}', desc: 'Nome ou identificação do entrevistado' },
                    { varName: '{{respondent_role}}', desc: 'Perfil profissional ou familiar (ex: Terapeuta, Mãe)' },
                    { varName: '{{respondent_location}}', desc: 'Município e Escola / Clínica informada' },
                    { varName: '{{respondent_contact}}', desc: 'WhatsApp ou e-mail fornecido pelo respondente' },
                    { varName: '{{roteiro_title}}', desc: 'Título oficial do roteiro (ex: Roteiro D — Famílias)' },
                    { varName: '{{token}}', desc: 'Token de convite único consumido na resposta' },
                    { varName: '{{paid_out_of_pocket}}', desc: 'Histórico de pagamento do próprio bolso (Sim/Não)' },
                    { varName: '{{summary_content}}', desc: 'Resumo completo das respostas em texto estruturado' },
                    { varName: '{{{summary_html}}}', desc: 'Resumo executivo completo formatado em HTML' },
                    { varName: '{{submission_date}}', desc: 'Data e horário exatos do recebimento' },
                  ].map((item) => (
                    <div
                      key={item.varName}
                      className="flex items-center justify-between p-2.5 bg-slate-950/40 hover:bg-slate-950/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-indigo-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {item.varName}
                        </code>
                        <span className="text-[11px] text-slate-300">{item.desc}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.varName)}
                        className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 transition-colors flex items-center gap-1"
                      >
                        {copiedVar === item.varName ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Registros de envios efetuados ou simulados:</span>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className="h-3 w-3" /> Atualizar
                </button>
              </div>

              {audits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nenhuma notificação registrada ainda. Envie um formulário externo ou dispare um e-mail de teste para visualizar aqui.
                </div>
              ) : (
                <div className="space-y-2">
                  {audits.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                              a.status === 'enviado'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                                : 'bg-indigo-950 text-indigo-400 border border-indigo-700/60'
                            }`}
                          >
                            {a.status === 'enviado' ? 'Entregue EmailJS' : 'Auditado'}
                          </span>
                          <span className="font-bold text-white">
                            Roteiro {a.roteiro} · {a.entrevistadoNome}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(a.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Destinatário: <strong className="text-slate-200">{a.toEmail}</strong></span>
                        <span className="text-slate-500 font-mono text-[10px]">ID: {a.submissionId}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 italic border-l-2 border-slate-700 pl-2 mt-1">
                        {a.mensagem}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
