import React, { useState } from 'react';
import { RoteiroType, InterviewRecord } from '../types/validation';
import { ROTEIROS_CONFIG } from '../data/cadernoData';
import { submitPublicFormToFirestore } from '../services/storageService';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Building2,
  MapPin,
  User,
  Phone,
  HelpCircle,
  Briefcase,
  AlertTriangle,
  Users,
  GraduationCap,
  Landmark,
  Stethoscope,
  Heart,
  Baby,
  School,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface PublicRespondentViewProps {
  initialRoteiro?: RoteiroType;
  token?: string;
  onSubmit: (record: InterviewRecord) => Promise<void> | void;
  onAdminReturn?: () => void;
}

export const PublicRespondentView: React.FC<PublicRespondentViewProps> = ({
  initialRoteiro = 'A',
  token,
  onSubmit,
  onAdminReturn,
}) => {
  const [selectedRoteiro] = useState<RoteiroType>(initialRoteiro);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 2.5 - Termo de Consentimento Obrigatório antes de qualquer campo
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);
  const CONSENT_VERSION = 'v1.0';

  const handleConsentChange = (checked: boolean) => {
    setConsentAccepted(checked);
    if (checked) {
      setConsentTimestamp(new Date().toISOString());
    } else {
      setConsentTimestamp(null);
    }
  };

  // Perfil identificado pelo Roteiro
  const isFamily = selectedRoteiro === 'D' || selectedRoteiro === 'E';
  const isClinic = selectedRoteiro === 'G';
  const isManagement = selectedRoteiro === 'B';

  // Campos Gerais
  const [nome, setNome] = useState('');
  const [municipio, setMunicipio] = useState('Campo Grande - MS');
  const [contato, setContato] = useState('');
  const [pagouBolso, setPagouBolso] = useState(false);
  const [valorBolso, setValorBolso] = useState('');

  // 2.6 - Famílias (Roteiros D e E): apenas faixa de idade; diagnóstico/perfil removido
  const [parentesco, setParentesco] = useState('Mãe');
  const [parentescoCustom, setParentescoCustom] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState<'até 6' | '7 a 10' | '11 a 14' | '15 ou mais'>('7 a 10');
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
    if (!consentAccepted) {
      setSubmitError('É obrigatório ler e aceitar o Termo de Consentimento antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const nonBlankAnswers = Object.values(answers).filter((a) => a.trim().length > 0);
      const extractedQuotes = nonBlankAnswers.slice(0, 5);

      const finalParentesco = parentesco === 'Outro' ? (parentescoCustom.trim() || 'Familiar') : parentesco;
      const finalEscolaFilho = tipoEscolaFilho === 'Outro' ? (tipoEscolaCustom.trim() || 'Escola informada') : tipoEscolaFilho;

      const recordEscolaOrOrgao = isFamily
        ? `Família · ${finalEscolaFilho}`
        : (escolaOrOrgao.trim() || (isClinic ? 'Clínica Informada' : (isManagement ? 'Secretaria Informada' : 'Escola Informada')));

      const recordPerfil = isFamily
        ? `${finalParentesco} de estudante (Faixa: ${faixaEtaria})`
        : (perfil.trim() || roteiroConfig.targetAudience);

      const recordNome = nome.trim() || (isFamily ? `${finalParentesco} (${municipio})` : 'Respondente Anônimo');

      const submissionId = `resp_${Date.now()}`;
      const newRecord: InterviewRecord = {
        id: submissionId,
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
        status: 'agendado', // Submissão entra para revisão no CRM
        
        tipoPerfilIdentificacao: isFamily ? 'familia' : (isClinic ? 'clinica' : (isManagement ? 'gestao' : 'docente')),
        parentesco: isFamily ? finalParentesco : undefined,
        idadeFilhoOuAno: isFamily ? faixaEtaria : undefined,
        tipoEscolaFilho: isFamily ? finalEscolaFilho : undefined,
        funcaoOuCargo: !isFamily ? perfil.trim() : undefined,
        tempoExperiencia: !isFamily ? tempoDeCasa.trim() : undefined,

        entrevistador: 'Formulário Externo Tokenizado',
        anotador: 'Submissão Autônoma',
        duracaoMinutos: isFamily ? 10 : 15,
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
        frasesTextuais: extractedQuotes.length > 0 ? extractedQuotes : ['"Resposta registrada via formulário web."'],
        oQueSurpreendeu: isFamily
          ? 'Perspectiva familiar sobre rotinas e apoio à aprendizagem.'
          : 'Submissão assíncrona recebida através do formulário de campo.',
        tentouResolver: answers[`${selectedRoteiro}1_3`] || answers[`${selectedRoteiro}2_1`] || 'Relatado no formulário.',
        pagouDoProprioBolso: pagouBolso,
        valorPagoDoProprioBolso: valorBolso.trim(),
        vereditosPorHipotese: {},
        vereditoGeral: 'pendente',
        vereditoMotivoGeral: 'Aguardando auditoria do pesquisador no CRM.',
        proximosPassos: 'Revisar respostas e realizar follow-up se contato foi fornecido.',
        tags: [
          'Formulário Externo',
          `Roteiro-${selectedRoteiro}`,
          isFamily ? 'Família & Aluno' : (roteiroConfig.canal === 'saude' ? 'Eixo Saúde' : 'Eixo Educação'),
          token ? `Token-${token}` : 'Tokenizado'
        ],
        isExterna: true,
      };

      // 2.1 e 2.4: Grava diretamente na coleção validacao_respostas do Firestore e consome o token
      await submitPublicFormToFirestore(
        {
          ...newRecord,
          // Registra o consentimento explicitamente
          termoConsentimento: {
            aceito: true,
            dataHoraAceite: consentTimestamp || new Date().toISOString(),
            versaoTermo: CONSENT_VERSION,
            controlador: '[CONTROLADOR_AQUI]',
            encarregadoEmail: '[EMAIL_ENCARREGADO_AQUI]',
          },
        } as any,
        token
      );

      // Notifica callback do App
      await onSubmit(newRecord);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Erro ao enviar formulário:', err);
      setSubmitError('Não foi possível gravar sua resposta no momento. Por favor, tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Limpo */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-500/20">
              HR
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-tight">
                HiperReforço
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                Pesquisa & Validação de Campo
              </span>
            </div>
          </div>
          {token && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              Convite Individual Ativo
            </span>
          )}
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {isSubmitted ? (
          /* Tela de Agradecimento e Confirmação */
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 shadow-xl shadow-emerald-950/50">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-mono font-bold text-emerald-300 uppercase border border-emerald-800">
                Respostas Registradas com Sucesso
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Muito Obrigado pela Sua Participação!
              </h1>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Suas contribuições práticas foram armazenadas na base de validação e nos ajudarão a estruturar soluções mais adequadas para a inclusão escolar.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left text-xs text-slate-400 max-w-md mx-auto space-y-2">
              <div className="flex justify-between">
                <span>Roteiro de Campo:</span>
                <span className="font-bold text-white">Roteiro {selectedRoteiro} ({roteiroConfig.title})</span>
              </div>
              <div className="flex justify-between">
                <span>Data de Envio:</span>
                <span className="font-mono text-slate-300">{new Date().toLocaleString('pt-BR')}</span>
              </div>
              {token && (
                <div className="flex justify-between">
                  <span>Status do Convite:</span>
                  <span className="font-mono text-emerald-400">Consumido (Uso Único Concluído)</span>
                </div>
              )}
            </div>

            <div className="pt-4">
              <p className="text-xs text-slate-500">
                Você pode fechar esta janela com segurança.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Introdução e Contextualização */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold font-mono border ${
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
                  Tempo estimado: ~4 a 6 minutos
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {isFamily
                  ? `Questionário com Famílias: ${roteiroConfig.targetAudience}`
                  : `Questionário de Campo: ${roteiroConfig.targetAudience}`}
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isFamily
                  ? 'Estamos ouvindo famílias para entender a rotina real de estudos em casa e os desafios cotidianos de aprendizagem. Não estamos vendendo nenhum produto ou material.'
                  : 'Estamos investigando os desafios e a rotina de quem atua no apoio e desenvolvimento de estudantes. Não estamos vendendo produtos nem serviços.'}
              </p>
            </div>

            {/* Formulário Interativo */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* =======================================================
                  2.5: CONSENTIMENTO ANTES DO PRIMEIRO CAMPO (OBRIGATÓRIO)
                 ======================================================= */}
              <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">
                    Termo de Consentimento Livre e Esclarecido ({CONSENT_VERSION}) *
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-300 space-y-3 leading-relaxed max-h-56 overflow-y-auto">
                  <p>
                    <strong className="text-white">1. Controlador dos Dados:</strong><br />
                    Esta pesquisa é realizada sob a responsabilidade institucional de <strong className="text-indigo-300 font-mono">[CONTROLADOR_AQUI]</strong>.
                  </p>
                  <p>
                    <strong className="text-white">2. Finalidade do Levantamento:</strong><br />
                    Os dados são coletados unicamente para levantamento de necessidades pedagógicas e rotinas práticas. O tratamento ocorre exclusivamente para uso agregado e estatístico.
                  </p>
                  <p>
                    <strong className="text-white">3. Participação Voluntária:</strong><br />
                    Sua participação é estritamente voluntária e pode ser interrompida a qualquer momento, sem qualquer prejuízo.
                  </p>
                  <p>
                    <strong className="text-white">4. Direitos do Titular e Canal de Exclusão:</strong><br />
                    O titular pode solicitar a exclusão de suas respostas a qualquer momento através do e-mail do encarregado: <strong className="text-indigo-300 font-mono">[EMAIL_ENCARREGADO_AQUI]</strong>.
                  </p>
                  <p>
                    <strong className="text-white">5. Anonimização de Citações:</strong><br />
                    Eventuais citações ou relatos textuais serão utilizados de forma estritamente anonimizada, preservando a identidade dos participantes e de seus filhos.
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-950/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => handleConsentChange(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-200 font-medium leading-relaxed">
                    Li e aceito os termos da pesquisa. Concordo voluntariamente em participar do levantamento de necessidades conforme as diretrizes descritas acima. *
                  </span>
                </label>
              </div>

              {/* =======================================================
                  BLOCO 1: IDENTIFICAÇÃO DINÂMICA CONFORME O PERFIL
                 ======================================================= */}
              {isFamily ? (
                /* === PERFIL FAMÍLIA (ROTEIROS D E E) === */
                <div className={`rounded-2xl border border-pink-500/30 bg-slate-900/90 p-6 shadow-xl space-y-4 transition-opacity ${!consentAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4 text-pink-400" />
                      1. Identificação da Família
                    </h2>
                    <p className="text-xs text-slate-400">
                      Informações gerais sobre o seu contexto familiar.
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

                    {/* 2.6 - Faixa Etária da Criança (em substituição à idade exata e sem campo de diagnóstico) */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Faixa de Idade da Criança *
                      </label>
                      <select
                        value={faixaEtaria}
                        onChange={(e) => setFaixaEtaria(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="até 6">até 6 anos</option>
                        <option value="7 a 10">7 a 10 anos</option>
                        <option value="11 a 14">11 a 14 anos</option>
                        <option value="15 ou mais">15 ou mais anos</option>
                      </select>
                      <span className="block mt-1 text-[11px] text-slate-400">
                        Classificação por faixa para preservação de privacidade.
                      </span>
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

                    {/* Tipo de Escola */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Tipo de Escola
                      </label>
                      <select
                        value={tipoEscolaFilho}
                        onChange={(e) => setTipoEscolaFilho(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-pink-500 focus:outline-none transition-colors"
                      >
                        <option value="Escola Pública Municipal">Escola Pública Municipal</option>
                        <option value="Escola Pública Estadual">Escola Pública Estadual</option>
                        <option value="Escola Particular / Privada">Escola Particular / Privada</option>
                        <option value="Ensino Domiciliar">Ensino Domiciliar</option>
                        <option value="Outro">Outro tipo</option>
                      </select>
                    </div>

                    {/* Nome do Responsável (Opcional) */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome ou Primeiro Nome (Opcional)
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Mariana ou Carlos (Opcional)"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Contato (Opcional) */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        WhatsApp ou E-mail (Opcional para acompanhamento)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Ex: (67) 99999-9999 ou email@exemplo.com"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* === PERFIL PROFISSIONAL / GESTÃO / CLÍNICA === */
                <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4 transition-opacity ${!consentAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-indigo-400" />
                      1. Identificação Profissional & Atuação
                    </h2>
                    <p className="text-xs text-slate-400">
                      Informações sobre sua prática profissional e contexto de atuação.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Instituição, Clínica ou Escola
                      </label>
                      <input
                        type="text"
                        value={escolaOrOrgao}
                        onChange={(e) => setEscolaOrOrgao(e.target.value)}
                        placeholder={isClinic ? 'Ex: Clínica de Desenvolvimento Infantil' : 'Ex: Escola Municipal ou Secretaria'}
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
                        Sua Função / Especialidade
                      </label>
                      <input
                        type="text"
                        value={perfil}
                        onChange={(e) => setPerfil(e.target.value)}
                        placeholder={isClinic ? 'Ex: Psicóloga Infantil / Neuropsicopedagoga' : 'Ex: Professor(a) de AEE'}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Tempo de Atuação na Função
                      </label>
                      <input
                        type="text"
                        value={tempoDeCasa}
                        onChange={(e) => setTempoDeCasa(e.target.value)}
                        placeholder="Ex: 5 anos de atendimento"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Seu Nome (Opcional)
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome profissional ou como prefere ser chamado(a)"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Contato / E-mail ou WhatsApp (Opcional)
                      </label>
                      <input
                        type="text"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Para caso queira receber os resultados da pesquisa"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* =======================================================
                  BLOCO 2: PERGUNTAS DO ROTEIRO COM AVISO DE TEXTO LIVRE
                 ======================================================= */}
              <div className={`space-y-6 transition-opacity ${!consentAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
                {roteiroConfig.blocks.map((block, bIdx) => (
                  <div
                    key={block.blockId}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5"
                  >
                    <div className="border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase">
                          Bloco {bIdx + 1}
                        </span>
                        {block.estimatedTime && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {block.estimatedTime}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-bold text-white mt-1">
                        {block.title}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {block.questions.map((q) => (
                        <div key={q.id} className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-200 block leading-snug">
                            <span className="font-bold text-indigo-300 mr-1.5">
                              {q.id}.
                            </span>
                            {q.text}
                          </label>

                          {q.tip && (
                            <p className="text-[11px] text-slate-400 italic">
                              💡 {q.tip}
                            </p>
                          )}

                          <textarea
                            rows={3}
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Descreva fatos, rotinas e situações reais que você vivencia..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors resize-y"
                          />

                          {/* 2.6: Aviso obrigatório em todos os campos de texto livre */}
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium pt-0.5">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                            <span>Não escreva o nome da criança.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* =======================================================
                  BLOCO 3: GASTOS E RECURSOS PRÓPRIOS
                 ======================================================= */}
              <div className={`rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4 transition-opacity ${!consentAccepted ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="border-b border-slate-800 pb-2">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-400" />
                    Gastos e Aquisições com Recursos Próprios
                  </h2>
                  <p className="text-xs text-slate-400">
                    Investimentos do próprio bolso em materiais ou apoios adicionais.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={pagouBolso}
                      onChange={(e) => setPagouBolso(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white block">
                        {isFamily
                          ? 'Já paguei do meu próprio bolso por reforços, materiais ou terapias particulares.'
                          : 'Já paguei do meu próprio bolso por materiais, impressões, jogos ou cursos para atender estudantes.'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Assinale se você já utilizou recursos próprios para viabilizar apoios.
                      </span>
                    </div>
                  </label>

                  {pagouBolso && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Aproximadamente quanto você já gastou ou costuma gastar, e com quais itens?
                      </label>
                      <input
                        type="text"
                        value={valorBolso}
                        onChange={(e) => setValorBolso(e.target.value)}
                        placeholder="Ex: R$ 350 por mês com impressões e jogos pedagógicos"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>Não escreva o nome da criança.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerta de Erro no Envio */}
              {submitError && (
                <div className="rounded-xl border border-rose-500/50 bg-rose-950/70 p-4 text-xs text-rose-200 flex items-start gap-3 shadow-lg">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">Não foi possível enviar suas respostas</p>
                    <p>{submitError}</p>
                  </div>
                </div>
              )}

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !consentAccepted}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                    isSubmitting || !consentAccepted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Gravando respostas...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Enviar Minhas Respostas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
