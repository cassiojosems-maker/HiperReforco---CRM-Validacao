import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { InterviewRecord, RoteiroType } from '../types/validation';
import { INITIAL_SEED_INTERVIEWS } from '../data/cadernoData';
import { isRecordStale, getDaysSinceLastUpdate } from '../utils/reminderUtils';

const STORAGE_CACHE_KEY = 'hiperreforco_validation_crm_v1';
const CRM_COLLECTION = 'validacao_entrevistas';
const RESPOSTAS_COLLECTION = 'validacao_respostas';
const TOKENS_COLLECTION = 'validacao_tokens';

/**
 * Leitura de Cache Offline (mantido apenas como cache local temporário, nunca como fonte da verdade)
 */
export function getStoredInterviews(): InterviewRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) {
      return INITIAL_SEED_INTERVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_SEED_INTERVIEWS;
    }
    return parsed;
  } catch (err) {
    console.warn('Falha ao ler cache offline do localStorage:', err);
    return INITIAL_SEED_INTERVIEWS;
  }
}

/**
 * Salva no Firestore (Fonte da Verdade) e sincroniza no cache offline
 */
export function saveStoredInterviews(interviews: InterviewRecord[]): void {
  // 1. Atualiza cache offline
  try {
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(interviews));
  } catch (err) {
    console.warn('Erro ao atualizar cache local:', err);
  }

  // 2. Persiste assincronamente no Firestore
  (async () => {
    try {
      for (const record of interviews) {
        if (!record.id) continue;
        const ref = doc(db, CRM_COLLECTION, record.id);
        await setDoc(ref, {
          ...record,
          updatedAt: record.updatedAt || new Date().toISOString(),
        }, { merge: true });
      }
    } catch (error) {
      console.warn('Falha na persistência assíncrona com Firestore:', error);
    }
  })();
}

/**
 * Salva uma única entrevista no Firestore
 */
export async function saveInterviewToFirestore(record: InterviewRecord): Promise<void> {
  const path = `${CRM_COLLECTION}/${record.id}`;
  try {
    const ref = doc(db, CRM_COLLECTION, record.id);
    await setDoc(ref, {
      ...record,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Atualiza cache local
    const current = getStoredInterviews();
    const exists = current.some((i) => i.id === record.id);
    const updated = exists ? current.map((i) => (i.id === record.id ? record : i)) : [record, ...current];
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Remove entrevista do Firestore e do cache
 */
export async function deleteInterviewFromFirestore(id: string): Promise<void> {
  const path = `${CRM_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CRM_COLLECTION, id));
    const current = getStoredInterviews();
    const filtered = current.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Assinatura em Tempo Real do CRM no Firestore
 */
export function subscribeToCrmInterviews(
  onUpdate: (interviews: InterviewRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  const ref = collection(db, CRM_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: InterviewRecord[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as InterviewRecord);
      });

      // Ordena por data decrescente
      records.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

      // Atualiza cache local de leitura
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(records));
      } catch (e) {
        // ignora
      }

      onUpdate(records);
    },
    (error) => {
      console.error('Erro na subscrição de validacao_entrevistas:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Assinatura em tempo real das submissões públicas (validacao_respostas)
 */
export function subscribeToPublicSubmissions(
  onUpdate: (submissions: InterviewRecord[]) => void
): () => void {
  const ref = collection(db, RESPOSTAS_COLLECTION);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: InterviewRecord[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as InterviewRecord);
      });
      records.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      onUpdate(records);
    },
    (error) => {
      console.warn('Aviso ao ouvir validacao_respostas:', error);
    }
  );
}

/**
 * Submissão de Formulário Público para a coleção validacao_respostas
 */
export async function submitPublicFormToFirestore(
  record: InterviewRecord,
  token?: string
): Promise<void> {
  const path = `${RESPOSTAS_COLLECTION}/${record.id}`;
  try {
    const payload = {
      ...record,
      token: token || record.id,
      submittedAt: new Date().toISOString(),
    };

    // 1. Grava a resposta na coleção oficial de submissões públicas
    await setDoc(doc(db, RESPOSTAS_COLLECTION, record.id), payload);

    // 2. Se houver token, marca como consumido
    if (token) {
      await consumeValidationToken(token, record.id);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Gerenciamento de Tokens de Convite Único (2.4)
 */
export interface ValidationTokenData {
  token: string;
  roteiro: RoteiroType;
  status: 'pendente' | 'consumido';
  usado: boolean;
  criadoEm: string;
  criadoPor?: string;
  consumidoEm?: string | null;
  respostaId?: string | null;
}

export async function createValidationToken(
  roteiro: RoteiroType,
  userEmail?: string
): Promise<string> {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const token = `hr_${Date.now().toString(36)}_${randomPart}`;
  const path = `${TOKENS_COLLECTION}/${token}`;

  const tokenData: ValidationTokenData = {
    token,
    roteiro,
    status: 'pendente',
    usado: false,
    criadoEm: new Date().toISOString(),
    criadoPor: userEmail || 'pesquisador',
    consumidoEm: null,
    respostaId: null,
  };

  try {
    await setDoc(doc(db, TOKENS_COLLECTION, token), tokenData);
    return token;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function verifyValidationToken(
  token: string
): Promise<{ valid: boolean; used: boolean; roteiro?: RoteiroType; error?: string }> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, used: false, error: 'Token ausente ou inválido.' };
  }

  const path = `${TOKENS_COLLECTION}/${token}`;
  try {
    const snap = await getDoc(doc(db, TOKENS_COLLECTION, token));
    if (!snap.exists()) {
      return { valid: false, used: false, error: 'Token de convite não encontrado.' };
    }

    const data = snap.data() as ValidationTokenData;
    if (data.usado || data.status === 'consumido') {
      return { valid: false, used: true, error: 'Este link já foi utilizado para envio de respostas.' };
    }

    return { valid: true, used: false, roteiro: data.roteiro };
  } catch (error) {
    console.error('Erro ao verificar token no Firestore:', error);
    return { valid: false, used: false, error: 'Falha ao validar o token no servidor.' };
  }
}

export async function consumeValidationToken(
  token: string,
  submissionId: string
): Promise<void> {
  const path = `${TOKENS_COLLECTION}/${token}`;
  try {
    const ref = doc(db, TOKENS_COLLECTION, token);
    await updateDoc(ref, {
      usado: true,
      status: 'consumido',
      consumidoEm: new Date().toISOString(),
      respostaId: submissionId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listValidationTokens(): Promise<ValidationTokenData[]> {
  const path = TOKENS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, TOKENS_COLLECTION));
    const list: ValidationTokenData[] = [];
    snap.forEach((d) => list.push(d.data() as ValidationTokenData));
    list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    return list;
  } catch (error) {
    console.warn('Erro ao listar tokens:', error);
    return [];
  }
}

export function resetToSeedData(): InterviewRecord[] {
  localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(INITIAL_SEED_INTERVIEWS));
  saveStoredInterviews(INITIAL_SEED_INTERVIEWS);
  return INITIAL_SEED_INTERVIEWS;
}

/**
 * Exporta para CSV UTF-8 com BOM (\uFEFF)
 */
export function exportToCsvUtf8Bom(interviews: InterviewRecord[]): void {
  const headers = [
    'ID',
    'Data',
    'Alerta Follow-up (>7d)',
    'Dias sem Atualização',
    'Município',
    'Escola / Órgão',
    'Perfil do Entrevistado',
    'Nome / Identificador',
    'Tempo de Casa',
    'Roteiro',
    'Canal / Eixo',
    'Status CRM',
    'Entrevistador',
    'Anotador',
    'Duração (min)',
    'H1 Veredito',
    'H2 Veredito',
    'H3 Veredito',
    'H4 Veredito',
    'H5 Veredito',
    'H6 Veredito',
    'HS1 Veredito (Saúde)',
    'HS2 Veredito (Saúde)',
    'HS3 Veredito (Retenção)',
    'HS4 Veredito (Compra)',
    'HS5 Veredito (Ancoragem)',
    'Veredito Geral',
    'Pagou do Próprio Bolso?',
    'Valor Pago Declarado',
    'Frase Textual 1',
    'Frase Textual 2',
    'Frase Textual 3',
    'Frase Textual 4',
    'Frase Textual 5',
    'O que Surpreendeu',
    'Já Tentou Resolver',
    'Contato',
    'Próximos Passos',
    'Tags',
  ];

  const escapeCsv = (val: string | number | boolean | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = interviews.map((item) => {
    const vH1 = item.vereditosPorHipotese?.H1?.veredito || '-';
    const vH2 = item.vereditosPorHipotese?.H2?.veredito || '-';
    const vH3 = item.vereditosPorHipotese?.H3?.veredito || '-';
    const vH4 = item.vereditosPorHipotese?.H4?.veredito || '-';
    const vH5 = item.vereditosPorHipotese?.H5?.veredito || '-';
    const vH6 = item.vereditosPorHipotese?.H6?.veredito || '-';
    const vHS1 = item.vereditosPorHipotese?.HS1?.veredito || '-';
    const vHS2 = item.vereditosPorHipotese?.HS2?.veredito || '-';
    const vHS3 = item.vereditosPorHipotese?.HS3?.veredito || '-';
    const vHS4 = item.vereditosPorHipotese?.HS4?.veredito || '-';
    const vHS5 = item.vereditosPorHipotese?.HS5?.veredito || '-';

    const f1 = item.frasesTextuais?.[0] || '';
    const f2 = item.frasesTextuais?.[1] || '';
    const f3 = item.frasesTextuais?.[2] || '';
    const f4 = item.frasesTextuais?.[3] || '';
    const f5 = item.frasesTextuais?.[4] || '';

    const staleAlert = isRecordStale(item) ? 'SIM (>7d)' : 'EM DIA';
    const daysStale = getDaysSinceLastUpdate(item);
    const canalNome = item.canal === 'saude' || item.roteiro === 'G' ? 'Saúde (Clínica)' : 'Educação';

    return [
      escapeCsv(item.id),
      escapeCsv(item.date),
      escapeCsv(staleAlert),
      escapeCsv(daysStale),
      escapeCsv(item.municipio),
      escapeCsv(item.escolaOrOrgao),
      escapeCsv(item.entrevistadoPerfil),
      escapeCsv(item.entrevistadoNome || ''),
      escapeCsv(item.tempoDeCasa || ''),
      escapeCsv(item.roteiro),
      escapeCsv(canalNome),
      escapeCsv(item.status),
      escapeCsv(item.entrevistador),
      escapeCsv(item.anotador),
      escapeCsv(item.duracaoMinutos),
      escapeCsv(vH1),
      escapeCsv(vH2),
      escapeCsv(vH3),
      escapeCsv(vH4),
      escapeCsv(vH5),
      escapeCsv(vH6),
      escapeCsv(vHS1),
      escapeCsv(vHS2),
      escapeCsv(vHS3),
      escapeCsv(vHS4),
      escapeCsv(vHS5),
      escapeCsv(item.vereditoGeral),
      escapeCsv(item.pagouDoProprioBolso ? 'SIM' : 'NÃO'),
      escapeCsv(item.valorPagoDoProprioBolso || ''),
      escapeCsv(f1),
      escapeCsv(f2),
      escapeCsv(f3),
      escapeCsv(f4),
      escapeCsv(f5),
      escapeCsv(item.oQueSurpreendeu || ''),
      escapeCsv(item.tentouResolver || ''),
      escapeCsv(item.contato || ''),
      escapeCsv(item.proximosPassos || ''),
      escapeCsv(item.tags?.join(', ') || ''),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `hiperreforco_caderno_validacao_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJson(interviews: InterviewRecord[]): void {
  const jsonContent = JSON.stringify(interviews, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `hiperreforco_backup_crm_${now}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
