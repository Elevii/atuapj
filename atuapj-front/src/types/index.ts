export interface Projeto {
  id: string;
  empresa: string;
  titulo: string;
  valorHora: number;
  /**
   * Horas úteis por dia (1..24). Usado para estimativas de término.
   */
  horasUteisPorDia: number;
  createdAt: string;
  updatedAt: string;
}

export type StatusAtividade = "pendente" | "iniciada" | "concluida";

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
  valorHora: number;
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
  horasUtilizadas: number;
  tipo: TipoAtuacao;
  descricao?: string;
  impactoGerado?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtuacaoDTO {
  projetoId: string;
  atividadeId: string;
  data: string;
  horasUtilizadas: number;
  tipo: TipoAtuacao;
  descricao?: string;
  impactoGerado?: string;
}

