import { InterviewRecord } from '../types/validation';
import { INITIAL_SEED_INTERVIEWS } from '../data/cadernoData';
import { isRecordStale, getDaysSinceLastUpdate } from '../utils/reminderUtils';

const STORAGE_KEY = 'hiperreforco_validation_crm_v1';

export function getStoredInterviews(): InterviewRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_INTERVIEWS));
      return INITIAL_SEED_INTERVIEWS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_INTERVIEWS));
      return INITIAL_SEED_INTERVIEWS;
    }

    // Mescla seeds ausentes (ex: novos casos de demonstração de lembrete)
    let hasNewSeeds = false;
    const existingIds = new Set(parsed.map((p) => p.id));
    const merged = [...parsed];

    for (const seed of INITIAL_SEED_INTERVIEWS) {
      if (!existingIds.has(seed.id)) {
        merged.push(seed);
        hasNewSeeds = true;
      }
    }

    if (hasNewSeeds) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return parsed;
  } catch (err) {
    console.error('Erro ao ler localStorage:', err);
    return INITIAL_SEED_INTERVIEWS;
  }
}

export function saveStoredInterviews(interviews: InterviewRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

export function resetToSeedData(): InterviewRecord[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_INTERVIEWS));
  return INITIAL_SEED_INTERVIEWS;
}

/**
 * Exporta para CSV UTF-8 com BOM (\uFEFF)
 * Conforme exigido no caderno (Pág. 12, item 11.3) para compatibilidade nativa com Excel
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

  // UTF-8 Byte Order Mark
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
