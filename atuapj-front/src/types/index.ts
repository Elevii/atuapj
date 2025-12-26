export interface Projeto {
  id: string;
  empresa: string;
  titulo: string;
  tipoCobranca?: TipoCobranca;
  valorFixo?: number;
  valorHora?: number;
  /**
   * Horas úteis por dia (1..24). Usado para estimativas de término.
   */
  horasUteisPorDia: number;
  createdAt: string;
  updatedAt: string;
}

export type TipoCobranca = "horas" | "fixo";

export type StatusAtividade = "pendente" | "em_execucao" | "concluida";

export type TipoAtuacao = "reuniao" | "execucao" | "planejamento";

export interface Atividade {
  id: string;
  projetoId: string;
  titulo: string;
  dataInicio: string;
  horasAtuacao: number;
  horasUtilizadas: number;
  dataFimEstimada: string;
  custoTarefa: number;
  status: StatusAtividade;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjetoDTO {
  empresa: string;
  titulo: string;
  tipoCobranca: TipoCobranca;
  valorFixo?: number;
  valorHora?: number;
  horasUteisPorDia: number;
}

export interface CreateAtividadeDTO {
  projetoId: string;
  titulo: string;
  dataInicio: string;
  horasAtuacao: number;
  status?: StatusAtividade;
  horasUtilizadas?: number;
  /**
   * Custo da tarefa (BRL). Se não informado, será calculado automaticamente:
   * horasAtuacao * valorHora
   */
  custoTarefa?: number;
}

export interface Atuacao {
  id: string;
  projetoId: string;
  atividadeId: string;
  /**
   * Data da atuação no formato ISO date (YYYY-MM-DD)
   */
  data: string;
  /**
   * Horário de início (HH:mm). Opcional, usado em relatórios.
   */
  horarioInicio?: string;
  /**
   * Horas estimadas (HE) da atividade no momento do registro.
   */
  horasEstimadasNoRegistro: number;
  horasUtilizadas: number;
  tipo: TipoAtuacao;
  /**
   * Status da atividade no momento do registro.
   */
  statusAtividadeNoRegistro: StatusAtividade;
  descricao?: string;
  impactoGerado?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtuacaoDTO {
  projetoId: string;
  atividadeId: string;
  data: string;
  horarioInicio?: string;
  horasEstimadasNoRegistro: number;
  horasUtilizadas: number;
  tipo: TipoAtuacao;
  statusAtividadeNoRegistro: StatusAtividade;
  descricao?: string;
  impactoGerado?: string;
}

export type OrcamentoCampoAtividade =
  | "titulo"
  | "status"
  | "dataInicio"
  | "dataFimEstimada"
  | "horasAtuacao"
  | "custoTarefa"
  | "custoCalculado"
  | "horasUtilizadas";

export interface OrcamentoCheckpoint {
  id: string;
  titulo: string;
  dataAlvo?: string; // ISO date
  descricao?: string;
  ordem: number;
}

export interface OrcamentoEntregavel {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  checkpoints: OrcamentoCheckpoint[];
}

export interface OrcamentoItem {
  atividadeId: string;
  ordem?: number;
  entregavelId?: string;
  inicioOverride?: string; // ISO date
  fimOverride?: string; // ISO date
}

export interface Orcamento {
  id: string;
  projetoId: string;
  titulo: string;
  /**
   * Data de início do cronograma do orçamento (ISO date).
   */
  dataInicioProjeto: string;
  camposSelecionados: OrcamentoCampoAtividade[];
  itens: OrcamentoItem[];
  observacoes?: string;
  usarEntregaveis: boolean;
  mostrarSubtotaisPorEntregavel: boolean;
  entregaveis?: OrcamentoEntregavel[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrcamentoDTO {
  projetoId: string;
  titulo: string;
  dataInicioProjeto: string;
  camposSelecionados: OrcamentoCampoAtividade[];
  itens: OrcamentoItem[];
  observacoes?: string;
  usarEntregaveis: boolean;
  mostrarSubtotaisPorEntregavel: boolean;
  entregaveis?: OrcamentoEntregavel[];
}

