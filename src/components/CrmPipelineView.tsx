import React, { useState } from 'react';
import { InterviewRecord, StatusCRM, RoteiroType, VereditoType } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import { isRecordStale, getStaleBadgeInfo } from '../utils/reminderUtils';
import {
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  MapPin,
  Building2,
  Clock,
  Wallet,
  Play,
  Trash2,
  Quote,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Tag,
  ArrowRight,
  Eye,
  AlertTriangle,
  BellRing,
  RotateCw,
  CalendarCheck,
  Users,
  Landmark,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';

interface CrmPipelineViewProps {
  interviews: InterviewRecord[];
  onOpenLive: (interview: InterviewRecord) => void;
  onUpdateStatus: (id: string, newStatus: StatusCRM) => void;
  onDeleteInterview: (id: string) => void;
  onViewDetails: (interview: InterviewRecord) => void;
  onRenewUpdate: (id: string) => void;
}

const STAGES: { id: StatusCRM; label: string; color: string; desc: string }[] = [
  { id: 'planejamento', label: '1. Prospecção', color: 'border-slate-700 bg-slate-900/60', desc: 'Identificação do perfil sem contato' },
  { id: 'agendado', label: '2. Agendado', color: 'border-sky-800 bg-sky-950/20', desc: 'Data e dupla definidas' },
  { id: 'ao_vivo', label: '3. Em Entrevista', color: 'border-amber-800 bg-amber-950/20', desc: 'Sessão em andamento' },
  { id: 'concluido', label: '4. Validado / Concluído', color: 'border-emerald-800 bg-emerald-950/20', desc: 'Transcreveu frases literais' },
  { id: 'descartado', label: '5. Inconclusivo / Descarte', color: 'border-rose-800 bg-rose-950/20', desc: 'Indução ou fora de perfil' },
];

export const CrmPipelineView: React.FC<CrmPipelineViewProps> = ({
  interviews,
  onOpenLive,
  onUpdateStatus,
  onDeleteInterview,
  onViewDetails,
  onRenewUpdate,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCanal, setSelectedCanal] = useState<string>('all');
  const [selectedRoteiro, setSelectedRoteiro] = useState<string>('all');
  const [selectedVeredito, setSelectedVeredito] = useState<string>('all');
  const [filterOnlyStale, setFilterOnlyStale] = useState<boolean>(false);

  // Entrevistas sem atualização há mais de 7 dias
  const staleInterviews = interviews.filter(isRecordStale);
  const staleCount = staleInterviews.length;

  // Filtragem
  const filteredInterviews = interviews.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.municipio.toLowerCase().includes(query) ||
      item.escolaOrOrgao.toLowerCase().includes(query) ||
      item.entrevistadoPerfil.toLowerCase().includes(query) ||
      (item.entrevistadoNome && item.entrevistadoNome.toLowerCase().includes(query)) ||
      (item.frasesTextuais && item.frasesTextuais.some((f) => f.toLowerCase().includes(query)));

    const itemCanal = item.canal || (item.roteiro === 'F' ? 'saude' : 'educacao');
    const matchesCanal = selectedCanal === 'all' || itemCanal === selectedCanal;
    const matchesRoteiro = selectedRoteiro === 'all' || item.roteiro === selectedRoteiro;
    const matchesVeredito = selectedVeredito === 'all' || item.vereditoGeral === selectedVeredito;
    const matchesStale = !filterOnlyStale || isRecordStale(item);

    return matchesSearch && matchesCanal && matchesRoteiro && matchesVeredito && matchesStale;
  });

  const getVereditoBadge = (veredito?: VereditoType) => {
    switch (veredito) {
      case 'valida':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Valida
          </span>
        );
      case 'invalida':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-950/80 border border-rose-700/50 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
            <XCircle className="h-3 w-3 text-rose-400" /> Invalida
          </span>
        );
      case 'inconclusivo':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 border border-amber-700/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <HelpCircle className="h-3 w-3 text-amber-400" /> Inconclusivo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            Pendente
          </span>
        );
    }
  };

  const getRoteiroBadge = (roteiro: RoteiroType) => {
    const config = ROTEIROS_CONFIG[roteiro];
    const colors: Record<RoteiroType, string> = {
      A: 'bg-indigo-950 border-indigo-700 text-indigo-300',
      B: 'bg-rose-950 border-rose-700 text-rose-300',
      C: 'bg-emerald-950 border-emerald-700 text-emerald-300',
      D: 'bg-sky-950 border-sky-700 text-sky-300',
      E: 'bg-purple-950 border-purple-700 text-purple-300',
      F: 'bg-teal-950 border-teal-600 text-teal-300',
    };
    const label =
      config.type === 'A'
        ? 'AEE'
        : config.type === 'B'
        ? 'Secretaria'
        : config.type === 'C'
        ? 'Piloto'
        : config.type === 'D'
        ? 'Família B2C'
        : config.type === 'F'
        ? 'Clínica / Saúde'
        : 'Típico';

    return (
      <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${colors[roteiro] || 'bg-slate-800 text-slate-300'}`}>
        Rot. {roteiro} · {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Banner de Lembretes do Funil (> 7 dias sem atualização) */}
      {staleCount > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 p-3.5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 border border-amber-500/30 p-2 text-amber-400 shrink-0">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Lembrete de Acompanhamento do Funil
                </span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px] font-mono font-bold text-amber-200">
                  {staleCount} {staleCount === 1 ? 'entrevista estagnada' : 'entrevistas estagnadas'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Há entrevistas sem qualquer atualização há <strong>mais de 7 dias</strong>. Faça follow-up com os contatos para evitar perda de tração no cronograma de validação.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterOnlyStale(!filterOnlyStale)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterOnlyStale
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/60'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{filterOnlyStale ? 'Mostrando Apenas >7d' : 'Filtrar Estagnadas (>7d)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por município, escola, citação literal ou perfil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            
            {/* Seletor de Eixo de Atuação */}
            <select
              value={selectedCanal}
              onChange={(e) => setSelectedCanal(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              title="Filtrar por Eixo de Atuação"
            >
              <option value="all">Todos os Eixos</option>
              <option value="educacao">🏫 Eixo Educação / Escolas</option>
              <option value="saude">🩺 Eixo Clínica / Consultório</option>
            </select>

            {/* Seletor de Roteiro */}
            <select
              value={selectedRoteiro}
              onChange={(e) => setSelectedRoteiro(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Todos os Roteiros</option>
              <option value="A">Roteiro A · Prof. AEE</option>
              <option value="B">Roteiro B · Gestão/Secretaria</option>
              <option value="C">Roteiro C · Piloto Real</option>
              <option value="D">Roteiro D · Família B2C</option>
              <option value="E">Roteiro E · Aluno Típico (H6)</option>
              <option value="G">Roteiro G · Clínica / Saúde</option>
            </select>

            <select
              value={selectedVeredito}
              onChange={(e) => setSelectedVeredito(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Todos os Vereditos</option>
              <option value="valida">Apenas Válidas</option>
              <option value="invalida">Apenas Inválidas</option>
              <option value="inconclusivo">Inconclusivas</option>
            </select>

            {/* Toggle Rápido de Filtro de Lembretes */}
            <button
              onClick={() => setFilterOnlyStale(!filterOnlyStale)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                filterOnlyStale
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Filtrar entrevistas sem atualização há mais de 7 dias"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">&gt;7 dias</span>
              {staleCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-300">
                  {staleCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Alternador de Modo de Exibição */}
        <div className="flex items-center gap-1 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Kanban className="h-3.5 w-3.5 text-indigo-400" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Tabela</span>
          </button>
        </div>
      </div>

      {/* Visualização KANBAN */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageItems = filteredInterviews.filter((i) => i.status === stage.id);

            return (
              <div
                key={stage.id}
                className={`rounded-xl border ${stage.color} p-3 flex flex-col min-h-[500px]`}
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                  <div>
                    <span className="font-bold text-xs text-white tracking-wide">
                      {stage.label}
                    </span>
                    <p className="text-[10px] text-slate-400">{stage.desc}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-slate-300">
                    {stageItems.length}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {stageItems.length === 0 ? (
                    <div className="h-28 rounded-lg border border-dashed border-slate-800/80 flex items-center justify-center text-[11px] text-slate-500 text-center p-2">
                      Nenhuma entrevista neste estágio
                    </div>
                  ) : (
                    stageItems.map((item) => {
                      const staleInfo = getStaleBadgeInfo(item);

                      return (
                        <div
                          key={item.id}
                          className={`group relative rounded-lg border bg-slate-900/90 p-3 shadow-sm hover:shadow-md transition-all space-y-2 ${
                            staleInfo.isStale
                              ? `border-2 ${staleInfo.borderClass} bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/10`
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Lembrete de Inatividade no Topo do Card */}
                          {staleInfo.isStale && (
                            <div className="flex items-center justify-between gap-1 pb-1 border-b border-amber-900/40">
                              <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] ${staleInfo.badgeClass}`}>
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>{staleInfo.label}</span>
                              </span>

                              <button
                                onClick={() => onRenewUpdate(item.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/60 px-1.5 py-0.5 rounded transition-colors"
                                title="Registrar contato hoje e renovar o acompanhamento do funil"
                              >
                                <RotateCw className="h-2.5 w-2.5" />
                                <span>Renovar hoje</span>
                              </button>
                            </div>
                          )}

                          {/* Header do Card */}
                          <div className="flex items-start justify-between gap-1">
                            {getRoteiroBadge(item.roteiro)}
                            {getVereditoBadge(item.vereditoGeral)}
                          </div>

                          {/* Informações do Entrevistado */}
                          <div>
                            {(() => {
                              const isFamily = item.roteiro === 'D' || item.roteiro === 'E' || item.tipoPerfilIdentificacao === 'familia';
                              const isClinic = item.roteiro === 'F' || item.tipoPerfilIdentificacao === 'clinica';
                              const isManagement = item.roteiro === 'B' || item.tipoPerfilIdentificacao === 'gestao';

                              return (
                                <>
                                  <h4 className="font-semibold text-xs text-slate-100 line-clamp-1 flex items-center gap-1.5">
                                    {isFamily ? (
                                      <Users className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                                    ) : isClinic ? (
                                      <Stethoscope className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                                    ) : isManagement ? (
                                      <Landmark className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    ) : (
                                      <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                    )}
                                    <span className="truncate">{item.entrevistadoNome || item.entrevistadoPerfil}</span>
                                  </h4>
                                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span className="truncate">
                                      {isFamily && item.parentesco
                                        ? `${item.parentesco} · ${item.idadeFilhoOuAno || 'Filho'} (${item.tipoEscolaFilho || item.escolaOrOrgao})`
                                        : item.escolaOrOrgao}
                                    </span>
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-600 shrink-0" />
                                    <span>{item.municipio}</span>
                                  </p>
                                </>
                              );
                            })()}
                          </div>

                          {/* Próximos Passos com Alerta se Estagnado */}
                          {item.proximosPassos && (
                            <div className="rounded bg-slate-950/80 p-1.5 border border-slate-800/80 text-[10px] text-slate-300">
                              <strong className="text-slate-400">Próximo Passo: </strong>
                              <span className="line-clamp-2">{item.proximosPassos}</span>
                            </div>
                          )}

                          {/* Frase Textual em Destaque */}
                          {item.frasesTextuais && item.frasesTextuais.length > 0 && (
                            <div className="rounded bg-slate-950/70 p-2 border border-slate-800/80 text-[11px] text-indigo-200/90 italic flex items-start gap-1.5">
                              <Quote className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {item.frasesTextuais[0]}
                              </span>
                            </div>
                          )}

                          {/* Metadados: Gasto do Próprio Bolso e Duração */}
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                            <div className="flex items-center gap-1" title={`Última alteração: ${item.updatedAt || item.date}`}>
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>{staleInfo.days === 0 ? 'Hoje' : `${staleInfo.days}d atrás`}</span>
                            </div>

                            {item.pagouDoProprioBolso && (
                              <span className="flex items-center gap-0.5 text-emerald-400 font-semibold" title={item.valorPagoDoProprioBolso || 'Gastou do próprio bolso'}>
                                <Wallet className="h-3 w-3" />
                                <span>Pagou bolso</span>
                              </span>
                            )}

                            {item.isExterna && (
                              <span className="rounded bg-sky-950/80 text-sky-300 border border-sky-800 px-1 text-[9px]">
                                Formulário
                              </span>
                            )}
                          </div>

                          {/* Badges de Hipóteses Testadas */}
                          {item.hipotesesTestadas && item.hipotesesTestadas.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.hipotesesTestadas.map((hId) => {
                                const hVer = item.vereditosPorHipotese?.[hId]?.veredito;
                                const badgeColor =
                                  hVer === 'valida'
                                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
                                    : hVer === 'invalida'
                                    ? 'bg-rose-950/90 text-rose-300 border-rose-700/60'
                                    : hVer === 'inconclusivo'
                                    ? 'bg-amber-950/90 text-amber-300 border-amber-700/60'
                                    : 'bg-slate-800 text-slate-300 border-slate-700';
                                return (
                                  <span
                                    key={hId}
                                    className={`rounded border px-1 text-[9px] font-mono font-bold ${badgeColor}`}
                                    title={`${hId}: ${hVer || 'pendente'}`}
                                  >
                                    {hId}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Ações Rápidas do Card */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <button
                              onClick={() => onViewDetails(item)}
                              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-1.5 py-1 rounded hover:bg-slate-800 transition-colors"
                              title="Ver Ficha Completa"
                            >
                              <Eye className="h-3 w-3 text-indigo-400" />
                              <span>Ficha</span>
                            </button>

                            <button
                              onClick={() => onOpenLive(item)}
                              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded hover:bg-emerald-950/40 border border-emerald-900/60 transition-colors"
                              title="Continuar Entrevista no Checklist Ao Vivo"
                            >
                              <Play className="h-3 w-3" />
                              <span>Executar</span>
                            </button>

                            {/* Seletor Rápido de Mudança de Estágio */}
                            <div className="relative group/status">
                              <button
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Mover estágio do CRM"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                              <div className="absolute right-0 bottom-full mb-1 hidden group-hover/status:block w-36 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-lg z-20">
                                {STAGES.map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => onUpdateStatus(item.id, s.id)}
                                    className={`w-full text-left px-2 py-1 text-[10px] rounded hover:bg-slate-800 ${
                                      item.status === s.id ? 'font-bold text-indigo-400' : 'text-slate-300'
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => onDeleteInterview(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Excluir Registro"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Visualização TABELA EXECUTIVA */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Alerta Follow-up</th>
                  <th className="p-3">Roteiro</th>
                  <th className="p-3">Entrevistado & Local</th>
                  <th className="p-3">Status CRM</th>
                  <th className="p-3">H1-H6 Testadas</th>
                  <th className="p-3">Veredito Geral</th>
                  <th className="p-3">Próximo Passo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Nenhuma entrevista encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredInterviews.map((item) => {
                    const staleInfo = getStaleBadgeInfo(item);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          staleInfo.isStale
                            ? 'bg-amber-950/15 hover:bg-amber-950/25'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                          {item.date || item.createdAt.slice(0, 10)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {staleInfo.isStale ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] ${staleInfo.badgeClass}`}>
                                <AlertTriangle className="h-3 w-3" />
                                <span>{staleInfo.label}</span>
                              </span>
                              <button
                                onClick={() => onRenewUpdate(item.id)}
                                className="p-1 rounded text-amber-300 hover:text-white hover:bg-amber-900/50"
                                title="Renovar acompanhamento hoje"
                              >
                                <RotateCw className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {staleInfo.days === 0 ? 'Atualizado hoje' : `${staleInfo.days}d atrás`}
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">{getRoteiroBadge(item.roteiro)}</td>
                        <td className="p-3">
                          {(() => {
                            const isFamily = item.roteiro === 'D' || item.roteiro === 'E' || item.tipoPerfilIdentificacao === 'familia';
                            return (
                              <>
                                <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                  {isFamily && <Users className="h-3.5 w-3.5 text-pink-400 shrink-0" />}
                                  <span>{item.entrevistadoNome || item.entrevistadoPerfil}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {isFamily && item.parentesco
                                    ? `${item.parentesco} · ${item.idadeFilhoOuAno || 'Filho'} (${item.tipoEscolaFilho || item.escolaOrOrgao}) · ${item.municipio}`
                                    : `${item.escolaOrOrgao} · ${item.municipio}`}
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium">
                            {STAGES.find((s) => s.id === item.status)?.label || item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {item.hipotesesTestadas?.map((hId) => (
                              <span
                                key={hId}
                                className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300"
                              >
                                {hId}: {item.vereditosPorHipotese?.[hId]?.veredito || '-'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">{getVereditoBadge(item.vereditoGeral)}</td>
                        <td className="p-3 max-w-xs">
                          <p className="text-[11px] text-slate-300 truncate">
                            {item.proximosPassos || item.frasesTextuais?.[0] || 'Sem anotações'}
                          </p>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewDetails(item)}
                              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Ver Ficha"
                            >
                              <Eye className="h-4 w-4 text-indigo-400" />
                            </button>
                            <button
                              onClick={() => onOpenLive(item)}
                              className="p-1.5 rounded text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors"
                              title="Abrir no Checklist Ao Vivo"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteInterview(item.id)}
                              className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
