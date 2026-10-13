import React, { useState, useEffect } from 'react';
import {
  InterviewRecord,
  RoteiroType,
  HipoteseId,
  VereditoType,
  StatusCRM,
} from '../types/validation';
import {
  ROTEIROS_CONFIG,
  HIPOTESES_DATA,
  PERGUNTAS_PROIBIDAS,
} from '../data/cadernoData';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Save,
  HelpCircle,
  FileText,
  UserCheck,
  Building,
  Quote,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Mic,
  Volume2,
  Video,
  ShieldAlert,
  Users,
  Landmark,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';

interface LiveInterviewChecklistProps {
  currentRecord: InterviewRecord | null;
  onSaveRecord: (record: InterviewRecord) => void;
  onCancel: () => void;
  onOpenMeetModal?: () => void;
}

export const LiveInterviewChecklist: React.FC<LiveInterviewChecklistProps> = ({
  currentRecord,
  onSaveRecord,
  onCancel,
  onOpenMeetModal,
}) => {
  // Estado básico do formulário de entrevista
  const [roteiro, setRoteiro] = useState<RoteiroType>(currentRecord?.roteiro || 'A');
  const [municipio, setMunicipio] = useState(currentRecord?.municipio || 'Campo Grande - MS');
  const [escolaOrOrgao, setEscolaOrOrgao] = useState(currentRecord?.escolaOrOrgao || '');
  const [entrevistadoPerfil, setEntrevistadoPerfil] = useState(currentRecord?.entrevistadoPerfil || '');
  const [entrevistadoNome, setEntrevistadoNome] = useState(currentRecord?.entrevistadoNome || '');
  const [tempoDeCasa, setTempoDeCasa] = useState(currentRecord?.tempoDeCasa || '');
  const [contato, setContato] = useState(currentRecord?.contato || '');
  const [entrevistador, setEntrevistador] = useState(currentRecord?.entrevistador || 'Estratégia / Perito');
  const [anotador, setAnotador] = useState(currentRecord?.anotador || 'Pedagógico / Pesquisa');
  const [status, setStatus] = useState<StatusCRM>(currentRecord?.status || 'ao_vivo');

  // Identificação estruturada por perfil
  const isFamily = roteiro === 'D' || roteiro === 'E';
  const isClinic = roteiro === 'F';
  const isManagement = roteiro === 'B';

  const [parentesco, setParentesco] = useState(currentRecord?.parentesco || 'Mãe');
  const [idadeFilhoOuAno, setIdadeFilhoOuAno] = useState(currentRecord?.idadeFilhoOuAno || '');
  const [diagnosticoOuPerfilFilho, setDiagnosticoOuPerfilFilho] = useState(currentRecord?.diagnosticoOuPerfilFilho || '');
  const [tipoEscolaFilho, setTipoEscolaFilho] = useState(currentRecord?.tipoEscolaFilho || 'Escola Pública Municipal');

  // Checklist interativo
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>(
    currentRecord?.checklistProgress || {}
  );
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>(
    currentRecord?.checklistNotes || {}
  );

  // Ficha de Registro (Item 10)
  const [hipotesesTestadas, setHipotesesTestadas] = useState<HipoteseId[]>(
    currentRecord?.hipotesesTestadas ||
      (roteiro === 'A'
        ? ['H1', 'H2', 'H5']
        : roteiro === 'B'
        ? ['H3', 'H4']
        : roteiro === 'E'
        ? ['H6']
        : roteiro === 'F'
        ? ['HS1', 'HS2', 'HS3', 'HS4', 'HS5']
        : ['H1', 'H5'])
  );
  const [frasesTextuais, setFrasesTextuais] = useState<string[]>(
    currentRecord?.frasesTextuais?.length ? currentRecord.frasesTextuais : ['', '', '', '', '']
  );
  const [oQueSurpreendeu, setOQueSurpreendeu] = useState(currentRecord?.oQueSurpreendeu || '');
  const [tentouResolver, setTentouResolver] = useState(currentRecord?.tentouResolver || '');
  const [pagouDoProprioBolso, setPagouDoProprioBolso] = useState<boolean>(
    currentRecord?.pagouDoProprioBolso || false
  );
  const [valorPagoDoProprioBolso, setValorPagoDoProprioBolso] = useState(
    currentRecord?.valorPagoDoProprioBolso || ''
  );

  // Vereditos
  const [vereditosPorHipotese, setVereditosPorHipotese] = useState<
    InterviewRecord['vereditosPorHipotese']
  >(currentRecord?.vereditosPorHipotese || {});
  const [vereditoGeral, setVereditoGeral] = useState<VereditoType>(
    currentRecord?.vereditoGeral || 'valida'
  );
  const [vereditoMotivoGeral, setVereditoMotivoGeral] = useState(
    currentRecord?.vereditoMotivoGeral || ''
  );
  const [proximosPassos, setProximosPassos] = useState(currentRecord?.proximosPassos || '');

  // Cronômetro e Medidor de Fala 80/20
  const [secondsElapsed, setSecondsElapsed] = useState<number>(
    (currentRecord?.duracaoMinutos || 0) * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'entrevistado' | 'entrevistador'>('entrevistado');
  const [interviewerSeconds, setInterviewerSeconds] = useState<number>(0);
  const [intervieweeSeconds, setIntervieweeSeconds] = useState<number>(0);

  // Modal das Perguntas Proibidas
  const [showProhibitedModal, setShowProhibitedModal] = useState<boolean>(false);

  // Blocos expandidos
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    all: true,
  });

  const roteiroConfig = ROTEIROS_CONFIG[roteiro];

  // Efeito do Cronômetro
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
        if (activeSpeaker === 'entrevistador') {
          setInterviewerSeconds((prev) => prev + 1);
        } else {
          setIntervieweeSeconds((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSpeaker]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalSpeakingTime = interviewerSeconds + intervieweeSeconds;
  const interviewerPercent =
    totalSpeakingTime > 0 ? Math.round((interviewerSeconds / totalSpeakingTime) * 100) : 0;

  const toggleCheck = (qId: string) => {
    setChecklistProgress((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleNoteChange = (qId: string, val: string) => {
    setChecklistNotes((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleFraseChange = (index: number, val: string) => {
    const copy = [...frasesTextuais];
    copy[index] = val;
    setFrasesTextuais(copy);
  };

  const toggleHipotese = (hId: HipoteseId) => {
    setHipotesesTestadas((prev) =>
      prev.includes(hId) ? prev.filter((id) => id !== hId) : [...prev, hId]
    );
  };

  const setHipoteseVeredito = (hId: HipoteseId, veredito: VereditoType, justificativa: string) => {
    setVereditosPorHipotese((prev) => ({
      ...prev,
      [hId]: {
        veredito,
        justificativa: justificativa || prev?.[hId]?.justificativa || '',
      },
    }));
  };

  const handleSave = () => {
    const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    const finalEscolaOrOrgao = isFamily
      ? (tipoEscolaFilho ? `Família · ${tipoEscolaFilho}` : 'Família de Estudante')
      : (escolaOrOrgao || (isClinic ? 'Clínica Infantil' : (isManagement ? 'Secretaria de Educação' : 'Sala de Recursos AEE')));

    const finalPerfil = isFamily
      ? `${parentesco || 'Responsável'} de estudante (${idadeFilhoOuAno || 'idade não informada'}${diagnosticoOuPerfilFilho ? ` · ${diagnosticoOuPerfilFilho}` : ''})`
      : (entrevistadoPerfil || (isClinic ? 'Terapeuta Infantil' : (isManagement ? 'Gestão de Educação' : 'Professor de AEE')));

    const recordToSave: InterviewRecord = {
      id: currentRecord?.id || `rec_${Date.now()}`,
      createdAt: currentRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      date: currentRecord?.date || new Date().toISOString().slice(0, 10),
      municipio: municipio || 'Não informado',
      escolaOrOrgao: finalEscolaOrOrgao,
      entrevistadoPerfil: finalPerfil,
      entrevistadoNome: entrevistadoNome || (isFamily ? `${parentesco} (${municipio})` : ''),
      tempoDeCasa: !isFamily ? tempoDeCasa : undefined,
      contato,
      roteiro,
      status: status === 'ao_vivo' ? 'concluido' : status,
      
      // Identificação adaptada por perfil
      tipoPerfilIdentificacao: isFamily ? 'familia' : (isClinic ? 'clinica' : (isManagement ? 'gestao' : 'docente')),
      parentesco: isFamily ? parentesco : currentRecord?.parentesco,
      idadeFilhoOuAno: isFamily ? idadeFilhoOuAno : currentRecord?.idadeFilhoOuAno,
      diagnosticoOuPerfilFilho: isFamily ? diagnosticoOuPerfilFilho : currentRecord?.diagnosticoOuPerfilFilho,
      tipoEscolaFilho: isFamily ? tipoEscolaFilho : currentRecord?.tipoEscolaFilho,
      funcaoOuCargo: !isFamily ? entrevistadoPerfil : undefined,
      tempoExperiencia: !isFamily ? tempoDeCasa : undefined,

      entrevistador,
      anotador,
      duracaoMinutos: durationMinutes,
      checklistProgress,
      checklistNotes,
      hipotesesTestadas,
      frasesTextuais: frasesTextuais.filter((f) => f.trim().length > 0),
      oQueSurpreendeu,
      tentouResolver,
      pagouDoProprioBolso,
      valorPagoDoProprioBolso,
      vereditosPorHipotese,
      vereditoGeral,
      vereditoMotivoGeral,
      proximosPassos,
      tags: currentRecord?.tags || [
        roteiroConfig.type,
        municipio.split('-')[0].trim(),
        isFamily ? 'Família & Aluno' : (isClinic ? 'Clínica' : 'Educação')
      ],
      isExterna: currentRecord?.isExterna || false,
    };

    onSaveRecord(recordToSave);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ação Superior / Sticky Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Seletor de Roteiro */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Roteiro de Campo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as RoteiroType[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRoteiro(r);
                      if (r === 'A') setHipotesesTestadas(['H1', 'H2', 'H5']);
                      if (r === 'B') setHipotesesTestadas(['H3', 'H4']);
                      if (r === 'C') setHipotesesTestadas(['H1', 'H5']);
                      if (r === 'D') setHipotesesTestadas(['H1', 'H5']);
                      if (r === 'E') setHipotesesTestadas(['H6']);
                      if (r === 'F') setHipotesesTestadas(['HS1', 'HS2', 'HS3', 'HS4', 'HS5']);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      roteiro === r
                        ? r === 'F'
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Roteiro {r} {r === 'F' && '· Clínica'}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-[11px] font-bold text-white block">
                {roteiroConfig.title}
              </span>
              <span className="text-[11px] text-slate-400">
                Público: {roteiroConfig.targetAudience} · Meta: {roteiroConfig.durationTarget}
              </span>
            </div>
          </div>

          {/* Cronômetro e Regra 80/20 */}
          <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
            {/* Cronômetro */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span className="font-mono text-base font-extrabold text-white">
                {formatTimer(secondsElapsed)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isTimerRunning
                    ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
                    : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                }`}
                title={isTimerRunning ? 'Pausar' : 'Iniciar'}
              >
                {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setSecondsElapsed(0);
                  setInterviewerSeconds(0);
                  setIntervieweeSeconds(0);
                }}
                className="p-1 rounded text-slate-500 hover:text-white"
                title="Zerar"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {/* Medidor de Fala 80/20 */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Fala:</span>
              <button
                onClick={() => setActiveSpeaker('entrevistador')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeSpeaker === 'entrevistador'
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mic className="h-3 w-3" />
                <span>Você ({interviewerPercent}%)</span>
              </button>
              <button
                onClick={() => setActiveSpeaker('entrevistado')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  activeSpeaker === 'entrevistado'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Volume2 className="h-3 w-3" />
                <span>Entrevistado ({100 - interviewerPercent}%)</span>
              </button>

              {interviewerPercent > 20 && (
                <span
                  className="text-[10px] text-rose-400 font-bold animate-pulse flex items-center gap-1"
                  title="Meta da Regra de Ouro: Você deve falar menos de 20% do tempo"
                >
                  <AlertTriangle className="h-3 w-3" />
                  &gt;20%!
                </span>
              )}
            </div>

            {/* Botão de Transcrição do Meet */}
            {onOpenMeetModal && (
              <button
                type="button"
                onClick={onOpenMeetModal}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/50 px-3 py-1.5 text-xs font-bold text-purple-200 transition-colors shadow-sm"
                title="Importar e preencher este checklist via transcrição do Google Meet com IA"
              >
                <Video className="h-3.5 w-3.5 text-purple-400" />
                <span>Importar Meet (IA)</span>
              </button>
            )}

            {/* Botão de Perguntas Proibidas */}
            <button
              onClick={() => setShowProhibitedModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Perguntas Proibidas</span>
            </button>

            {/* Salvar / Concluir */}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Salvar no CRM</span>
            </button>
          </div>
        </div>

        {/* Alerta da Regra de Ouro do Roteiro */}
        <div className="mt-3 rounded-lg bg-indigo-950/40 border border-indigo-900/50 p-2.5 text-xs text-indigo-200 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Diretriz deste roteiro: </strong>
            {roteiroConfig.goldenRuleNote}
          </p>
        </div>

        {/* Alerta Regulamentar CFP 31/2022 (Canal Saúde) */}
        {roteiroConfig.regulatoryNotice && (
          <div className="mt-2 rounded-lg bg-teal-950/40 border border-teal-800/60 p-2.5 text-xs text-teal-200 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-teal-100">Segurança Regulamentar & Ética: </strong>
              {roteiroConfig.regulatoryNotice}
            </p>
          </div>
        )}
      </div>

      {/* Grid Principal: Metadados da Dupla & Ficha de Registro Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna da Esquerda (8 cols): Roteiro e Checklist Interativo */}
        <div className="lg:col-span-8 space-y-6">
          {/* Metadados da Entrevista */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                {isFamily ? (
                  <Users className="h-4 w-4 text-pink-400" />
                ) : isClinic ? (
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                ) : isManagement ? (
                  <Landmark className="h-4 w-4 text-amber-400" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-400" />
                )}
                <span>
                  1. {isFamily ? 'Identificação da Família & Criança' : 'Identificação da Entrevista & Dupla de Campo'}
                </span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isFamily
                  ? 'bg-pink-950/70 border-pink-700/60 text-pink-300'
                  : isClinic
                  ? 'bg-teal-950/70 border-teal-700/60 text-teal-300'
                  : isManagement
                  ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                  : 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300'
              }`}>
                {isFamily ? 'Perfil Família / B2C' : isClinic ? 'Perfil Clínica / Saúde' : isManagement ? 'Perfil Gestão / B2G' : 'Perfil Docente / AEE'}
              </span>
            </div>

            {isFamily ? (
              /* Campos Específicos para Famílias (Roteiros D e E) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Município</label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ex: Campo Grande - MS"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-pink-300 font-bold">Vínculo / Parentesco</label>
                  <select
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-pink-700/50 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Responsável Legal">Responsável Legal</option>
                    <option value="Cuidador(a)">Cuidador(a)</option>
                    <option value="Avó / Avô">Avó / Avô</option>
                    <option value="Outro Familiar">Outro Familiar</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Nome do Responsável</label>
                  <input
                    type="text"
                    value={entrevistadoNome}
                    onChange={(e) => setEntrevistadoNome(e.target.value)}
                    placeholder="Ex: Mariana Mendes (ou Pseudônimo)"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 font-bold">Idade & Série da Criança</label>
                  <input
                    type="text"
                    value={idadeFilhoOuAno}
                    onChange={(e) => setIdadeFilhoOuAno(e.target.value)}
                    placeholder="Ex: 8 anos (3º ano EF)"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 font-bold">Perfil / Diagnóstico da Criança</label>
                  <input
                    type="text"
                    value={diagnosticoOuPerfilFilho}
                    onChange={(e) => setDiagnosticoOuPerfilFilho(e.target.value)}
                    placeholder="Ex: TEA Nível 1 / TDAH / Típico"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 font-bold">Tipo de Escola que Frequenta</label>
                  <input
                    type="text"
                    value={tipoEscolaFilho}
                    onChange={(e) => setTipoEscolaFilho(e.target.value)}
                    placeholder="Ex: Escola Municipal / Estadual / Particular"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Quem Entrevistou (Voz)</label>
                  <input
                    type="text"
                    value={entrevistador}
                    onChange={(e) => setEntrevistador(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Quem Anotou (Frases)</label>
                  <input
                    type="text"
                    value={anotador}
                    onChange={(e) => setAnotador(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Contato / WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="Para follow-up ou devolutiva"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              /* Campos para Docentes, Clínicos e Gestores */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Município</label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ex: Campo Grande - MS"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">
                    {isClinic
                      ? 'Clínica / Consultório'
                      : isManagement
                      ? 'Secretaria de Educação / Órgão'
                      : 'Escola / Sala de Recursos'}
                  </label>
                  <input
                    type="text"
                    value={escolaOrOrgao}
                    onChange={(e) => setEscolaOrOrgao(e.target.value)}
                    placeholder={
                      isClinic
                        ? 'Ex: Clínica Somar Infantil ou Consultório Privado'
                        : isManagement
                        ? 'Ex: SEMED Campo Grande ou Diretoria Regional'
                        : 'Ex: EMEI Maria Cecília ou Sala de Recursos AEE'
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">
                    {isClinic
                      ? 'Especialidade Clínica'
                      : isManagement
                      ? 'Cargo / Função na Rede'
                      : 'Função Docente'}
                  </label>
                  <input
                    type="text"
                    value={entrevistadoPerfil}
                    onChange={(e) => setEntrevistadoPerfil(e.target.value)}
                    placeholder={
                      isClinic
                        ? 'Ex: Psicóloga Infantil / Terapeuta Ocupacional'
                        : isManagement
                        ? 'Ex: Coordenadora de Educação Inclusiva'
                        : 'Ex: Professora de AEE / Regente de Sala'
                    }
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Nome / Pseudônimo (Opcional)</label>
                  <input
                    type="text"
                    value={entrevistadoNome}
                    onChange={(e) => setEntrevistadoNome(e.target.value)}
                    placeholder="Ex: Profa. Ana (Pseudônimo: CG-02)"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Tempo de Atuação / Experiência</label>
                  <input
                    type="text"
                    value={tempoDeCasa}
                    onChange={(e) => setTempoDeCasa(e.target.value)}
                    placeholder="Ex: 8 anos na área"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Contato / WhatsApp (Opcional)</label>
                  <input
                    type="text"
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="Ex: (67) 99999-0000"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Quem Entrevistou (Voz)</label>
                  <input
                    type="text"
                    value={entrevistador}
                    onChange={(e) => setEntrevistador(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">Quem Anotou (Frases)</label>
                  <input
                    type="text"
                    value={anotador}
                    onChange={(e) => setAnotador(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Checklist de Perguntas por Bloco */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>2. Roteiro Passo a Passo ({roteiroConfig.blocks.length} Blocos)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Marque conforme perguntar e anote trechos importantes
              </span>
            </div>

            {roteiroConfig.blocks.map((block) => (
              <div
                key={block.blockId}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm"
              >
                {/* Cabeçalho do Bloco */}
                <div className="flex items-center justify-between p-3.5 bg-slate-900 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-2">
                      <span>{block.title}</span>
                      {block.estimatedTime && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                          {block.estimatedTime}
                        </span>
                      )}
                    </h4>
                    {block.notes && (
                      <p className="mt-1 text-[11px] text-indigo-300/90 font-medium">
                        💡 {block.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lista de Perguntas */}
                <div className="divide-y divide-slate-800/60 p-2 space-y-2">
                  {block.questions.map((q) => {
                    const isChecked = !!checklistProgress[q.id];
                    return (
                      <div
                        key={q.id}
                        className={`p-2.5 rounded-lg transition-colors ${
                          isChecked ? 'bg-indigo-950/20 border border-indigo-900/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(q.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-baseline gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-400">
                                #{q.order}
                              </span>
                              <span className={`text-xs font-medium ${isChecked ? 'text-slate-300' : 'text-white'}`}>
                                {q.text}
                              </span>
                              {q.isArtifactCheck && (
                                <span className="rounded bg-amber-950/80 border border-amber-700/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                                  Pede Artefato Físico
                                </span>
                              )}
                              {q.isDecisiveCheck && (
                                <span className="rounded bg-rose-950/80 border border-rose-700/60 px-1.5 py-0.2 text-[10px] font-bold text-rose-300">
                                  Pergunta Decisiva
                                </span>
                              )}
                            </div>

                            {q.tip && (
                              <p className="text-[11px] text-amber-300/80 italic">
                                📌 Dica de campo: {q.tip}
                              </p>
                            )}

                            {/* Caixa de anotação rápida da resposta */}
                            <input
                              type="text"
                              placeholder="Anotação rápida da resposta ou palavras-chave..."
                              value={checklistNotes[q.id] || ''}
                              onChange={(e) => handleNoteChange(q.id, e.target.value)}
                              className="mt-1 w-full rounded border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna da Direita (4 cols): Ficha Oficial de Registro (Item 10 do Caderno) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4 shadow-lg sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Quote className="h-4 w-4 text-indigo-400" />
                  <span>Ficha de Registro Oficial</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Item 10 do Caderno de Validação
                </p>
              </div>
              <span className="rounded bg-indigo-950 border border-indigo-700/50 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                1 por entrevista
              </span>
            </div>

            {/* Hipóteses Testadas */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Hipótese(s) Testada(s) nesta Conversa:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HIPOTESES_DATA.map((h) => {
                  const isSelected = hipotesesTestadas.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHipotese(h.id)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={h.titulo}
                    >
                      {h.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Frases Textuais (Sem Interpretação, Sem Resumo) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <span>5 Frases Textuais do Entrevistado</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  O campo mais importante
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                "Preencha com as palavras exatas do entrevistado, não com as suas. Sem resumo, sem filtro."
              </p>

              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="relative">
                  <span className="absolute left-2 top-2 text-[10px] font-mono font-bold text-slate-500">
                    "{idx + 1}
                  </span>
                  <textarea
                    rows={2}
                    value={frasesTextuais[idx] || ''}
                    onChange={(e) => handleFraseChange(idx, e.target.value)}
                    placeholder={`Frase literal ${idx + 1}...`}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-7 pr-2 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* O Que Me Surpreendeu */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                O que me surpreendeu / O que não esperava ouvir:
              </label>
              <textarea
                rows={2}
                value={oQueSurpreendeu}
                onChange={(e) => setOQueSurpreendeu(e.target.value)}
                placeholder="Fato imprevisto ou hábito revelado..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Tentou Resolver & Gasto Próprio */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Já pagou do próprio bolso?</span>
                </span>
                <input
                  type="checkbox"
                  checked={pagouDoProprioBolso}
                  onChange={(e) => setPagouDoProprioBolso(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-emerald-600"
                />
              </div>

              {pagouDoProprioBolso && (
                <div>
                  <label className="text-[10px] text-slate-400">Quanto pagou e no quê?</label>
                  <input
                    type="text"
                    value={valorPagoDoProprioBolso}
                    onChange={(e) => setValorPagoDoProprioBolso(e.target.value)}
                    placeholder="Ex: R$ 140/mês em impressões ou R$ 47 em apostila"
                    className="mt-0.5 w-full rounded border border-emerald-900/60 bg-emerald-950/20 px-2 py-1 text-xs text-emerald-200"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400">O que já tentou resolver e abandonou?</label>
                <input
                  type="text"
                  value={tentouResolver}
                  onChange={(e) => setTentouResolver(e.target.value)}
                  placeholder="Ex: Comprou apostilas no Instagram e parou"
                  className="mt-0.5 w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Veredito das Hipóteses Testadas */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-300 block">
                Veredito por Hipótese:
              </label>
              {hipotesesTestadas.map((hId) => {
                const currentV = vereditosPorHipotese?.[hId]?.veredito || 'pendente';
                return (
                  <div key={hId} className="rounded-lg border border-slate-800 p-2 bg-slate-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-300">{hId}</span>
                      <div className="flex gap-1">
                        {(['valida', 'invalida', 'inconclusivo'] as VereditoType[]).map((v) => (
                          <button
                            key={v}
                            onClick={() => setHipoteseVeredito(hId, v, '')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              currentV === v
                                ? v === 'valida'
                                  ? 'bg-emerald-600 text-white'
                                  : v === 'invalida'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {v === 'inconclusivo' ? 'Inconc.' : v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder={`Justificativa objetiva para ${hId}...`}
                      value={vereditosPorHipotese?.[hId]?.justificativa || ''}
                      onChange={(e) => setHipoteseVeredito(hId, currentV, e.target.value)}
                      className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-200"
                    />
                  </div>
                );
              })}
            </div>

            {/* Veredito Geral da Sessão */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">Veredito Geral:</span>
                <select
                  value={vereditoGeral}
                  onChange={(e) => setVereditoGeral(e.target.value as VereditoType)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                >
                  <option value="valida">Valida (Comportamento)</option>
                  <option value="invalida">Invalida</option>
                  <option value="inconclusivo">Inconclusivo (Descarte)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Próximo Passo / Contato Obtido:</label>
                <input
                  type="text"
                  value={proximosPassos}
                  onChange={(e) => setProximosPassos(e.target.value)}
                  placeholder="Ex: Agendar visita com a diretora; pegar termo"
                  className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Botão de Gravação Final */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Salvar & Registrar no CRM</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Consulta Rápida: Perguntas Proibidas */}
      {showProhibitedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  As Perguntas Proibidas vs. O Que Perguntar
                </h3>
              </div>
              <button
                onClick={() => setShowProhibitedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Cada pergunta abaixo parece produtiva, mas destrói o dado colhido. Use a substituta no pretérito para medir comportamento real.
            </p>

            <div className="space-y-3">
              {PERGUNTAS_PROIBIDAS.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-rose-950/80 border border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      NÃO PERGUNTE
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.contexto}
                    </span>
                  </div>

                  <p className="font-semibold text-rose-200 line-through">
                    "{item.naoPergunte}"
                  </p>

                  <div className="rounded bg-slate-900 p-2 text-[11px] text-slate-400 border border-slate-800">
                    <strong className="text-slate-300">Por que falha: </strong>
                    {item.porQueFalha}
                  </div>

                  <div>
                    <span className="rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      PERGUNTE ISTO NO LUGAR
                    </span>
                    <p className="mt-1 font-semibold text-emerald-300">
                      "{item.pergunteIsto}"
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowProhibitedModal(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Entendido, voltar à entrevista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
