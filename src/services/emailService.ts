import emailjs from '@emailjs/browser';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { removerIndefinidos } from './storageService';
import { InterviewRecord, RoteiroType } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';

export interface EmailNotificationConfig {
  toEmail: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

export interface EmailSendResult {
  success: boolean;
  mode: 'emailjs' | 'servidor_log' | 'simulado';
  message: string;
  timestamp: string;
  recipient: string;
  submissionId: string;
}

export interface NotificationAuditRecord {
  id: string;
  timestamp: string;
  toEmail: string;
  roteiro: RoteiroType;
  entrevistadoNome: string;
  municipio: string;
  status: 'enviado' | 'simulado' | 'falha';
  modo: string;
  mensagem: string;
  submissionId: string;
  resumoPreview: string;
}

const CONFIG_DOC_PATH = 'validacao_config/email_settings';
const NOTIFICATIONS_COLLECTION = 'validacao_notificacoes';
const LOCAL_STORAGE_CONFIG_KEY = 'hiperreforco_email_notification_config';

export const DEFAULT_EMAIL_CONFIG: EmailNotificationConfig = {
  toEmail: import.meta.env.VITE_EMAILJS_TO_EMAIL || 'cassiojosems@gmail.com',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
  enabled: true,
};

/**
 * Carrega a configuração de e-mail (Firestore -> localStorage -> env defaults)
 */
export async function getEmailConfig(): Promise<EmailNotificationConfig> {
  try {
    const snap = await getDoc(doc(db, 'validacao_config', 'email_settings'));
    if (snap.exists()) {
      const data = snap.data() as Partial<EmailNotificationConfig>;
      return {
        toEmail: data.toEmail?.trim() || DEFAULT_EMAIL_CONFIG.toEmail,
        serviceId: data.serviceId?.trim() || DEFAULT_EMAIL_CONFIG.serviceId,
        templateId: data.templateId?.trim() || DEFAULT_EMAIL_CONFIG.templateId,
        publicKey: data.publicKey?.trim() || DEFAULT_EMAIL_CONFIG.publicKey,
        enabled: data.enabled !== undefined ? data.enabled : true,
      };
    }
  } catch (err) {
    console.warn('Não foi possível ler config de e-mail do Firestore, usando fallback local:', err);
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (local) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(local) };
    }
  } catch {
    // fallback
  }

  return DEFAULT_EMAIL_CONFIG;
}

/**
 * Salva a configuração de e-mail no Firestore e localStorage
 */
export async function saveEmailConfig(config: EmailNotificationConfig): Promise<void> {
  const cleaned = removerIndefinidos({
    ...config,
    updatedAt: serverTimestamp(),
  });

  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignora erro em local storage
  }

  try {
    await setDoc(doc(db, 'validacao_config', 'email_settings'), cleaned, { merge: true });
  } catch (err) {
    console.warn('Aviso ao sincronizar config de e-mail no Firestore:', err);
  }
}

/**
 * Obtém o enunciado legível de uma pergunta com base no ID
 */
function getQuestionLabel(roteiro: RoteiroType, questionId: string): string {
  const config = ROTEIROS_CONFIG[roteiro];
  if (!config) return questionId;

  for (const block of config.blocks) {
    for (const q of block.questions) {
      if (q.id === questionId) {
        return q.text;
      }
    }
  }
  return questionId;
}

/**
 * Formata um resumo executivo textual estruturado (padrão C-Level / Auditoria)
 */
export function formatInterviewSummaryText(record: InterviewRecord, token?: string): string {
  const rotConfig = ROTEIROS_CONFIG[record.roteiro];
  const rotTitle = rotConfig ? rotConfig.title : `Roteiro ${record.roteiro}`;
  const now = new Date().toLocaleString('pt-BR');

  const lines: string[] = [
    '======================================================================',
    'HIPERREFORÇO · NOTIFICAÇÃO EXECUTIVA DE SUBMISSÃO EXTERNA',
    '======================================================================',
    `Data do Recebimento: ${now}`,
    `Roteiro Aplicado:    ${rotTitle}`,
    `ID da Submissão:     ${record.id}`,
    `Token de Convite:    ${token || record.token || 'Não informado'} (Consumido)`,
    '----------------------------------------------------------------------',
    '1. IDENTIFICAÇÃO DO RESPONDENTE',
    '----------------------------------------------------------------------',
    `• Nome:               ${record.entrevistadoNome || 'Respondente Anônimo'}`,
    `• Perfil / Cargo:     ${record.entrevistadoPerfil || 'Não informado'}`,
    `• Município:          ${record.municipio || 'Não informado'}`,
    `• Escola / Órgão:     ${record.escolaOrOrgao || 'Não informado'}`,
    `• Contato / WhatsApp: ${record.contato || 'Não fornecido'}`,
    `• Pagou do Bolso?:    ${record.pagouDoProprioBolso ? `SIM (R$ ${record.valorPagoDoProprioBolso || 'especificado no texto'})` : 'NÃO'}`,
  ];

  if (record.tipoPerfilIdentificacao === 'familia') {
    lines.push(`• Grau Parentesco:   ${record.parentesco || 'Familiar'}`);
    lines.push(`• Faixa Etária/Ano:   ${record.idadeFilhoOuAno || 'Não informado'}`);
    lines.push(`• Tipo de Escola:     ${record.tipoEscolaFilho || 'Não informado'}`);
  } else {
    if (record.tempoDeCasa) lines.push(`• Tempo no Cargo:     ${record.tempoDeCasa}`);
  }

  lines.push('');
  lines.push('----------------------------------------------------------------------');
  lines.push('2. RESUMO DAS RESPOSTAS DO FORMULÁRIO DE CAMPO');
  lines.push('----------------------------------------------------------------------');

  const notes = record.checklistNotes || {};
  const answeredKeys = Object.keys(notes).filter((k) => notes[k]?.trim());

  if (answeredKeys.length === 0) {
    lines.push('Nenhuma resposta dissertativa registrada.');
  } else {
    for (const key of answeredKeys) {
      const label = getQuestionLabel(record.roteiro, key);
      lines.push(`[${key}] ${label}`);
      lines.push(`→ Resposta: "${notes[key].trim()}"`);
      lines.push('');
    }
  }

  if (record.frasesTextuais && record.frasesTextuais.length > 0) {
    lines.push('----------------------------------------------------------------------');
    lines.push('3. CITAÇÕES LITERAIS DESTACADAS (IN HAEC VERBA)');
    lines.push('----------------------------------------------------------------------');
    record.frasesTextuais.forEach((quote, idx) => {
      lines.push(`${idx + 1}. ${quote}`);
    });
    lines.push('');
  }

  lines.push('----------------------------------------------------------------------');
  lines.push('4. AUDITORIA & REGISTRO NO CRM');
  lines.push('----------------------------------------------------------------------');
  lines.push(`Status no Pipeline:   AGENDADO / REVISÃO PENDENTE`);
  lines.push(`Entrevistador:        Formulário Externo Tokenizado`);
  lines.push(`Auditoria de Consentimento: Termo LGPD Aceito eletronicamente`);
  lines.push('======================================================================');

  return lines.join('\n');
}

/**
 * Formata o resumo em formato HTML para templates ricos de e-mail
 */
export function formatInterviewSummaryHtml(record: InterviewRecord, token?: string): string {
  const rotConfig = ROTEIROS_CONFIG[record.roteiro];
  const rotTitle = rotConfig ? rotConfig.title : `Roteiro ${record.roteiro}`;
  const now = new Date().toLocaleString('pt-BR');
  const notes = record.checklistNotes || {};
  const answeredKeys = Object.keys(notes).filter((k) => notes[k]?.trim());

  const questionsHtml = answeredKeys.length === 0
    ? '<p style="color:#94a3b8;font-style:italic;">Nenhuma resposta dissertativa registrada.</p>'
    : answeredKeys.map((key) => {
        const label = getQuestionLabel(record.roteiro, key);
        return `
          <div style="margin-bottom:14px;padding:12px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:4px;">
            <div style="font-size:12px;font-weight:bold;color:#475569;margin-bottom:4px;">${key} · ${label}</div>
            <div style="font-size:13px;color:#0f172a;line-height:1.5;">${escapeHtml(notes[key].trim())}</div>
          </div>
        `;
      }).join('');

  const quotesHtml = (record.frasesTextuais || []).map((q) =>
    `<li style="margin-bottom:6px;color:#334155;font-size:13px;font-style:italic;">"${escapeHtml(q)}"</li>`
  ).join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;color:#ffffff;">
        <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">HiperReforço · Alerta de Campo</span>
        <h1 style="margin:12px 0 4px 0;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Nova Submissão de Formulário Externo</h1>
        <p style="margin:0;font-size:13px;opacity:0.9;">${escapeHtml(rotTitle)}</p>
      </div>

      <div style="padding:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f1f5f9;padding:16px;border-radius:8px;margin-bottom:20px;font-size:12px;">
          <div><strong>Respondente:</strong> ${escapeHtml(record.entrevistadoNome || 'Anônimo')}</div>
          <div><strong>Município:</strong> ${escapeHtml(record.municipio || 'Não informado')}</div>
          <div><strong>Perfil:</strong> ${escapeHtml(record.entrevistadoPerfil || 'Não informado')}</div>
          <div><strong>Escola/Órgão:</strong> ${escapeHtml(record.escolaOrOrgao || 'Não informado')}</div>
          <div><strong>Contato:</strong> ${escapeHtml(record.contato || 'Não fornecido')}</div>
          <div><strong>Pagou do Bolso:</strong> ${record.pagouDoProprioBolso ? `<span style="color:#16a34a;font-weight:bold;">SIM (R$ ${escapeHtml(record.valorPagoDoProprioBolso || '-')})</span>` : 'Não'}</div>
          <div><strong>Token:</strong> <code style="background:#e2e8f0;padding:2px 4px;border-radius:3px;">${escapeHtml(token || record.token || 'N/A')}</code></div>
          <div><strong>Data/Hora:</strong> ${now}</div>
        </div>

        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;color:#475569;letter-spacing:0.5px;margin:20px 0 10px 0;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
          Respostas Coletadas
        </h3>
        ${questionsHtml}

        ${quotesHtml ? `
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;color:#475569;letter-spacing:0.5px;margin:20px 0 10px 0;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
            Citações Literais (In Haec Verba)
          </h3>
          <ul style="padding-left:20px;margin-top:8px;">${quotesHtml}</ul>
        ` : ''}

        <div style="margin-top:24px;padding:16px;background:#eef2ff;border-radius:8px;text-align:center;">
          <p style="margin:0 0 10px 0;font-size:12px;color:#3730a3;font-weight:600;">
            A ficha completa foi gravada com segurança no banco de dados do CRM.
          </p>
        </div>
      </div>

      <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;text-align:center;">
        HiperReforço · Caderno de Validação Needs-First · Notificação Automática do Sistema
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Registra o evento de notificação para fins de auditoria no Firestore
 */
async function recordNotificationAudit(entry: NotificationAuditRecord): Promise<void> {
  try {
    const cleaned = removerIndefinidos({
      ...entry,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, entry.id), cleaned);
  } catch (err) {
    console.warn('Não foi possível gravar auditoria de notificação no Firestore:', err);
  }
}

/**
 * Dispara notificação por e-mail quando um formulário externo é submetido
 */
export async function sendSubmissionNotification(
  record: InterviewRecord,
  token?: string
): Promise<EmailSendResult> {
  const config = await getEmailConfig();
  const summaryText = formatInterviewSummaryText(record, token);
  const summaryHtml = formatInterviewSummaryHtml(record, token);
  const targetEmail = config.toEmail || 'cassiojosems@gmail.com';
  const timestamp = new Date().toISOString();
  const auditId = `notif_${Date.now()}`;

  // Se notificações estiverem expressamente desativadas
  if (!config.enabled) {
    return {
      success: true,
      mode: 'simulado',
      message: 'Notificações de e-mail estão desativadas na configuração.',
      timestamp,
      recipient: targetEmail,
      submissionId: record.id,
    };
  }

  // Notifica o endpoint de backend para sincronia de log
  try {
    fetch('/api/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: record.id,
        roteiro: record.roteiro,
        entrevistadoNome: record.entrevistadoNome,
        municipio: record.municipio,
        toEmail: targetEmail,
        token: token || record.token,
        summaryText,
      }),
    }).catch(() => {
      // Background ping, não bloqueia
    });
  } catch {
    // ignora
  }

  const templateParams = {
    to_email: targetEmail,
    to_name: 'Equipe HiperReforço',
    reply_to: record.contato && record.contato.includes('@') ? record.contato : targetEmail,
    subject: `[HiperReforço] Nova Resposta de Validação · Roteiro ${record.roteiro}: ${record.entrevistadoNome || 'Anônimo'}`,
    respondent_name: record.entrevistadoNome || 'Respondente Anônimo',
    respondent_role: record.entrevistadoPerfil || 'Não informado',
    respondent_location: `${record.municipio || 'Campo Grande'} · ${record.escolaOrOrgao || 'Não informado'}`,
    respondent_contact: record.contato || 'Sem contato informado',
    roteiro_code: record.roteiro,
    roteiro_title: ROTEIROS_CONFIG[record.roteiro]?.title || `Roteiro ${record.roteiro}`,
    submission_id: record.id,
    token: token || record.token || 'N/A',
    paid_out_of_pocket: record.pagouDoProprioBolso ? `Sim (${record.valorPagoDoProprioBolso || 'especificado'})` : 'Não',
    summary_content: summaryText,
    summary_html: summaryHtml,
    submission_date: new Date().toLocaleString('pt-BR'),
  };

  // Verifica se credenciais do EmailJS estão configuradas
  const hasEmailJsKeys =
    Boolean(config.serviceId && config.templateId && config.publicKey) &&
    !config.serviceId.includes('PLACEHOLDER') &&
    !config.publicKey.includes('PLACEHOLDER');

  if (hasEmailJsKeys) {
    try {
      // 1. Disparo oficial via EmailJS SDK
      await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        config.publicKey
      );

      await recordNotificationAudit({
        id: auditId,
        timestamp,
        toEmail: targetEmail,
        roteiro: record.roteiro,
        entrevistadoNome: record.entrevistadoNome || 'Anônimo',
        municipio: record.municipio || 'Campo Grande - MS',
        status: 'enviado',
        modo: 'emailjs',
        mensagem: `E-mail entregue com sucesso via EmailJS (${config.serviceId})`,
        submissionId: record.id,
        resumoPreview: summaryText.slice(0, 300),
      });

      return {
        success: true,
        mode: 'emailjs',
        message: `Notificação enviada com sucesso para ${targetEmail} via EmailJS.`,
        timestamp,
        recipient: targetEmail,
        submissionId: record.id,
      };
    } catch (err: any) {
      console.warn('Falha no envio via EmailJS SDK, tentando fallback via API REST:', err);

      // Fallback 2: Chamada direta à REST API do EmailJS
      try {
        const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: config.serviceId,
            template_id: config.templateId,
            user_id: config.publicKey,
            template_params: templateParams,
          }),
        });

        if (resp.ok) {
          await recordNotificationAudit({
            id: auditId,
            timestamp,
            toEmail: targetEmail,
            roteiro: record.roteiro,
            entrevistadoNome: record.entrevistadoNome || 'Anônimo',
            municipio: record.municipio || 'Campo Grande - MS',
            status: 'enviado',
            modo: 'emailjs_rest',
            mensagem: `E-mail entregue via REST API EmailJS`,
            submissionId: record.id,
            resumoPreview: summaryText.slice(0, 300),
          });

          return {
            success: true,
            mode: 'emailjs',
            message: `Notificação enviada via REST API EmailJS para ${targetEmail}.`,
            timestamp,
            recipient: targetEmail,
            submissionId: record.id,
          };
        }
      } catch (restErr) {
        console.warn('Fallback REST EmailJS também falhou:', restErr);
      }
    }
  }

  // Modo Simulado/Auditoria (quando chaves ainda não foram preenchidas no painel ou em ambiente de teste)
  console.info(`[HiperReforço Notificação] E-mail simulado registrado para ${targetEmail}:\n`, summaryText);

  await recordNotificationAudit({
    id: auditId,
    timestamp,
    toEmail: targetEmail,
    roteiro: record.roteiro,
    entrevistadoNome: record.entrevistadoNome || 'Anônimo',
    municipio: record.municipio || 'Campo Grande - MS',
    status: 'simulado',
    modo: hasEmailJsKeys ? 'falha_credenciais' : 'simulacao_local',
    mensagem: hasEmailJsKeys
      ? 'Chaves do EmailJS informadas retornaram erro. Registro arquivado na auditoria.'
      : 'Modo Simulado ativo (Chaves do EmailJS aguardando preenchimento no CRM). Resumo gerado e auditado com sucesso.',
    submissionId: record.id,
    resumoPreview: summaryText.slice(0, 300),
  });

  return {
    success: true,
    mode: 'simulado',
    message: `Resumo gerado e registrado na auditoria para ${targetEmail}. ${
      hasEmailJsKeys ? '(Chaves do EmailJS precisam ser verificadas)' : '(Configure suas chaves EmailJS no painel para envio real)'
    }`,
    timestamp,
    recipient: targetEmail,
    submissionId: record.id,
  };
}

/**
 * Dispara um e-mail de teste para validação imediata das credenciais pelo usuário
 */
export async function sendTestNotification(customConfig?: EmailNotificationConfig): Promise<EmailSendResult> {
  const config = customConfig || await getEmailConfig();
  const targetEmail = config.toEmail || 'cassiojosems@gmail.com';
  const timestamp = new Date().toISOString();

  const mockRecord: InterviewRecord = {
    id: `test_${Date.now()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    date: timestamp.slice(0, 10),
    municipio: 'Campo Grande - MS',
    escolaOrOrgao: 'Escola Municipal Teste / Clínica Piloto',
    entrevistadoPerfil: 'Coordenador(a) Pedagógico(a) / Terapeuta',
    entrevistadoNome: 'Entrevistado de Teste (Simulação)',
    contato: targetEmail,
    roteiro: 'F',
    status: 'agendado',
    entrevistador: 'Teste de Integração de E-mail',
    anotador: 'Sistema HiperReforço',
    duracaoMinutos: 15,
    checklistProgress: {},
    checklistNotes: {
      F0_1: 'Atende 12 crianças neurodivergentes por semana.',
      F1_1: 'Dificuldade de adesão às atividades no intervalo entre sessões.',
      F2_1: 'Já tentou apostilas físicas e PDFs enviados pelo WhatsApp.',
    },
    hipotesesTestadas: ['HS1', 'HS2', 'HS3'],
    frasesTextuais: [
      '"Os pais esquecem de fazer o reforço em casa sem um estímulo visual ou gamificado."',
    ],
    oQueSurpreendeu: 'Engajamento quando o tema do hiperfoco é utilizado.',
    tentouResolver: 'Impressão própria de folhas de exercícios.',
    pagouDoProprioBolso: true,
    valorPagoDoProprioBolso: 'R$ 120,00',
    vereditosPorHipotese: {},
    vereditoGeral: 'pendente',
    vereditoMotivoGeral: 'Teste de envio automático de e-mail.',
    proximosPassos: 'Verificar recebimento na caixa de entrada.',
    isExterna: true,
  };

  return sendSubmissionNotification(mockRecord, 'hr_teste_validacao_32chars_ok');
}

/**
 * Lista o histórico recente de notificações auditadas
 */
export async function listNotificationAudits(): Promise<NotificationAuditRecord[]> {
  try {
    const snap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
    return snap.docs
      .map((d) => d.data() as NotificationAuditRecord)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Erro ao listar notificações auditadas:', err);
    return [];
  }
}
