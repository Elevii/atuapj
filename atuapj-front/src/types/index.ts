export interface Projeto {
  id: string;
  empresa: string;
  titulo: string;
  valorHora: number;
  createdAt: string;
  updatedAt: string;
}

export interface Atividade {
  id: string;
  projetoId: string;
  titulo: string;
  dataInicio: string;
  horasAtuacao: number;
  dataFimEstimada: string;
  lucroEstimado: number;
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
}

