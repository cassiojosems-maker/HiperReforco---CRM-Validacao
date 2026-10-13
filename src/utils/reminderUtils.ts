import { InterviewRecord } from '../types/validation';

export const STALE_DAYS_THRESHOLD = 7;

/**
 * Calcula o número de dias decorridos desde a última atualização do registro.
 * Considera `updatedAt` ou `date` como referência.
 */
export function getDaysSinceLastUpdate(record: InterviewRecord): number {
  const timestampStr = record.updatedAt || record.createdAt || record.date;
  if (!timestampStr) return 0;

  const lastDate = new Date(timestampStr);
  if (isNaN(lastDate.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Determina se a entrevista está estagnada (sem atualização há mais de 7 dias),
 * excluindo registros já arquivados/descartados.
 */
export function isRecordStale(record: InterviewRecord): boolean {
  if (record.status === 'descartado') return false;
  const days = getDaysSinceLastUpdate(record);
  return days >= STALE_DAYS_THRESHOLD;
}

/**
 * Retorna classe de estilo e texto explicativo para badge de alerta
 */
export function getStaleBadgeInfo(record: InterviewRecord): {
  isStale: boolean;
  days: number;
  label: string;
  badgeClass: string;
  borderClass: string;
} {
  const days = getDaysSinceLastUpdate(record);
  const isStale = isRecordStale(record);

  if (!isStale) {
    return {
      isStale: false,
      days,
      label: days === 0 ? 'Atualizado hoje' : `${days}d atrás`,
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      borderClass: '',
    };
  }

  // Crítico: mais de 14 dias
  if (days >= 14) {
    return {
      isStale: true,
      days,
      label: `⚠️ Parado há ${days} dias`,
      badgeClass: 'bg-rose-950/90 text-rose-300 border-rose-700 font-bold animate-pulse',
      borderClass: 'border-rose-600/70 shadow-rose-950/30',
    };
  }

  // Alerta: entre 7 e 13 dias
  return {
    isStale: true,
    days,
    label: `⚠️ Sem contato há ${days}d`,
    badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-700 font-semibold',
    borderClass: 'border-amber-600/60 shadow-amber-950/30',
  };
}
