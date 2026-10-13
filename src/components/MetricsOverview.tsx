import React from 'react';
import { InterviewRecord } from '../types/validation';
import { METAS_VALIDACAO, HIPOTESES_DATA } from '../data/cadernoData';
import { isRecordStale } from '../utils/reminderUtils';
import {
  ShieldAlert,
  Wallet,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

interface MetricsOverviewProps {
  interviews: InterviewRecord[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ interviews }) => {
  // Lembretes de estagnação de funil (> 7 dias)
  const staleCount = interviews.filter(isRecordStale).length;

  // Contagens por segmento
  const countAEE = interviews.filter((i) => i.roteiro === 'A').length;
  const countB2G = interviews.filter((i) => i.roteiro === 'B').length;
  const countPiloto = interviews.filter((i) => i.roteiro === 'C').length;
  const countFamilia = interviews.filter((i) => i.roteiro === 'D').length;
  const countClinica = interviews.filter((i) => i.roteiro === 'F').length;

  // Cidades únicas entrevistadas
  const municipiosUnicos = Array.from(new Set(interviews.map((i) => i.municipio.trim()).filter(Boolean)));
  const municipiosForaDeCG = municipiosUnicos.filter(
    (m) => !m.toLowerCase().includes('campo grande')
  ).length;

  // Dor comportamental: pagou do próprio bolso
  const pagouBolsoCount = interviews.filter((i) => i.pagouDoProprioBolso).length;
  const pagouBolsoPercent = interviews.length > 0 ? Math.round((pagouBolsoCount / interviews.length) * 100) : 0;

  // H4 status (a rota comercial B2G)
  const h4Records = interviews.filter((i) => i.vereditosPorHipotese?.H4);
  const h4Validadas = h4Records.filter((i) => i.vereditosPorHipotese?.H4?.veredito === 'valida').length;

  // HS3 status (a chave comercial do Canal Saúde: Venda = Retenção de Pacientes)
  const hs3Records = interviews.filter((i) => i.vereditosPorHipotese?.HS3);
  const hs3Validadas = hs3Records.filter((i) => i.vereditosPorHipotese?.HS3?.veredito === 'valida').length;

  return (
    <div className="space-y-4">
      {/* Banner da Regra de Ouro */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-4 shadow-lg shadow-indigo-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600/20 p-2.5 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Regra de Ouro Needs-First
                </span>
                <span className="rounded bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-mono text-indigo-200">
                  Pilar Estratégia · Outubro 2026
                </span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-white tracking-wide">
                <span className="text-emerald-400">PASSADO = DADO</span> · <span className="text-amber-400">FUTURO E CONDICIONAL = OPINIÃO</span>
              </p>
              <p className="text-xs text-slate-300">
                Se a pergunta pode ser respondida com "sim, seria ótimo", está errada. Entrevistador deve falar menos de 20% do tempo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-slate-300">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>H4 é a chave:</strong> Testa cessão experimental + atestado de capacidade técnica (a rota comercial inteira).
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Entrevistas Totais */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total de Entrevistas</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
              {interviews.length}
            </span>
            <span className="text-xs text-slate-400">de 36 meta total</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((interviews.length / 36) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Municípios cobertos: <strong className="text-slate-200">{municipiosUnicos.length}</strong> ({municipiosForaDeCG} fora da capital)
          </p>
        </div>

        {/* Card 2: H4 Rota Comercial */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">H4 · Rota Comercial (B2G)</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
              {h4Validadas} / {h4Records.length}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {h4Records.length > 0 ? `${Math.round((h4Validadas / h4Records.length) * 100)}% validadas` : 'Sem testes'}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${h4Records.length > 0 ? (h4Validadas / h4Records.length) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Cessão sem ônus → Atestado de capacidade técnica formal
          </p>
        </div>

        {/* Card 3: Dor Comportamental por Dinheiro */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gasto do Próprio Bolso (H1/D)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
              {pagouBolsoCount}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              {pagouBolsoPercent}% da amostra
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${pagouBolsoPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Quem tirou dinheiro do bolso tem dor comprovada por ação
          </p>
        </div>

        {/* Card 4: Saturação & Progresso dos Públicos */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saúde do Funil & Follow-up</span>
            {staleCount > 0 ? (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {staleCount} &gt; 7 dias
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                100% em dia
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Prof. AEE (Roteiro A)</span>
              <span className="font-mono text-indigo-300">{countAEE}/12</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Secretarias (Roteiro B)</span>
              <span className="font-mono text-indigo-300">{countB2G}/6 mun.</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Piloto Ativo (Roteiro C)</span>
              <span className="font-mono text-indigo-300">{countPiloto}/10</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Famílias B2C (Roteiro D)</span>
              <span className="font-mono text-indigo-300">{countFamilia}/8</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-teal-300 font-semibold">Clínicas / Saúde (Rot. G)</span>
              <span className="font-mono text-teal-300 font-bold">{countClinica}/18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Termômetro Rápido das Hipóteses: Educação & Clínicas */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Termômetro de Validação de Hipóteses (Pilar Estratégia)
            </h4>
            <p className="text-[11px] text-slate-400">
              Evidências comportamentais apuradas em campo nos dois eixos de atuação.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Eixo Educação (H1-H6)
            </span>
            <span className="flex items-center gap-1.5 text-teal-300 font-semibold">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Eixo Clínica / Saúde (HS1-HS5)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {HIPOTESES_DATA.map((h) => {
            const relevant = interviews.filter((i) => i.vereditosPorHipotese?.[h.id]);
            const val = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'valida').length;
            const inv = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'invalida').length;
            const inc = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'inconclusivo').length;
            const isSaude = h.canal === 'saude';

            return (
              <div
                key={h.id}
                className={`rounded-lg border p-2.5 transition-colors ${
                  h.isPrioritaria && !isSaude
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : h.isPrioritaria && isSaude
                    ? 'border-teal-500/60 bg-teal-950/30 ring-1 ring-teal-500/30'
                    : isSaude
                    ? 'border-teal-900/60 bg-teal-950/15'
                    : h.isAnexoNaoExecutado
                    ? 'border-amber-500/30 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-extrabold font-mono text-xs ${isSaude ? 'text-teal-300' : 'text-white'}`}>
                    {h.id}
                  </span>
                  {h.isPrioritaria && !isSaude && (
                    <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1 rounded font-bold uppercase">
                      Rota B2G
                    </span>
                  )}
                  {h.isPrioritaria && isSaude && (
                    <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1 rounded font-bold uppercase">
                      Retenção
                    </span>
                  )}
                  {h.isAnexoNaoExecutado && (
                    <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded font-bold uppercase">
                      Anexo
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] font-medium text-slate-300 truncate" title={h.titulo}>
                  {h.titulo}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="text-emerald-400 font-semibold" title="Validações">{val}✓</span>
                  <span className="text-rose-400 font-semibold" title="Invalidações">{inv}✗</span>
                  <span className="text-amber-400 font-semibold" title="Inconclusivo">{inc}?</span>
                  <span className="ml-auto text-slate-400">({relevant.length})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
