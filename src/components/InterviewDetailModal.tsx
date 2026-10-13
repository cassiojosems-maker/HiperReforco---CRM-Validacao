import React from 'react';
import { InterviewRecord } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import { isRecordStale, getDaysSinceLastUpdate } from '../utils/reminderUtils';
import {
  X,
  Play,
  Quote,
  Wallet,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Tag,
  UserCheck,
  AlertTriangle,
  Users,
  Landmark,
  Stethoscope,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react';

interface InterviewDetailModalProps {
  interview: InterviewRecord | null;
  onClose: () => void;
  onOpenLive: (interview: InterviewRecord) => void;
}

export const InterviewDetailModal: React.FC<InterviewDetailModalProps> = ({
  interview,
  onClose,
  onOpenLive,
}) => {
  if (!interview) return null;

  const roteiroConfig = ROTEIROS_CONFIG[interview.roteiro];

  const isFamily = interview.roteiro === 'D' || interview.roteiro === 'E' || interview.tipoPerfilIdentificacao === 'familia';
  const isClinic = interview.roteiro === 'F' || interview.tipoPerfilIdentificacao === 'clinica';
  const isManagement = interview.roteiro === 'B' || interview.tipoPerfilIdentificacao === 'gestao';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${
                isFamily
                  ? 'bg-pink-950 border-pink-700/60 text-pink-300'
                  : isClinic
                  ? 'bg-teal-950 border-teal-600 text-teal-300'
                  : isManagement
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-indigo-950 border-indigo-700/60 text-indigo-300'
              }`}>
                Roteiro {interview.roteiro} · {roteiroConfig?.targetAudience || 'Entrevistado'}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {interview.status.toUpperCase()}
              </span>
              {interview.canal === 'saude' && (
                <span className="rounded bg-teal-900/60 border border-teal-700/50 px-2 py-0.5 text-[10px] font-bold text-teal-200">
                  Canal Saúde
                </span>
              )}
              {isFamily && (
                <span className="rounded bg-pink-900/60 border border-pink-700/50 px-2 py-0.5 text-[10px] font-bold text-pink-200">
                  Canal Família B2C
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-base font-bold text-white flex items-center gap-2">
              {isFamily ? (
                <Users className="h-4 w-4 text-pink-400 shrink-0" />
              ) : isClinic ? (
                <Stethoscope className="h-4 w-4 text-teal-400 shrink-0" />
              ) : isManagement ? (
                <Landmark className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <GraduationCap className="h-4 w-4 text-indigo-400 shrink-0" />
              )}
              <span>{interview.entrevistadoNome || interview.entrevistadoPerfil}</span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{interview.escolaOrOrgao}</span>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{interview.municipio}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card de Identificação Específica do Perfil */}
        {isFamily ? (
          <div className="rounded-xl border border-pink-500/30 bg-pink-950/20 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
              <HeartHandshake className="h-3.5 w-3.5" />
              Contexto Familiar & Criança (Sem Jargões Burocráticos)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Vínculo / Parentesco</span>
                <span className="font-semibold text-slate-200">{interview.parentesco || 'Responsável'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Criança (Idade / Série)</span>
                <span className="font-semibold text-slate-200">{interview.idadeFilhoOuAno || 'Não especificada'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Diagnóstico / Perfil</span>
                <span className="font-semibold text-slate-200">{interview.diagnosticoOuPerfilFilho || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tipo de Escola</span>
                <span className="font-semibold text-slate-200">{interview.tipoEscolaFilho || interview.escolaOrOrgao}</span>
              </div>
            </div>
            {interview.contato && (
              <div className="pt-1 text-[11px] text-slate-400 border-t border-pink-900/40">
                <span className="text-pink-300 font-semibold">Contato: </span>
                {interview.contato}
              </div>
            )}
          </div>
        ) : isClinic ? (
          <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              Contexto Clínico & Atendimento Infantil
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Clínica / Espaço</span>
                <span className="font-semibold text-slate-200">{interview.escolaOrOrgao}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Especialidade</span>
                <span className="font-semibold text-slate-200">{interview.funcaoOuCargo || interview.entrevistadoPerfil}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Experiência</span>
                <span className="font-semibold text-slate-200">{interview.tempoExperiencia || interview.tempoDeCasa || 'Não informado'}</span>
              </div>
            </div>
            {interview.contato && (
              <div className="pt-1 text-[11px] text-slate-400 border-t border-teal-900/40">
                <span className="text-teal-300 font-semibold">Contato: </span>
                {interview.contato}
              </div>
            )}
          </div>
        ) : isManagement ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              Contexto Institucional & Secretaria de Educação
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Órgão / Secretaria</span>
                <span className="font-semibold text-slate-200">{interview.escolaOrOrgao}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Cargo / Área</span>
                <span className="font-semibold text-slate-200">{interview.funcaoOuCargo || interview.entrevistadoPerfil}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tempo na Rede</span>
                <span className="font-semibold text-slate-200">{interview.tempoExperiencia || interview.tempoDeCasa || 'Não informado'}</span>
              </div>
            </div>
            {interview.contato && (
              <div className="pt-1 text-[11px] text-slate-400 border-t border-amber-900/40">
                <span className="text-amber-300 font-semibold">Contato: </span>
                {interview.contato}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Contexto Docente & Sala de Recursos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Escola / Sala AEE</span>
                <span className="font-semibold text-slate-200">{interview.escolaOrOrgao}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Função Docente</span>
                <span className="font-semibold text-slate-200">{interview.funcaoOuCargo || interview.entrevistadoPerfil}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tempo em AEE</span>
                <span className="font-semibold text-slate-200">{interview.tempoExperiencia || interview.tempoDeCasa || 'Não informado'}</span>
              </div>
            </div>
            {interview.contato && (
              <div className="pt-1 text-[11px] text-slate-400 border-t border-indigo-900/40">
                <span className="text-indigo-300 font-semibold">Contato: </span>
                {interview.contato}
              </div>
            )}
          </div>
        )}

        {/* Metadados da Dupla & Sessão */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Data</span>
            <span className="font-semibold text-slate-200">{interview.date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Duração</span>
            <span className="font-semibold text-slate-200">{interview.duracaoMinutos} min</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Entrevistador</span>
            <span className="font-semibold text-slate-200">{interview.entrevistador}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Anotador</span>
            <span className="font-semibold text-slate-200">{interview.anotador}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Acompanhamento</span>
            {isRecordStale(interview) ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-950/90 text-amber-300 border border-amber-700 font-bold px-1.5 py-0.5 text-[10px]">
                <AlertTriangle className="h-2.5 w-2.5" />
                <span>{getDaysSinceLastUpdate(interview)}d sem contato</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Em dia</span>
            )}
          </div>
        </div>

        {/* 5 Frases Textuais (Sem Interpretação) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Quote className="h-4 w-4" />
            <span>Frases Textuais do Entrevistado (Verbatim)</span>
          </div>

          {interview.frasesTextuais && interview.frasesTextuais.length > 0 ? (
            <div className="space-y-1.5">
              {interview.frasesTextuais.map((frase, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs italic text-indigo-200"
                >
                  <span className="font-mono text-slate-500 not-italic mr-2">#{idx + 1}</span>
                  "{frase}"
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhuma frase textual registrada ainda.</p>
          )}
        </div>

        {/* O Que Surpreendeu */}
        {interview.oQueSurpreendeu && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              O que me surpreendeu / O que não esperava ouvir:
            </span>
            <p className="text-slate-200">{interview.oQueSurpreendeu}</p>
          </div>
        )}

        {/* Gasto Próprio & Tentativas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gasto do Próprio Bolso</span>
            </span>
            <p className="text-emerald-300 font-semibold">
              {interview.pagouDoProprioBolso
                ? interview.valorPagoDoProprioBolso || 'Sim, já gastou do próprio bolso'
                : 'Não relatou gastos do bolso'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Já tentou resolver / abandonou:
            </span>
            <p className="text-slate-200">
              {interview.tentouResolver || 'Não declarado'}
            </p>
          </div>
        </div>

        {/* Vereditos das Hipóteses */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Vereditos das Hipóteses Testadas
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {interview.hipotesesTestadas?.map((hId) => {
              const hInfo = interview.vereditosPorHipotese?.[hId];
              return (
                <div
                  key={hId}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-300">{hId}</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        hInfo?.veredito === 'valida'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : hInfo?.veredito === 'invalida'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {hInfo?.veredito || 'Pendente'}
                    </span>
                  </div>
                  {hInfo?.justificativa && (
                    <p className="text-[11px] text-slate-400">{hInfo.justificativa}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contato & Próximos Passos */}
        {(interview.contato || interview.proximosPassos) && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5">
            {interview.contato && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Contato: </span>
                <span className="text-slate-200">{interview.contato}</span>
              </div>
            )}
            {interview.proximosPassos && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">Próximos Passos: </span>
                <span className="text-slate-200">{interview.proximosPassos}</span>
              </div>
            )}
          </div>
        )}

        {/* Ações do Rodapé */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenLive(interview);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Editar no Checklist Ao Vivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
