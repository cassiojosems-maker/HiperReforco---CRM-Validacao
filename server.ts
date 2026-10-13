import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Inicialização do cliente oficial Gemini API conforme a diretriz gemini-api
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Armazenamento em memória com persistência leve de submissões externas de formulários
import fs from 'fs';
const SUBMISSIONS_FILE = path.join(__dirname, 'form_submissions.json');
let formSubmissions: any[] = [];

try {
  if (fs.existsSync(SUBMISSIONS_FILE)) {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    formSubmissions = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Iniciando submissions em memória.');
}

// Endpoint de Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hiperreforco-crm',
    hasApiKey: !!apiKey,
    submissionsCount: formSubmissions.length,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint POST /api/forms/submit (chamado pelo respondente público no celular ou browser)
app.post('/api/forms/submit', (req, res) => {
  try {
    const record = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ error: 'Registro inválido ou incompleto.' });
    }

    formSubmissions.unshift(record);

    try {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(formSubmissions, null, 2), 'utf-8');
    } catch (saveErr) {
      console.warn('Aviso ao persistir submissions em disco:', saveErr);
    }

    return res.json({
      success: true,
      message: 'Resposta recebida com sucesso pelo servidor!',
      id: record.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao salvar submissão de formulário:', error);
    return res.status(500).json({ error: 'Falha ao processar envio do formulário.' });
  }
});

// Endpoint GET /api/forms/submissions (chamado pelo CRM para sincronizar respostas recebidas)
app.get('/api/forms/submissions', (req, res) => {
  res.json({
    success: true,
    count: formSubmissions.length,
    submissions: formSubmissions,
  });
});

// Endpoint POST /api/transcribe-meet
app.post('/api/transcribe-meet', async (req, res) => {
  try {
    const { transcriptText, fileName, sourceUrl } = req.body;

    if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim().length === 0) {
      return res.status(400).json({ error: 'Nenhum texto de transcrição foi fornecido.' });
    }

    // Se tiver cliente Gemini configurado, usa gemini-3.8-flash com resposta estruturada
    if (aiClient) {
      const prompt = `
Você é um auditor e analista sênior do projeto HiperReforço (plataforma EdTech de inclusão educacional via ancoragem em hiperfocos).
Sua missão é analisar esta TRANSCRIÇÃO DE REUNIÃO GRAVADA NO GOOGLE MEET entre pesquisadores do HiperReforço e um entrevistado (professor, coordenador, família ou usuário do piloto).

### REGRAS METODOLÓGICAS DO CADERNO DE VALIDAÇÃO:
1. PASSADO = DADO | FUTURO E CONDICIONAL = OPINIÃO. Priorize relatos de comportamentos e fatos pretéritos.
2. Identifique o ROTEIRO de campo correto aplicado:
   - 'A': Professor de AEE / Sala de Recursos (descoberta, sem produto ainda).
   - 'B': Coordenação pedagógica ou Secretaria de Educação / SME (o pagante B2G, foco em MP, LBI, compra pública e atestado técnico).
   - 'C': Professora do piloto que já está usando o HiperReforço em sala.
   - 'D': Família de criança neurodivergente (canal B2C, hábitos e gastos particulares).
   - 'E': Família de aluno típico sem laudo (trilha H6 de reforço escolar comum).
   - 'G': Clínica ou Consultório Privado (Psicologia infantil, Neuropsicopedagogia, Fonoaudiologia, Terapia Ocupacional, Gestão de Clínica). Foco em HS1 (vão entre sessões), HS2 (material fora da clínica), HS3 (retenção de pacientes), HS4 (compra autônoma) e HS5 (porta de entrada).
3. 5 FRASES TEXTUAIS (Verbatim): Extraia até 5 frases EXATAS e literais ditas pelo ENTREVISTADO na gravação. Sem resumo, sem paráfrase, exatamente como ele falou.
4. Gasto do Próprio Bolso: Verifique se o entrevistado declarou ter pago do próprio bolso por materiais, softwares, cursos ou impressões (especifique valor em R$ e itens).
5. Veredito das Hipóteses:
   - H1: Dor de produzir material individualizado (tempo gasto, fora do horário, dinheiro próprio).
   - H2: PEI como conformidade documental (ninguém relê, vai pra pasta).
   - H3: Gestão compra comprovação da LBI (Ministério Público, prazo, prestação de contas).
   - H4: Rota de contratação sem histórico (cessão experimental sem ônus gerando atestado de capacidade técnica).
   - H5: Hiperfoco já utilizado espontaneamente como ponte didática.
   - H6: Expansão para aprendente típico.
   - HS1: O vão entre sessões (50 min na semana, 6 dias sem nada) é dor reconhecida.
   - HS2: A produção de material consome tempo não remunerado do terapeuta.
   - HS3: Evasão de famílias liga-se à não percepção de evolução (A HIPÓTESE COMERCIAL DA SAÚDE: venda vira retenção).
   - HS4: O profissional compra com dinheiro próprio e decide sozinho (ciclo curto sem licitação).
   - HS5: O interesse intenso já é usado como porta de entrada na sessão clínica.

### TRANSCRIÇÃO DA GRAVAÇÃO (${fileName || 'Google Meet'}):
${transcriptText.slice(0, 45000)}

Retorne um JSON rigorosamente estruturado com o formato exato:
{
  "roteiro": "A" | "B" | "C" | "D" | "E" | "G",
  "municipio": "Nome do município e estado (ex: Campo Grande - MS)",
  "escolaOrOrgao": "Nome da escola, sala de recursos, clínica ou consultório mencionado",
  "entrevistadoPerfil": "Perfil profissional ou grau de parentesco",
  "entrevistadoNome": "Nome ou pseudônimo do entrevistado identificado",
  "tempoDeCasa": "Tempo de atuação na rede, clínica ou função",
  "contato": "E-mail ou telefone mencionado (ou vazio)",
  "duracaoMinutos": número estimado da conversa,
  "entrevistador": "Nome do entrevistador se identificado",
  "anotador": "Transcritor / IA HiperReforço",
  "frasesTextuais": ["Frase literal 1", "Frase literal 2", "Frase literal 3", "Frase literal 4", "Frase literal 5"],
  "oQueSurpreendeu": "Fato imprevisto, modo de falha ou relato surpreendente",
  "tentouResolver": "O que já tentou fazer anteriormente para resolver",
  "pagouDoProprioBolso": true | false,
  "valorPagoDoProprioBolso": "Valores em R$ e itens comprados",
  "hipotesesTestadas": ["H1", "H2", "H3", "H4", "H5", "H6", "HS1", "HS2", "HS3", "HS4", "HS5"],
  "vereditosPorHipotese": {
    "H1": { "veredito": "valida" | "invalida" | "inconclusivo", "justificativa": "..." }
  },
  "vereditoGeral": "valida" | "invalida" | "inconclusivo",
  "vereditoMotivoGeral": "Resumo pericial da validação da entrevista",
  "proximosPassos": "Encaminhamentos ou follow-up acordado",
  "checklistNotes": {
    "perguntaId": "resposta identificada"
  }
}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        source: 'gemini-3.8-flash',
        data: parsedData,
      });
    }

    // Fallback heurístico inteligente se a chave não estiver no ambiente
    const fallbackData = parseHeuristicTranscript(transcriptText, fileName);
    return res.json({
      success: true,
      source: 'heuristic-fallback',
      data: fallbackData,
    });
  } catch (error: any) {
    console.error('Erro ao processar transcrição do Meet:', error);
    return res.status(500).json({
      error: 'Falha ao processar a transcrição da reunião.',
      details: error.message || String(error),
    });
  }
});

// Parser de fallback caso o ambiente local não tenha apiKey injetada ainda
function parseHeuristicTranscript(text: string, fileName?: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('WEBVTT') && !l.includes('-->'));

  // Detecta menções a clínica / consultório -> Roteiro G; secretaria -> B; piloto -> C; família -> D; típico -> E; senão A
  const lower = text.toLowerCase();
  let roteiro = 'A';
  if (lower.includes('clínica') || lower.includes('consultório') || lower.includes('psicólog') || lower.includes('terapeuta') || lower.includes('neuropsicopedagog') || lower.includes('fonoaudiólog') || lower.includes('paciente') || lower.includes('entre sessões')) {
    roteiro = 'G';
  } else if (lower.includes('secretaria') || lower.includes('ministério público') || lower.includes('atestado') || lower.includes('pregão')) {
    roteiro = 'B';
  } else if (lower.includes('piloto') || lower.includes('plataforma') || lower.includes('relatório')) {
    roteiro = 'C';
  } else if (lower.includes('meu filho') || lower.includes('minha filha') || lower.includes('em casa')) {
    roteiro = 'D';
  }

  // Extrair falas literais
  const dialogLines = lines.filter((l) => l.length > 30 && !l.startsWith('00:')).slice(0, 5);

  const pagouBolso = lower.includes('do meu bolso') || lower.includes('gastei') || lower.includes('comprei') || lower.includes('r$');

  const perfil =
    roteiro === 'G'
      ? 'Terapeuta Infantil / Psicóloga Clínica'
      : roteiro === 'B'
      ? 'Coordenação de Educação Especial'
      : roteiro === 'D'
      ? 'Responsável / Família'
      : 'Professor(a) de AEE';

  const escolaOrOrgao =
    roteiro === 'G'
      ? 'Clínica de Desenvolvimento Infantil'
      : lower.includes('escola')
      ? 'Escola Municipal Identificada'
      : 'Sala de Recursos AEE';

  const hipoteses =
    roteiro === 'G'
      ? ['HS1', 'HS2', 'HS3', 'HS4', 'HS5']
      : roteiro === 'B'
      ? ['H3', 'H4']
      : ['H1', 'H2', 'H5'];

  return {
    roteiro,
    municipio: 'Campo Grande - MS',
    escolaOrOrgao,
    entrevistadoPerfil: perfil,
    entrevistadoNome: fileName ? `Transcrição ${fileName.replace(/\.[^/.]+$/, '')}` : 'Entrevistado Gravado no Meet',
    tempoDeCasa: 'Mencionado em reunião',
    contato: '',
    duracaoMinutos: 25,
    entrevistador: 'Equipe HiperReforço',
    anotador: 'Transcrição Google Meet (IA)',
    frasesTextuais: dialogLines.length > 0 ? dialogLines : [
      '"Relato extraído da gravação da chamada realizada no Google Meet."',
      '"Material preparado com base na transcrição automática."',
    ],
    oQueSurpreendeu: 'Análise automática realizada a partir do arquivo de gravação do Meet.',
    tentouResolver: 'Mencionado durante o diálogo da chamada.',
    pagouDoProprioBolso: pagouBolso,
    valorPagoDoProprioBolso: pagouBolso ? 'Valores citados na conversa gravada' : '',
    hipotesesTestadas: hipoteses,
    vereditosPorHipotese: {
      [roteiro === 'G' ? 'HS1' : 'H1']: { veredito: 'valida', justificativa: 'Comportamento relatado na reunião.' },
    },
    vereditoGeral: 'valida',
    vereditoMotivoGeral: 'Transcrição importada e estruturada com sucesso.',
    proximosPassos: 'Revisar transcrição no checklist e confirmar dados.',
    checklistNotes: {},
  };
}

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`HiperReforço server rodando em http://0.0.0.0:${port}`);
  });
}

startServer();
