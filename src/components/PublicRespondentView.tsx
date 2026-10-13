import React, { useState } from 'react';
import { RoteiroType, InterviewRecord } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import {
  Sparkles,
  Send,
  CheckCircle2,
  ShieldCheck,
  Building2,
  MapPin,
  User,
  Phone,
  HelpCircle,
  Briefcase,
  Lock,
  Users,
  GraduationCap,
  Landmark,
  Stethoscope,
  Heart,
  Baby,
  School,
} from 'lucide-react';

interface PublicRespondentViewProps {
  initialRoteiro?: RoteiroType;
  onSubmit: (record: InterviewRecord) => Promise<void> | void;
  onAdminReturn?: () => void;
}

export const PublicRespondentView: React.FC<PublicRespondentViewProps> = ({
  initialRoteiro = 'A',
  onSubmit,
  onAdminReturn,
}) => {
  const [selectedRoteiro, setSelectedRoteiro] = useState<RoteiroType>(initialRoteiro);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Perfil identificado pelo Roteiro
  const isFamily = selectedRoteiro === 'D' || selectedRoteiro === 'E';
  const isClinic = selectedRoteiro === 'G';
  const isManagement = selectedRoteiro === 'B';
  const isTeacher = selectedRoteiro === 'A' || selectedRoteiro === 'C';

  // Campos Gerais
  const [nome, setNome] = useState('');
  const [municipio, setMunicipio] = useState('Campo Grande - MS');
  const [contato, setContato] = useState('');
  const [pagouBolso, setPagouBolso] = useState(false);
  const [valorBolso, setValorBolso] = useState('');

  // Campos Específicos para Famílias (Roteiros D e E)
  const [parentesco, setParentesco] = useState('Mãe');
  const [parentescoCustom, setParentescoCustom] = useState('');
  const [idadeFilhoOuAno, setIdadeFilhoOuAno] = useState('');
  const [diagnosticoFilho, setDiagnosticoFilho] = useState('');
  const [tipoEscolaFilho, setTipoEscolaFilho] = useState('Escola Pública Municipal');
  const [tipoEscolaCustom, setTipoEscolaCustom] = useState('');

  // Campos para Docentes, Gestores e Clínicos (Roteiros A, B, C, G)
  const [escolaOrOrgao, setEscolaOrOrgao] = useState('');
  const [perfil, setPerfil] = useState('');
  const [tempoDeCasa, setTempoDeCasa] = useState('');

  // Respostas às perguntas
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const roteiroConfig = ROTEIROS_CONFIG[selectedRoteiro] || ROTEIROS_CONFIG['A'];

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const nonBlankAnswers = Object.values(answers).filter((a) => a.trim().length > 0);
      const extractedQuotes = nonBlankAnswers.slice(0, 5);

      const finalParentesco = parentesco === 'Outro' ? (parentescoCustom.trim() || 'Familiar') : parentesco;
      const finalEscolaFilho = tipoEscolaFilho === 'Outro' ? (tipoEscolaCustom.trim() || 'Escola informada') : tipoEscolaFilho;

      const recordEscolaOrOrgao = isFamily
        ? `Família · ${finalEscolaFilho}`
        : (escolaOrOrgao.trim() || (isClinic ? 'Clínica Informada' : (isManagement ? 'Secretaria Informada' : 'Escola Informada')));

      const recordPerfil = isFamily
        ? `${finalParentesco} de estudante (${idadeFilhoOuAno.trim() || 'Idade não informada'}${diagnosticoFilho.trim() ? ` · ${diagnosticoFilho.trim()}` : ''})`
        : (perfil.trim() || roteiroConfig.targetAudience);

      const recordNome = nome.trim() || (isFamily ? `${finalParentesco} (${municipio})` : 'Respondente Anônimo');

      const newRecord: InterviewRecord = {
        id: `form_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        municipio: municipio.trim() || 'Campo Grande - MS',
        escolaOrOrgao: recordEscolaOrOrgao,
        entrevistadoPerfil: recordPerfil,
        entrevistadoNome: recordNome,
        tempoDeCasa: !isFamily ? tempoDeCasa.trim() : undefined,
        contato: contato.trim(),
        roteiro: selectedRoteiro,
        canal: roteiroConfig.canal,
        status: 'agendado', // Entra como lead pronto para análise no CRM
        
        // Identificação estruturada por perfil
        tipoPerfilIdentificacao: isFamily ? 'familia' : (isClinic ? 'clinica' : (isManagement ? 'gestao' : 'docente')),
        parentesco: isFamily ? finalParentesco : undefined,
        idadeFilhoOuAno: isFamily ? idadeFilhoOuAno.trim() : undefined,
        diagnosticoOuPerfilFilho: isFamily ? diagnosticoFilho.trim() : undefined,
        tipoEscolaFilho: isFamily ? finalEscolaFilho : undefined,
        funcaoOuCargo: !isFamily ? perfil.trim() : undefined,
        tempoExperiencia: !isFamily ? tempoDeCasa.trim() : undefined,

        entrevistador: 'Formulário Externo Web',
        anotador: 'Submissão Autônoma do Respondente',
        duracaoMinutos: isFamily ? 12 : 15,
        checklistProgress: Object.keys(answers).reduce((acc, k) => {
          acc[k] = true;
          return acc;
        }, {} as Record<string, boolean>),
        checklistNotes: answers,
        hipotesesTestadas:
          selectedRoteiro === 'G'
            ? ['HS1', 'HS2', 'HS3', 'HS4', 'HS5']
            : selectedRoteiro === 'B'
            ? ['H3', 'H4']
            : selectedRoteiro === 'E'
            ? ['H6']
            : selectedRoteiro === 'D'
            ? ['H6', 'H1']
            : ['H1', 'H2', 'H5'],
        frasesTextuais: extractedQuotes.length > 0 ? extractedQuotes : ['"Resposta registrada via questionário web direto."'],
        oQueSurpreendeu: isFamily
          ? 'Perspectiva familiar recebida sobre custos e rotina de apoio aos estudos.'
          : 'Submissão assíncrona recebida através do formulário de campo público.',
        tentouResolver: answers[`${selectedRoteiro}1_3`] || answers[`${selectedRoteiro}2_1`] || 'Relatado no formulário.',
        pagouDoProprioBolso: pagouBolso,
        valorPagoDoProprioBolso: valorBolso.trim(),
        vereditosPorHipotese: {},
        vereditoGeral: 'pendente',
        vereditoMotivoGeral: 'Aguardando auditoria do pesquisador no CRM.',
        proximosPassos: 'Revisar notas da submissão e realizar follow-up se contato foi fornecido.',
        tags: [
          'Formulário Externo',
          `Roteiro-${selectedRoteiro}`,
          isFamily ? 'Família & Aluno' : (roteiroConfig.canal === 'saude' ? 'Eixo Saúde' : 'Eixo Educação')
        ],
        isExterna: true,
      };

      // Envia para o servidor backend para persistência e sincronização entre dispositivos
      try {
        await fetch('/api/forms/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord),
        });
      } catch (postErr) {
        console.warn('Persistência local mantida, erro ao sincronizar com backend:', postErr);
      }

      await onSubmit(newRecord);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setAnswers({});
    setNome('');
    setEscolaOrOrgao('');
    setPerfil('');
    setTempoDeCasa('');
    setContato('');
    setIdadeFilhoOuAno('');
    setDiagnosticoFilho('');
    setPagouBolso(false);
    setValorBolso('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Topo Limpo e Institucional - Sem nenhum botão ou menu de CRM */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${
              isFamily
                ? 'from-pink-500 via-rose-600 to-purple-600 shadow-pink-500/20'
                : isClinic
                ? 'from-teal-500 via-emerald-600 to-cyan-700 shadow-teal-500/20'
                : isManagement
                ? 'from-amber-500 via-orange-600 to-amber-700 shadow-amber-500/20'
                : 'from-indigo-500 via-indigo-600 to-purple-600 shadow-indigo-500/20'
            }`}>
              {isFamily ? (
                <Users className="h-5 w-5 text-white" />
              ) : isClinic ? (
                <Stethoscope className="h-5 w-5 text-white" />
              ) : isManagement ? (
                <Landmark className="h-5 w-5 text-white" />
              ) : (
                <Sparkles className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  Hiper<span className={isFamily ? 'text-pink-400' : isClinic ? 'text-teal-400' : 'text-indigo-400'}>Reforço</span>
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isFamily
                    ? 'bg-pink-950/70 border-pink-700/60 text-pink-300'
                    : 'bg-emerald-950 border border-emerald-700/60 text-emerald-300'
                }`}>
                  {isFamily ? 'Pesquisa com Famílias' : 'Pesquisa de Campo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isFamily
                  ? 'Apoio Prático à Aprendizagem e Potencialidades da Criança'
                  : 'Inovação Educacional & Apoio Prático à Neurodiversidade'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Lock className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ambiente Seguro & Sigiloso</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {isSubmitted ? (
          /* Tela de Agradecimento e Confirmação */
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/20 p-8 sm:p-12 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-950">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="rounded-full bg-emerald-900/60 border border-emerald-600/60 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Submissão Confirmada
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Muito Obrigado pela Sua Participação!
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed pt-2">
                {isFamily
                  ? 'Sua resposta foi gravada com sucesso. A visão de quem acompanha a criança em casa todos os dias é o alicerce fundamental para desenharmos estratégias que respeitem o ritmo e os interesses reais do seu filho(a).'
                  : 'Sua resposta foi gravada com sucesso. A sua experiência prática na linha de frente é indispensável para construir soluções verdadeiramente ancoradas na realidade de educadores, terapeutas e redes de ensino.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400 max-w-md mx-auto text-left space-y-1">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Compromisso Metodológico:
              </p>
              <p>
                Os dados fornecidos são sigilosos e destinados exclusivamente ao mapeamento de necessidades educacionais reais, sem qualquer finalidade comercial.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-2.5 text-xs font-bold text-slate-200 transition-colors"
              >
                Enviar Outra Resposta
              </button>
            </div>
          </div>
        ) : (
          /* Formulário de Resposta para o Entrevistado */
          <div className="space-y-6">
            {/* Apresentação Ética e Objetiva */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isFamily
                    ? 'bg-pink-950 border-pink-700/60 text-pink-300'
                    : isClinic
                    ? 'bg-teal-950 border-teal-700/60 text-teal-300'
                    : isManagement
                    ? 'bg-amber-950 border-amber-700/60 text-amber-300'
                    : 'bg-indigo-950 border-indigo-700/60 text-indigo-300'
                }`}>
                  {roteiroConfig.title}
                </span>
                <span className="text-xs text-slate-400">
                  Tempo estimado: ~4 a 7 minutos
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {isFamily
                  ? `Questionário com Famílias: ${roteiroConfig.targetAudience}`
                  : `Questionário de Campo: ${roteiroConfig.targetAudience}`}
              </h1>

              <div className={`rounded-xl border p-4 text-xs leading-relaxed space-y-2 ${
                isFamily
                  ? 'border-pink-500/20 bg-pink-950/20 text-slate-200'
                  : 'border-indigo-500/20 bg-indigo-950/30 text-slate-300'
              }`}>
                <p className={`font-semibold flex items-center gap-1.5 ${isFamily ? 'text-pink-200' : 'text-indigo-200'}`}>
                  <ShieldCheck className={`h-4 w-4 shrink-0 ${isFamily ? 'text-pink-400' : 'text-indigo-400'}`} />
                  Pesquisa Independente Needs-First (Sem Intuito Comercial)
                </p>
                <p>
                  {isFamily
                    ? 'Estamos ouvindo famílias para entender a rotina real de estudos em casa, os desafios no dia a dia com a escola e o que realmente funciona para apoiar a aprendizagem. Não estamos vendendo materiais, assinaturas ou cursos.'
                    : 'Estamos investigando os desafios e a rotina de quem atua no apoio e desenvolvimento de crianças neurodivergentes. Não estamos vendendo produtos nem serviços. Queremos ouvir fatos e comportamentos da sua prática diária real.'}
                </p>
              </div>

              {roteiroConfig.regulatoryNotice && (
                <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3.5 text-xs text-teal-200">
                  <span className="font-bold">Nota de Conformidade Ética: </span>
                  {roteiroConfig.regulatoryNotice}
                </div>
              )}
            </div>

            {/* Formulário Interativo */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* =======================================================
                  BLOCO 1: IDENTIFICAÇÃO DINÂMICA CONFORME O PERFIL
                 ======================================================= */}
              {isFamily ? (
                /* === PERFIL FAMÍLIA (ROTEIROS D E E) === */
                <div className="rounded-2xl border border-pink-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-pink-400" />
                      1. Identificação da Família & Contexto da Criança
                    </h2>
                    <p className="text-xs text-slate-400">
                      Informações sobre você e sobre seu filho(a), sem termos ou burocracias escolares.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Grau de Parentesco */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Vínculo / Parentesco *
                      </label>
                      <select
                        value={parentesco}
                        onChange={(e) => setParentesco(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Responsável Legal">Responsável Legal</option>
                        <option value="Cuidador(a)">Cuidador(a)</option>
                        <option value="Avó / Avô">Avó / Avô</option>
                        <option value="Outro">Outro familiar</option>
                      </select>
                      {parentesco === 'Outro' && (
                        <input
                          type="text"
                          value={parentescoCustom}
                          onChange={(e) => setParentescoCustom(e.target.value)}
                          placeholder="Especifique seu vínculo (ex: Tia, Irmão)"
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Nome do Responsável */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome (ou como prefere ser chamado/a)
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Mariana Mendes ou Carlos"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Município e Estado */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Município e Estado (UF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        placeholder="Ex: Campo Grande - MS"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Idade e Série do Filho */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Idade e Ano Escolar do Filho(a) *
                      </label>
                      <input
                        type="text"
                        required
                        value={idadeFilhoOuAno}
                        onChange={(e) => setIdadeFilhoOuAno(e.target.value)}
                        placeholder="Ex: 8 anos (3º ano do Ensino Fundamental)"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Diagnóstico / Perfil da Criança */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        {selectedRoteiro === 'D'
                          ? 'Diagnóstico ou Perfil do Filho(a) (se houver)'
                          : 'Perfil do Estudante'}
                      </label>
                      <input
                        type="text"
                        value={diagnosticoFilho}
                        onChange={(e) => setDiagnosticoFilho(e.target.value)}
                        placeholder={
                          selectedRoteiro === 'D'
                            ? 'Ex: TEA Nível 1, TDAH, Altas Habilidades, ou em investigação'
                            : 'Ex: Aluno típico sem laudo / Dificuldade em Matemática'
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Tipo de Escola */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Tipo de Escola que Frequenta
                      </label>
                      <select
                        value={tipoEscolaFilho}
                        onChange={(e) => setTipoEscolaFilho(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="Escola Pública Municipal">Escola Pública Municipal</option>
                        <option value="Escola Pública Estadual">Escola Pública Estadual</option>
                        <option value="Escola Privada / Particular">Escola Privada / Particular</option>
                        <option value="Ensino Domiciliar">Ensino Domiciliar</option>
                        <option value="Outro">Outro formato</option>
                      </select>
                      {tipoEscolaFilho === 'Outro' && (
                        <input
                          type="text"
                          value={tipoEscolaCustom}
                          onChange={(e) => setTipoEscolaCustom(e.target.value)}
                          placeholder="Qual tipo de escola?"
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Contato Opcional */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp ou E-mail para contato (Opcional)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Caso deseje receber a devolutiva da pesquisa ou novidades pedagógicas do projeto"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : isManagement ? (
                /* === PERFIL GESTÃO / SECRETARIA (ROTEIRO B) === */
                <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-amber-400" />
                      1. Identificação Institucional & Órgão Gestor
                    </h2>
                    <p className="text-xs text-slate-400">
                      Informações da secretaria de educação e do cargo institucional para mapeamento de rede.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome ou Cargo (ou Pseudônimo)
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Profa. Patrícia - Coordenação"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Município e Estado (UF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        placeholder="Ex: Dourados - MS"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Secretaria de Educação ou Diretoria / Órgão Público *
                      </label>
                      <input
                        type="text"
                        required
                        value={escolaOrOrgao}
                        onChange={(e) => setEscolaOrOrgao(e.target.value)}
                        placeholder="Ex: SEMED Campo Grande - Coordenadoria de Educação Inclusiva"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Cargo / Função Institucional & Tempo na Rede
                      </label>
                      <input
                        type="text"
                        value={perfil}
                        onChange={(e) => setPerfil(e.target.value)}
                        placeholder="Ex: Coordenadora de AEE há 4 anos"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp ou E-mail institucional (Opcional)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Para envio do relatório técnico executivo da pesquisa"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : isClinic ? (
                /* === PERFIL SAÚDE & CLÍNICA (ROTEIRO G) === */
                <div className="rounded-2xl border border-teal-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-teal-400" />
                      1. Identificação Clínica & Espaço Terapêutico
                    </h2>
                    <p className="text-xs text-slate-400">
                      Contexto de atendimento clínico infantil em consultório ou clínica multidisciplinar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome ou Pseudônimo
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Dra. Camila Sampaio"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Município e Estado (UF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        placeholder="Ex: Campo Grande - MS"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Clínica, Consultório ou Espaço Terapêutico *
                      </label>
                      <input
                        type="text"
                        required
                        value={escolaOrOrgao}
                        onChange={(e) => setEscolaOrOrgao(e.target.value)}
                        placeholder="Ex: Clínica Desenvolvimento Infantil / Consultório Próprio"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Especialidade Clínica & Tempo de Atendimento
                      </label>
                      <input
                        type="text"
                        value={perfil}
                        onChange={(e) => setPerfil(e.target.value)}
                        placeholder="Ex: Terapeuta Ocupacional / Psicóloga Infantil há 8 anos"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp ou E-mail profissional (Opcional)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Para envio do resumo da pesquisa clínica ou contato de follow-up"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* === PERFIL DOCENTE / SALA DE RECURSOS (ROTEIROS A E C) === */
                <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4">
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-400" />
                      1. Identificação Docente & Sala de Recursos
                    </h2>
                    <p className="text-xs text-slate-400">
                      Contexto da sua atuação pedagógica na sala de recursos multifuncional ou sala regular.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome (ou Pseudônimo se preferir)
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Profa. Ana Maria"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Município e Estado (UF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        placeholder="Ex: Campo Grande - MS"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Escola(s) e/ou Sala de Recursos Multifuncional *
                      </label>
                      <input
                        type="text"
                        required
                        value={escolaOrOrgao}
                        onChange={(e) => setEscolaOrOrgao(e.target.value)}
                        placeholder="Ex: E.M. Darcy Ribeiro ou Sala de Recursos AEE"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Função Docente & Tempo em Educação Especial
                      </label>
                      <input
                        type="text"
                        value={perfil}
                        onChange={(e) => setPerfil(e.target.value)}
                        placeholder="Ex: Professora de AEE há 6 anos"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp ou E-mail para contato (Opcional)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Para envio do resumo da pesquisa pedagógica ou contato de follow-up"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================
                  BLOCO 2: PERGUNTAS ESPECÍFICAS DO ROTEIRO
                 ======================================================= */}
              <div className="space-y-6">
                {roteiroConfig.blocks.map((block, bIdx) => (
                  <div
                    key={block.blockId}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5"
                  >
                    <div className="border-b border-slate-800 pb-2.5">
                      <span className={`text-[10px] font-mono uppercase font-bold ${
                        isFamily ? 'text-pink-400' : isClinic ? 'text-teal-400' : 'text-indigo-400'
                      }`}>
                        {isFamily ? 'Tópico' : 'Bloco'} {bIdx + 1} de {roteiroConfig.blocks.length}
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {block.title}
                      </h3>
                      {block.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {block.notes}
                        </p>
                      )}
                    </div>

                    <div className="space-y-5">
                      {block.questions.map((q) => (
                        <div key={q.id} className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-200 block leading-relaxed">
                            <span className={`inline-block rounded border px-1.5 py-0.2 text-[10px] font-mono mr-2 ${
                              isFamily
                                ? 'bg-pink-950 border-pink-800 text-pink-300'
                                : isClinic
                                ? 'bg-teal-950 border-teal-800 text-teal-300'
                                : 'bg-indigo-950 border-indigo-800 text-indigo-300'
                            }`}>
                              #{q.order}
                            </span>
                            {q.text}
                          </label>

                          {q.tip && (
                            <p className="text-[11px] text-slate-400 italic pl-1">
                              💡 {q.tip}
                            </p>
                          )}

                          <textarea
                            rows={3}
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder={
                              isFamily
                                ? 'Conte com suas próprias palavras como isso acontece na rotina do seu filho(a)...'
                                : 'Descreva como isso acontece ou aconteceu na sua rotina real...'
                            }
                            className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                              isFamily ? 'focus:border-pink-500' : isClinic ? 'focus:border-teal-500' : 'focus:border-indigo-500'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bloco 3: Pergunta Comportamental sobre Gastos */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-400" />
                    {isFamily
                      ? 'Investimento Pessoal com Recursos ou Terapias'
                      : 'Comportamento Real de Investimento Próprio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isFamily
                      ? 'Ajuda a mapear os custos que as famílias assumem diretamente para apoiar os estudos ou desenvolvimento.'
                      : 'Mapeamento de dor aguda comprovada por desembolso próprio (não hipotético).'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={pagouBolso}
                      onChange={(e) => setPagouBolso(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {isFamily
                          ? 'Já paguei do meu próprio bolso por reforço, materiais adaptados, cursos ou terapias nos últimos 12 meses'
                          : 'Já paguei do meu próprio bolso por materiais, plataformas, cursos ou ferramentas para uso com alunos/pacientes'}
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Indica que a necessidade já exigiu investimento financeiro direto por iniciativa própria.
                      </p>
                    </div>
                  </label>

                  {pagouBolso && (
                    <div className="pl-7 pt-1 animate-fade-in">
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Quanto você estima ter investido? (Valor aproximado em R$)
                      </label>
                      <input
                        type="text"
                        value={valorBolso}
                        onChange={(e) => setValorBolso(e.target.value)}
                        placeholder="Ex: R$ 350,00 ou R$ 120,00/mês"
                        className="w-full sm:w-64 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white shadow-xl transition-all ${
                    isSubmitting
                      ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                      : isFamily
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-600/30'
                      : isClinic
                      ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 shadow-teal-600/30'
                      : isManagement
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-600/30'
                      : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gravando respostas com segurança...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{isFamily ? 'Enviar Respostas da Família' : 'Enviar Respostas da Pesquisa'}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 mt-3">
                  🔒 Suas respostas são armazenadas com integridade metodológica e confidencialidade.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Rodapé Limpo */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-400">
        <p>Projeto HiperReforço · Pesquisa Empírica e Validação de Hipóteses</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Inovação no acolhimento de hiperfocos e apoio à neurodiversidade no Brasil.
        </p>
      </footer>
    </div>
  );
};
