import React from 'react';
import { InterviewRecord } from '../types/validation';
import { HIPOTESES_DATA } from '../data/cadernoData';
import {
  FileText,
  Printer,
  Download,
  Building2,
  Quote,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';

interface ExecutiveReportViewProps {
  interviews: InterviewRecord[];
  onExportCsv: () => void;
}

export const ExecutiveReportView: React.FC<ExecutiveReportViewProps> = ({
  interviews,
  onExportCsv,
}) => {
  const municipios = Array.from(new Set(interviews.map((i) => i.municipio.trim()).filter(Boolean)));
  const pagouBolso = interviews.filter((i) => i.pagouDoProprioBolso);
  const totalValidadas = interviews.filter((i) => i.vereditoGeral === 'valida').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:m-0">
      {/* Barra de Ações Superior (Oculta na impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl print:hidden">
        <div>
          <span className="rounded bg-indigo-950 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase">
            Documento de Governança
          </span>
          <h2 className="mt-1 text-base font-extrabold text-white">
            Dossiê Executivo de Validação de Campo
          </h2>
          <p className="text-xs text-slate-400">
            Padrão pericial para comprovação de evidências junto a editais (Centelha / FINEP / Fundect) e C-Level.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-indigo-400" />
            <span>Imprimir / Gerar PDF</span>
          </button>
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV (BOM)</span>
          </button>
        </div>
      </div>

      {/* Relatório Formatado / Dossiê (Print Ready) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6 print:border-none print:bg-white print:text-slate-900 print:p-0 print:shadow-none">
        {/* Cabeçalho Oficial do Dossiê */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white print:text-slate-900 text-xl font-['Plus_Jakarta_Sans']">
                  Hiper<span className="text-indigo-400 print:text-indigo-600">Reforço</span>
                </span>
                <span className="text-xs font-mono text-slate-400 print:text-slate-600">
                  · EdTech Inclusiva
                </span>
              </div>
              <h1 className="mt-2 text-lg font-bold text-white print:text-slate-900">
                Dossiê de Validação de Campo · Pilar Estratégia
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Metodologia Needs-First: Hipóteses H1 a H6, Rota Comercial B2G e Análise Comportamental
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 print:text-slate-600 font-mono">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>Atualizado: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="mt-1">
                Amostra: <strong>{interviews.length} entrevistas</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Executivo das Hipóteses */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800">
            1. Síntese do Teste de Hipóteses
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-800 print:border-slate-300">
                <tr>
                  <th className="p-3"># Hipótese</th>
                  <th className="p-3">Causa × Efeito Observada</th>
                  <th className="p-3 text-center">Valida</th>
                  <th className="p-3 text-center">Invalida</th>
                  <th className="p-3 text-center">Inconclusivo</th>
                  <th className="p-3">Status Estratégico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                {HIPOTESES_DATA.map((h) => {
                  const relevant = interviews.filter((i) => i.vereditosPorHipotese?.[h.id]);
                  const vVal = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'valida').length;
                  const vInv = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'invalida').length;
                  const vInc = relevant.filter((i) => i.vereditosPorHipotese?.[h.id]?.veredito === 'inconclusivo').length;

                  return (
                    <tr key={h.id} className="print:text-slate-800">
                      <td className="p-3 font-mono font-bold text-slate-200 print:text-slate-900 whitespace-nowrap">
                        {h.id} · {h.titulo}
                      </td>
                      <td className="p-3 text-[11px] text-slate-300 print:text-slate-700">
                        {h.causaEfeito}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400 print:text-emerald-700">
                        {vVal}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-rose-400 print:text-rose-700">
                        {vInv}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-400 print:text-amber-700">
                        {vInc}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {h.isComercialKey ? (
                          <span className="rounded bg-teal-950/80 border border-teal-700 px-2 py-0.5 text-[10px] font-bold text-teal-300 print:bg-teal-100 print:text-teal-800 print:border-teal-300">
                            Chave Comercial Saúde
                          </span>
                        ) : h.isPrioritaria ? (
                          <span className="rounded bg-rose-950/80 border border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-300 print:bg-rose-100 print:text-rose-800 print:border-rose-300">
                            Rota B2G Validada
                          </span>
                        ) : h.isAnexoNaoExecutado ? (
                          <span className="rounded bg-amber-950/80 border border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-300 print:bg-amber-100 print:text-amber-800 print:border-amber-300">
                            Congelada (Guarda-Rail)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300 print:text-slate-700">
                            {vVal > vInv ? 'Comportamento Validado' : 'Em Avaliação'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quadro de Evidência Comportamental e Financeira */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/60 print:bg-slate-50 p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Disposição de Pagamento Comprovada
            </span>
            <div className="mt-1 text-2xl font-extrabold text-emerald-400 print:text-emerald-700">
              {pagouBolso.length} de {interviews.length}
            </div>
            <p className="mt-1 text-[11px] text-slate-300 print:text-slate-600">
              Professores e responsáveis que declararam gastos do próprio bolso para suprir a lacuna pedagógica.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/60 print:bg-slate-50 p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Municípios & Abrangência Territorial
            </span>
            <div className="mt-1 text-2xl font-extrabold text-indigo-400 print:text-indigo-700">
              {municipios.length} redes
            </div>
            <p className="mt-1 text-[11px] text-slate-300 print:text-slate-600">
              {municipios.join(', ')}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/60 print:bg-slate-50 p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600 block">
              Conclusão Pericial
            </span>
            <div className="mt-1 text-2xl font-extrabold text-white print:text-slate-900">
              {Math.round((totalValidadas / Math.max(1, interviews.length)) * 100)}%
            </div>
            <p className="mt-1 text-[11px] text-slate-300 print:text-slate-600">
              Índice de validação comportamental por evidências de pretérito (passado = dado).
            </p>
          </div>
        </div>

        {/* Catálogo de Frases Textuais Literais mais Relevantes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 flex items-center gap-1.5">
            <Quote className="h-4 w-4 text-indigo-400" />
            <span>2. Catálogo de Frases Textuais (Verbatim de Campo)</span>
          </h3>

          <div className="space-y-2.5">
            {interviews
              .filter((i) => i.frasesTextuais && i.frasesTextuais.length > 0)
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/40 print:bg-slate-50 p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 print:text-slate-600">
                    <span className="font-semibold text-slate-200 print:text-slate-800">
                      {item.entrevistadoPerfil} ({item.escolaOrOrgao} · {item.municipio})
                    </span>
                    <span className="font-mono text-[10px]">
                      Roteiro {item.roteiro} · {item.date}
                    </span>
                  </div>

                  <p className="font-medium italic text-indigo-200 print:text-slate-800">
                    {item.frasesTextuais[0]}
                  </p>

                  {item.frasesTextuais[1] && (
                    <p className="font-medium italic text-slate-300 print:text-slate-700">
                      {item.frasesTextuais[1]}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Conclusão de Rota de Mercado e Go-to-Market */}
        <div className="rounded-xl border border-slate-800 print:border-slate-300 bg-slate-950/70 print:bg-slate-50 p-4 space-y-2 text-xs">
          <h3 className="font-bold text-white print:text-slate-900 uppercase tracking-wide">
            3. Parecer Estratégico & Rota Comercial B2G + B2B Clínicas
          </h3>
          <p className="text-slate-300 print:text-slate-700 leading-relaxed">
            Os dados de campo confirmam que o Atendimento Educacional Especializado (AEE) possui dor real fundamentada em alto tempo despendido fora do expediente e compras recorrentes do próprio bolso. A hipótese <strong>H4</strong> demonstra viabilidade de entrada em secretarias municipais através de termo de cooperação para cessão experimental sem ônus, gerando o imprescindível <em>Atestado de Capacidade Técnica</em> assinado pelo titular da pasta. O foco vertical no nicho de neurodivergência e conformidade com a LBI confere barreira regulatória robusta frente a soluções generalistas.
          </p>
          <p className="text-slate-300 print:text-slate-700 leading-relaxed pt-2 border-t border-slate-800/80 print:border-slate-300">
            <strong>Eixo Clínica / Consultório (Canal Saúde):</strong> A validação comportamental de <strong>HS3</strong> e <strong>HS4</strong> comprova que o HiperReforço possui ciclo de fechamento comercial ágil no setor privado como ferramenta de <em>retenção de famílias</em>. A comprovação de tarefas no vão de 6 dias entre as sessões previne a evasão precoce no primeiro trimestre, gerando retorno financeiro imediato para consultórios e clínicas multidisciplinares, em estrita observância à Resolução CFP nº 31/2022 (recurso pedagógico complementar).
          </p>
        </div>
      </div>
    </div>
  );
};
