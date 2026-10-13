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

export const HIDE_DEMO_KEY = 'hiperreforco_hide_demo';

export function getStoredInterviews(): InterviewRecord[] {
  try {
    const hideDemo = localStorage.getItem(HIDE_DEMO_KEY) === 'true';
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return hideDemo ? [] : INITIAL_SEED_INTERVIEWS.map(s => ({...s, isDemo: true}));
    const parsed = JSON.parse(raw);
    return hideDemo ? parsed.filter((i: InterviewRecord) => !i.isDemo) : parsed;
  } catch {
    return INITIAL_SEED_INTERVIEWS.map(s => ({...s, isDemo: true}));
  }
}

function removeUndefinedFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = removeUndefinedFields(val);
    }
  }
  return cleaned;
}

export async function saveInterviewToFirestore(record: InterviewRecord): Promise<void> {
  const path = `${CRM_COLLECTION}/${record.id}`;
  try {
    const cleaned = removeUndefinedFields({ ...record, updatedAt: serverTimestamp() });
    await setDoc(doc(db, CRM_COLLECTION, record.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInterviewFromFirestore(id: string): Promise<void> {
  const path = `${CRM_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CRM_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCrmInterviews(onUpdate: (records: InterviewRecord[]) => void, onError?: (err: any) => void): () => void {
  return onSnapshot(collection(db, CRM_COLLECTION), (snapshot) => {
    const records = snapshot.docs.map(d => d.data() as InterviewRecord);
    records.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(records));
    onUpdate(records);
  }, onError);
}

export function subscribeToPublicSubmissions(onUpdate: (submissions: InterviewRecord[]) => void): () => void {
  return onSnapshot(collection(db, RESPOSTAS_COLLECTION), (snapshot) => {
    onUpdate(snapshot.docs.map(d => d.data() as InterviewRecord));
  });
}

export async function submitPublicFormToFirestore(record: InterviewRecord, token?: string): Promise<void> {
  try {
    const cleaned = removeUndefinedFields({ ...record, token, submittedAt: serverTimestamp() });
    await setDoc(doc(db, RESPOSTAS_COLLECTION, record.id), cleaned);
    if (token) await consumeValidationToken(token, record.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, RESPOSTAS_COLLECTION);
  }
}

export interface ValidationTokenData {
  token: string;
  roteiro: RoteiroType;
  status: 'pendente' | 'consumido';
  usado: boolean;
  criadoEm: string;
}

export async function createValidationToken(roteiro: RoteiroType): Promise<string> {
  const token = `hr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  await setDoc(doc(db, TOKENS_COLLECTION, token), { token, roteiro, status: 'pendente', usado: false, criadoEm: new Date().toISOString() });
  return token;
}

export async function verifyValidationToken(token: string): Promise<{ valid: boolean; used: boolean; roteiro?: RoteiroType; error?: string }> {
  const snap = await getDoc(doc(db, TOKENS_COLLECTION, token));
  if (!snap.exists()) return { valid: false, used: false, error: 'Token inválido.' };
  const data = snap.data() as ValidationTokenData;
  return data.usado ? { valid: false, used: true, error: 'Token já usado.' } : { valid: true, used: false, roteiro: data.roteiro };
}

export async function consumeValidationToken(token: string, submissionId: string): Promise<void> {
  await updateDoc(doc(db, TOKENS_COLLECTION, token), { usado: true, status: 'consumido', consumidoEm: serverTimestamp(), respostaId: submissionId });
}

export async function listValidationTokens(): Promise<ValidationTokenData[]> {
  const snap = await getDocs(collection(db, TOKENS_COLLECTION));
  return snap.docs.map(d => d.data() as ValidationTokenData).sort((a,b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export function exportToCsvUtf8Bom(interviews: InterviewRecord[]): void {
  // Mantida interface original de exportação
  const headers = ['ID', 'Data', 'Município', 'Escola/Órgão', 'Perfil', 'Nome', 'Status', 'Veredito Geral'];
  const rows = interviews.map(i => [i.id, i.date, i.municipio, i.escolaOrOrgao, i.entrevistadoPerfil, i.entrevistadoNome, i.status, i.vereditoGeral].join(';'));
  const blob = new Blob(['\uFEFF' + [headers.join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hiperreforco_export_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

export function exportToJson(interviews: InterviewRecord[]): void {
  const blob = new Blob([JSON.stringify(interviews, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hiperreforco_backup_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
}

export function resetToSeedData(): InterviewRecord[] {
  return INITIAL_SEED_INTERVIEWS.map(s => ({...s, isDemo: true}));
}
