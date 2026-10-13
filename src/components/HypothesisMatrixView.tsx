import React, { useState } from 'react';
import { InterviewRecord } from '../types/validation';
import {
  HIPOTESES_DATA,
  PERGUNTAS_PROIBIDAS,
} from '../data/cadernoData';
import {
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  AlertTriangle,
  Lock,
  Search,
  Award,
} from 'lucide-react';

interface HypothesisMatrixViewProps {
  interviews: InterviewRecord[];
}

export const HypothesisMatrixView: React.FC<HypothesisMatrixViewProps> = ({ interviews }) => {
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCanal, setSelectedCanal] = useState<'all' | 'educacao' | 'saude'>('all');

  const filteredHypotheses = HIPOTESES_DATA.filter(
    (h) => selectedCanal === 'all' || h.canal === selectedCanal
  );

  const filteredProhibited = PERGUNTAS_PROIBIDAS.filter(
    (p) =>
      p.naoPergunte.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.pergunteIsto.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.contexto.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Cabeçalho da Matriz */}
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600/20 p-2.5 text-indigo-400 border border-indigo-500/30">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white font-['Plus_Jakarta_Sans']">
                Matriz de Hipóteses & Critérios de Leitura (Pilar Estratégia)
              </h2>
              <p className="text-xs text-slate-300">
                "Sem hipótese declarada antes da primeira entrevista, não há como dizer se validou ou invalidou — só sobra impressão." (Caderno de Validação, Pág. 2)
              </p>
            </div>
          </div>

          {/* Abas de Filtro de Canal/Eixo */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setSelectedCanal('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCanal === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas (H1-H6 + HS1-HS5)
            </button>
            <button
              onClick={() => setSelectedCanal('educacao')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCanal === 'educacao'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏫 Eixo Educação
            </button>
            <button
              onClick={() => setSelectedCanal('saude')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCanal === 'saude'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-teal-300'
              }`}
            >
              🩺 Eixo Clínica / Saúde
            </button>
          </div>
        </div>
      </div>

      {/* Grid das Hipóteses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span>Hipóteses Declaradas & Sinais de Campo ({filteredHypotheses.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            {selectedCanal === 'saude'
              ? 'Canal Clínicas & Consultórios Privados'
              : selectedCanal === 'educacao'
              ? 'Canal Educação Básica & Redes Públicas (B2G)'
              : 'Mostrando ambos os eixos de validação'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHypotheses.map((hip) => {
            const relevant = interviews.filter((i) => i.vereditosPorHipotese?.[hip.id]);
            const val = relevant.filter((i) => i.vereditosPorHipotese?.[hip.id]?.veredito === 'valida').length;
            const inv = relevant.filter((i) => i.vereditosPorHipotese?.[hip.id]?.veredito === 'invalida').length;
            const inc = relevant.filter((i) => i.vereditosPorHipotese?.[hip.id]?.veredito === 'inconclusivo').length;

            return (
              <div
                key={hip.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between shadow-md transition-all ${
                  hip.isComercialKey
                    ? 'border-teal-500/60 bg-gradient-to-b from-teal-950/30 via-slate-900 to-slate-900 ring-1 ring-teal-500/40'
                    : hip.isPrioritaria
                    ? 'border-rose-500/60 bg-gradient-to-b from-rose-950/20 via-slate-900 to-slate-900 ring-1 ring-rose-500/30'
                    : hip.canal === 'saude'
                    ? 'border-teal-900/60 bg-slate-900/90 hover:border-teal-700/60'
                    : hip.isAnexoNaoExecutado
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Badge de ID, Canal e Rótulo */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
                        hip.canal === 'saude' ? 'bg-teal-950 text-teal-300 border border-teal-700' : 'bg-slate-800 text-white border border-slate-700'
                      }`}>
                        {hip.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {hip.canal === 'saude' ? '🩺 Saúde' : '🏫 Educação'}
                      </span>
                    </div>

                    {hip.isComercialKey && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/40 flex items-center gap-1">
                        <Award className="h-3 w-3 text-teal-400" />
                        Chave Comercial Clínicas (Retenção)
                      </span>
                    )}
                    {hip.isPrioritaria && !hip.isComercialKey && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        Mais Crítica (Rota B2G)
                      </span>
                    )}
                    {hip.isAnexoNaoExecutado && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Não Executada
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {hip.titulo}
                    </h4>
                    <p className="mt-1 text-xs text-slate-300 italic">
                      "{hip.declaracao}"
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Causa × Efeito a Observar:
                      </span>
                      <p className="text-slate-200 text-[11px] font-medium">
                        {hip.causaEfeito}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Valida se:
                      </span>
                      <p className="text-emerald-200/90 text-[11px]">
                        {hip.criterioValida}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Invalida se:
                      </span>
                      <p className="text-rose-200/90 text-[11px]">
                        {hip.criterioInvalida}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placar ao Vivo das Evidências Coletadas */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Placar de Campo:</span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      {val} Valida
                    </span>
                    <span className="text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      {inv} Invalida
                    </span>
                    <span className="text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      {inc} Inconc.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção Especial: Anexo H6 & Guarda-Rails Cumulativos */}
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Anexo H6 · Expansão para Reforço Escolar (VALIDAR H6 ≠ EXECUTAR H6)
            </h3>
            <p className="text-xs text-slate-300">
              Hipótese registrada e NÃO executada. Expansão de público antes de receita na frente principal troca um problema difícil por um problema novo.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Regra 11.7: Critérios Cumulativos de Ativação Pré-Comprometida
          </h4>
          <p className="text-xs text-slate-300">
            H6 só altera o posicionamento se, <strong>CUMULATIVAMENTE</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">
              <span className="font-mono font-bold text-amber-400 block mb-1">Condição (a)</span>
              <p className="text-slate-200">
                Ao menos <strong>3 professoras do piloto</strong> criarem perfil de aluno típico sem indução no sistema.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs">
              <span className="font-mono font-bold text-amber-400 block mb-1">Condição (b)</span>
              <p className="text-slate-200">
                Ao menos <strong>5 famílias de alunos típicos</strong> relatarem gasto efetivo com reforço nos últimos 12 meses.
              </p>
            </div>

            <div className="rounded-lg border border-rose-900/60 bg-rose-950/20 p-3 text-xs ring-1 ring-rose-500/40">
              <span className="font-mono font-bold text-rose-300 block mb-1">Condição (c) [GUARDA-RAIL]</span>
              <p className="text-rose-200 font-semibold">
                Houver o <strong>primeiro contrato B2G assinado</strong> com prefeitura. Enquanto (c) não ocorrer, H6 permanece congelada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Especial: Marco Regulatório & Ético do Canal Saúde (Resolução CFP nº 31/2022) */}
      <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-950/30 via-slate-900 to-slate-900 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-400 border border-teal-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">
              Marco Regulatório do Canal Saúde · Resolução CFP nº 31/2022 & Ética Multiprofissional
            </h3>
            <p className="text-xs text-slate-300">
              Blindagem jurídica e deontológica para psicólogos, neuropsicopedagogos, terapeutas ocupacionais e fonoaudiólogos.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <span className="font-mono font-bold text-teal-300 block mb-1">
                Artigo 4º · Recurso Complementar
              </span>
              <p className="text-slate-300">
                O HiperReforço é classificado estritamente como <strong>recurso pedagógico complementar</strong> e ferramenta de engajamento lúdico.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <span className="font-mono font-bold text-teal-300 block mb-1">
                Não é Teste Psicológico (SATEPSI)
              </span>
              <p className="text-slate-300">
                Os relatórios gerados registram <strong>desempenho em tarefas e engajamento temático</strong>, jamais avaliação psicológica privativa ou escores diagnósticos.
              </p>
            </div>
            <div className="rounded-lg border border-teal-800/60 bg-teal-950/20 p-3 ring-1 ring-teal-500/30">
              <span className="font-mono font-bold text-teal-200 block mb-1">
                A Hipótese Comercial HS3
              </span>
              <p className="text-teal-100">
                A venda para clínicas <strong>é retenção de pacientes</strong>: relatórios de tarefas inter-sessões mantêm a família engajada nos 90 dias críticos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela das Perguntas Proibidas vs. O Que Perguntar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>As Perguntas Proibidas (Guia Anti-Viés de Campo)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Perguntas que parecem produtivas mas destroem o dado colhido ao provocar simpatia em vez de comportamento.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar pergunta proibida..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 text-rose-300">Não Pergunte (Falha)</th>
                <th className="p-3 text-slate-400">Por Que Falha</th>
                <th className="p-3 text-emerald-300">Pergunte Isto (Dado Real)</th>
                <th className="p-3 text-slate-400">Contexto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProhibited.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-3 font-semibold text-rose-200 line-through">
                    "{item.naoPergunte}"
                  </td>
                  <td className="p-3 text-slate-300 text-[11px]">
                    {item.porQueFalha}
                  </td>
                  <td className="p-3 font-semibold text-emerald-300">
                    "{item.pergunteIsto}"
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    {item.contexto}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regras Operacionais da Dupla */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <span>Regras Operacionais da Dupla de Campo (Item 9)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <strong className="text-white block mb-1">1. Ir sempre em dupla</strong>
            Uma pessoa entrevista e lê os sinais não verbais; a outra anota o verbal sem interromper.
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <strong className="text-white block mb-1">2. Não usar formulário em live</strong>
            Formulário produz resposta curta e cortês; conversa aberta produz história e dado comportamental.
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <strong className="text-white block mb-1">3. Registrar frases textuais</strong>
            Preencha com as palavras exatas do entrevistado, não com as suas interpretações.
          </div>
        </div>
      </div>
    </div>
  );
};
