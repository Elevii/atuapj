export interface Projeto {
  id: string;
  empresa: string;
  titulo: string;
  valorHora: number;
  createdAt: string;
  updatedAt: string;
}

export type StatusAtividade = "pendente" | "iniciada" | "concluida";

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

