import React, { useState } from 'react';
import { InterviewRecord, RoteiroType, HipoteseId, VereditoType } from '../types/validation';
import {
  Video,
  Upload,
  FileText,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileCode,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface MeetTranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionLoaded: (record: InterviewRecord) => void;
}

const SAMPLE_MEET_TRANSCRIPT = `WEBVTT

00:00:02.100 --> 00:00:08.400
Entrevistador (HiperReforço): Bom dia, professora Silvana! Muito obrigado por aceitar essa conversa rápida aqui pelo Google Meet.

00:00:08.500 --> 00:00:15.200
Profa. Silvana: Bom dia! Imagina, estou no meu intervalo aqui na Sala de Recursos da Escola Municipal Padre João Crippa, em Campo Grande.

00:00:15.300 --> 00:00:23.000
Entrevistador: Quantos alunos você atende hoje aqui no AEE e há quanto tempo você atua nessa área?

00:00:23.100 --> 00:00:32.800
Profa. Silvana: Trabalho há sete anos com educação especial. Hoje tenho 18 alunos matriculados na sala de recursos, a maioria com diagnóstico de TEA e TDAH.

00:00:33.000 --> 00:00:44.200
Entrevistador: Me conta como foi a última vez que você preparou material para um aluno específico. Quanto tempo levou e em que momento você fez?

00:00:44.400 --> 00:00:58.700
Profa. Silvana: Olha, na terça-feira passada eu passei quase duas horas da minha noite em casa procurando imagens no Google e recortando no Word porque na escola a impressora não tinha tinta colorida.

00:00:59.000 --> 00:01:09.500
Entrevistador: E você já chegou a pagar do seu próprio bolso por material ou ferramenta para aplicar na sala?

00:01:09.700 --> 00:01:22.600
Profa. Silvana: Já paguei sim, e muito! Mês passado gastei noventa e cinco reais na papelaria comprando velcro, papel plastificado e canetões. Se eu não comprar do meu bolso, o aluno fica sem a atividade adaptada.

00:01:23.000 --> 00:01:31.000
Entrevistador: E sobre o PEI, o Plano de Ensino Individualizado, quando você fez a última vez e pra onde ele foi depois de pronto?

00:01:31.200 --> 00:01:42.800
Profa. Silvana: O PEI a gente entrega no começo do semestre, a coordenação arquiva na pasta de prontuário e ninguém mais mexe nele. Quando eu preciso lembrar de algo, consulto meu caderno pessoal espiral.

00:01:43.000 --> 00:01:52.500
Entrevistador: Você tem algum aluno com um interesse muito forte por algum assunto específico? Já aconteceu de usar esse interesse em alguma tarefa?

00:01:52.700 --> 00:02:08.400
Profa. Silvana: Tenho o Lucas, de 8 anos, que é apaixonado por dinossauros herbívoros. Ele não queria escrever de jeito nenhum. Criei uma cartela de bingo com nomes de dinossauros e ele completou a escrita em vinte minutos sem chorar. Foi mágico.

00:02:08.800 --> 00:02:16.000
Entrevistador: Perfeito, professora Silvana. Posso pegar seu contato para mantermos o diálogo sobre a pesquisa na rede?

00:02:16.200 --> 00:02:22.000
Profa. Silvana: Claro! Meu WhatsApp é (67) 99234-5678 e meu e-mail institucional é silvana.aee@semed.cg.ms.gov.br.`;

const SAMPLE_CLINICA_TRANSCRIPT = `WEBVTT

00:00:01.000 --> 00:00:07.000
Entrevistador (HiperReforço): Boa tarde, Dra. Larissa! Obrigado por nos receber aqui na clínica via Google Meet.

00:00:07.100 --> 00:00:14.000
Dra. Larissa: Boa tarde! Trabalho aqui no consultório particular de psicologia e neuropsicopedagogia infantil em Campo Grande.

00:00:14.200 --> 00:00:22.000
Entrevistador: Quantos pacientes em média você acompanha e como funciona o intervalo entre as sessões?

00:00:22.200 --> 00:00:34.000
Dra. Larissa: Atendo 22 crianças na semana, a maior parte com TEA nível 1 e 2. Minha maior dor é o vão entre as sessões: atendo 50 minutos e a criança fica seis dias sem nada estruturado em casa.

00:00:34.200 --> 00:00:46.000
Entrevistador: E as famílias fazem as tarefas que você passa para casa?

00:00:46.200 --> 00:00:59.000
Dra. Larissa: Quase nunca! Mais de 60% voltam na semana seguinte dizendo que esqueceram ou não conseguiram. E quando a família não vê evolução rápida, desiste no terceiro mês alegando que 'a criança só ia brincar'.

00:00:59.200 --> 00:01:12.000
Entrevistador: Você já gastou do próprio bolso em materiais ou assinaturas?

00:01:12.200 --> 00:01:25.000
Dra. Larissa: Com certeza. Gastei duzentos e oitenta reais mês passado comprando baralhos de regulação e fichas adaptadas. Decido na hora e pago com meu cartão de crédito pessoal.

00:01:25.200 --> 00:01:38.000
Entrevistador: Você já usou o hiperfoco de alguma criança para engajar na atividade?

00:01:38.200 --> 00:01:52.000
Dra. Larissa: Sempre! Atendo um menino de 7 anos apaixonado por aviões. Estruturei todas as pistas de autorregulação como painéis de voo de avião e o engajamento dele disparou de imediato.`;

export const MeetTranscriptionModal: React.FC<MeetTranscriptionModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionLoaded,
}) => {
  const [transcriptText, setTranscriptText] = useState('');
  const [fileName, setFileName] = useState('');
  const [meetUrl, setMeetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTranscriptText(content);
    };
    reader.onerror = () => {
      setErrorMsg('Não foi possível ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('reuniao_google_meet_prof_silvana_aee.vtt');
    setTranscriptText(SAMPLE_MEET_TRANSCRIPT);
    setMeetUrl('https://meet.google.com/abc-defg-hij');
    setErrorMsg(null);
  };

  const handleLoadClinicaSample = () => {
    setFileName('reuniao_google_meet_dra_larissa_clinica.vtt');
    setTranscriptText(SAMPLE_CLINICA_TRANSCRIPT);
    setMeetUrl('https://meet.google.com/med-clin-psi');
    setErrorMsg(null);
  };

  const handleProcessTranscription = async () => {
    if (!transcriptText || transcriptText.trim().length === 0) {
      setErrorMsg('Por favor, carregue um arquivo .vtt/.txt ou cole a transcrição da reunião do Meet.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setProcessingStep('Enviando transcrição para a IA do HiperReforço...');

    try {
      setProcessingStep('Gemini 3.8 Flash analisando falas, pretérito e comportamentos...');

      const response = await fetch('/api/transcribe-meet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptText,
          fileName,
          sourceUrl: meetUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status} ao processar a transcrição.`);
      }

      const resData = await response.json();
      const aiResult = resData.data;

      setProcessingStep('Formatando checklist oficial e ficha de registro...');

      // Monta o registro de entrevista estruturado
      const newInterview: InterviewRecord = {
        id: `meet_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        date: new Date().toISOString().slice(0, 10),
        municipio: aiResult.municipio || 'Campo Grande - MS',
        escolaOrOrgao: aiResult.escolaOrOrgao || 'Escola Municipal Identificada',
        entrevistadoPerfil: aiResult.entrevistadoPerfil || 'Professor(a) de AEE',
        entrevistadoNome: aiResult.entrevistadoNome || (fileName ? `Transcrição ${fileName}` : 'Entrevistado Gravado no Meet'),
        tempoDeCasa: aiResult.tempoDeCasa || '',
        contato: aiResult.contato || '',
        roteiro: (aiResult.roteiro as RoteiroType) || 'A',
        canal: (aiResult.roteiro === 'G' ? 'saude' : 'educacao') as any,
        status: 'concluido',
        entrevistador: aiResult.entrevistador || 'Equipe HiperReforço',
        anotador: 'Transcrição Google Meet (IA)',
        duracaoMinutos: Number(aiResult.duracaoMinutos) || 25,
        checklistProgress: aiResult.checklistNotes
          ? Object.keys(aiResult.checklistNotes).reduce((acc, k) => {
              acc[k] = true;
              return acc;
            }, {} as Record<string, boolean>)
          : {},
        checklistNotes: aiResult.checklistNotes || {},
        hipotesesTestadas:
          (aiResult.hipotesesTestadas as HipoteseId[]) ||
          (aiResult.roteiro === 'G' ? ['HS1', 'HS2', 'HS3', 'HS4', 'HS5'] : ['H1', 'H2', 'H5']),
        frasesTextuais: Array.isArray(aiResult.frasesTextuais) ? aiResult.frasesTextuais.slice(0, 5) : [],
        oQueSurpreendeu: aiResult.oQueSurpreendeu || 'Transcrição analisada automaticamente pela IA.',
        tentouResolver: aiResult.tentouResolver || '',
        pagouDoProprioBolso: !!aiResult.pagouDoProprioBolso,
        valorPagoDoProprioBolso: aiResult.valorPagoDoProprioBolso || '',
        vereditosPorHipotese: aiResult.vereditosPorHipotese || {},
        vereditoGeral: (aiResult.vereditoGeral as VereditoType) || 'valida',
        vereditoMotivoGeral: aiResult.vereditoMotivoGeral || 'Entrevista auditada e validada a partir da gravação do Meet.',
        proximosPassos: aiResult.proximosPassos || 'Manter contato para validação de materiais.',
        tags: [
          'Google Meet',
          `Roteiro ${aiResult.roteiro || 'A'}`,
          aiResult.roteiro === 'G' ? 'Clínica / Saúde' : 'Educação',
          'Transcrição IA',
        ],
        isExterna: false,
      };

      setIsLoading(false);
      onTranscriptionLoaded(newInterview);
      onClose();
    } catch (err: any) {
      console.error('Falha no processamento:', err);
      setIsLoading(false);
      setErrorMsg(err.message || 'Falha ao processar a transcrição com a IA.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-indigo-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-md">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-950 border border-indigo-700/60 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase">
                  Google Meet Integration
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> IA Gemini 3.8 Flash
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Importar Transcrição de Reunião Gravada
              </h2>
              <p className="text-xs text-slate-400">
                A IA lê o arquivo de legenda/transcrição (.vtt, .txt, .sbv), identifica o roteiro, extrai as 5 frases literais e audita as hipóteses.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seleção de Arquivo e Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opção 1: Upload de Arquivo */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Upload de Arquivo de Legenda/Texto</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">.vtt / .txt / .sbv</span>
            </div>

            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-indigo-950/20 transition-all p-3 text-center">
              <FileCode className="h-6 w-6 text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200">
                {fileName ? fileName : 'Clique para selecionar arquivo do Meet'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Exportado do Google Drive ou Google Meet
              </span>
              <input
                type="file"
                accept=".vtt,.txt,.sbv,.srt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Opção 2: Link da Gravação do Meet / Google Docs */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-emerald-400" />
              <span>Link da Gravação / Google Meet</span>
            </span>

            <div>
              <label className="text-[11px] text-slate-400">URL da reunião ou documento (opcional)</label>
              <input
                type="text"
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                value={meetUrl}
                onChange={(e) => setMeetUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleLoadSample}
                className="w-full text-center py-2 px-2.5 rounded-lg border border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="Carregar exemplo de entrevista de Sala de Recursos AEE (Roteiro A)"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Exemplo AEE (Rot. A)</span>
              </button>

              <button
                type="button"
                onClick={handleLoadClinicaSample}
                className="w-full text-center py-2 px-2.5 rounded-lg border border-teal-700/60 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="Carregar exemplo de entrevista de Clínica / Psicologia (Roteiro G)"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Exemplo Clínica (Rot. G)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Caixa de Texto da Transcrição */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-amber-400" />
              <span>Conteúdo da Transcrição do Google Meet:</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {transcriptText.length} caracteres
            </span>
          </div>

          <textarea
            rows={6}
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            placeholder="Cole aqui o texto da transcrição ou faça upload do arquivo .vtt acima..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Alerta de Erro se houver */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Barra de Progresso durante Carregamento */}
        {isLoading && (
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 space-y-2">
            <div className="flex items-center gap-3 text-xs text-indigo-200 font-semibold">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>{processingStep}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full w-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleProcessTranscription}
            disabled={isLoading || !transcriptText.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Processar Transcrição com IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
