export type RoteiroType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type HipoteseId =
  | 'H1'
  | 'H2'
  | 'H3'
  | 'H4'
  | 'H5'
  | 'H6'
  | 'HS1'
  | 'HS2'
  | 'HS3'
  | 'HS4'
  | 'HS5';

export type VereditoType = 'valida' | 'invalida' | 'inconclusivo' | 'pendente';

export type StatusCRM = 'planejamento' | 'agendado' | 'ao_vivo' | 'concluido' | 'descartado';

export type CanalAtuacao = 'educacao' | 'saude';

export interface QuestionItem {
  id: string;
  order: number;
  text: string;
  tip?: string;
  isArtifactCheck?: boolean; // Pede artefato real (ex: P4 do Bloco 1)
  isDecisiveCheck?: boolean; // Pergunta chave (ex: P3 do Bloco 2, P5 do Bloco 3, P3 do Roteiro B Bloco 3, HS3 em saúde)
}

export interface QuestionBlock {
  blockId: string;
  title: string;
  estimatedTime?: string;
  notes?: string;
  questions: QuestionItem[];
}

export interface RoteiroConfig {
  type: RoteiroType;
  title: string;
  canal: CanalAtuacao;
  targetAudience: string;
  durationTarget: string;
  goldenRuleNote: string;
  regulatoryNotice?: string; // Alerta CFP 31/2022 ou PNEEI
  blocks: QuestionBlock[];
}

export interface InterviewRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  municipio: string;
  escolaOrOrgao: string; // Escola, Sala de Recursos ou Clínica / Consultório (ou 'Família / Residência' para pais)
  entrevistadoPerfil: string; // Ex: Psicóloga Infantil, Prof. AEE, ou 'Mãe de criança com TEA (8 anos)'
  entrevistadoNome?: string; // Pseudônimo ou opcional
  tempoDeCasa?: string;
  contato?: string;
  roteiro: RoteiroType;
  canal?: CanalAtuacao;
  status: StatusCRM;
  
  // Identificação e Contexto Específicos por Perfil (Pais vs Docentes vs Gestão vs Clínicas)
  tipoPerfilIdentificacao?: 'familia' | 'docente' | 'gestao' | 'clinica';
  parentesco?: string; // Ex: Mãe, Pai, Responsável Legal, Cuidadora (para famílias)
  idadeFilhoOuAno?: string; // Ex: 8 anos (3º ano EF) (para famílias)
  diagnosticoOuPerfilFilho?: string; // Ex: TEA Nível 1, TDAH, em investigação, Típico / sem laudo (para famílias)
  tipoEscolaFilho?: string; // Ex: Escola pública municipal, particular, etc. (para famílias)
  funcaoOuCargo?: string; // Ex: Professora de AEE / Secretária Adjunta / Terapeuta Ocupacional
  tempoExperiencia?: string; // Ex: 8 anos de atuação / 5 anos na sala de recursos
  
  // Dupla de campo
  entrevistador: string;
  anotador: string;
  duracaoMinutos: number;
  
  // Respostas e anotações do checklist
  checklistProgress: Record<string, boolean>; // questionId -> checked
  checklistNotes: Record<string, string>; // questionId -> texto anotado
  
  // Ficha de Registro Oficial (Item 10 do Caderno)
  hipotesesTestadas: HipoteseId[];
  frasesTextuais: string[]; // Exatamente até 5 frases literais, sem interpretação
  oQueSurpreendeu: string;
  tentouResolver: string; // Já tentou resolver? O quê?
  pagouDoProprioBolso: boolean;
  valorPagoDoProprioBolso?: string; // R$
  
  // Vereditos
  vereditosPorHipotese: Partial<Record<HipoteseId, {
    veredito: VereditoType;
    justificativa: string;
  }>>;
  vereditoGeral: VereditoType;
  vereditoMotivoGeral: string;
  
  proximosPassos: string;
  tags?: string[];
  isExterna?: boolean; // Submetida via formulário público
  isDemo?: boolean; // Dado de demonstração
  token?: string; // Token de convite exclusivo associado
}

export interface ProhibitedQuestion {
  naoPergunte: string;
  porQueFalha: string;
  pergunteIsto: string;
  contexto: string;
  canal?: CanalAtuacao;
}

export interface HipoteseDefinition {
  id: HipoteseId;
  titulo: string;
  declaracao: string;
  causaEfeito: string;
  criterioValida: string;
  criterioInvalida: string;
  canal: CanalAtuacao;
  isPrioritaria?: boolean;
  isAnexoNaoExecutado?: boolean;
  isComercialKey?: boolean; // Ex: HS3 (a hipótese de retenção de clínicas)
}

export interface TargetProgress {
  publico: string;
  metaMinima: number;
  criterioParada: string;
  roteiroAssociado: RoteiroType;
  canal: CanalAtuacao;
}
