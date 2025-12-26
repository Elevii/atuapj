import { Atividade, CreateAtividadeDTO, StatusAtividade } from "@/types";

// Simulação de API - em produção será substituído por chamadas HTTP reais
class AtividadeService {
  private storageKey = "atuapj_atividades";

  private getAtividadesFromStorage(): Atividade[] {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveAtividadesToStorage(atividades: Atividade[]): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(atividades));
    } catch (error) {
      console.error("Erro ao salvar atividades:", error);
    }
  }

  private calcularDataFim(dataInicio: string, horas: number): string {
    const horasPorDia = 8;
    const diasNecessarios = Math.ceil(horas / horasPorDia);
    
    const dataInicioObj = new Date(dataInicio);
    dataInicioObj.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataInicioObj);
    
    // Se o dia inicial for útil, já conta como um dia
    let diasAdicionados = 0;
    if (dataFim.getDay() !== 0 && dataFim.getDay() !== 6) {
      diasAdicionados = 1;
    }
    
    // Adiciona dias até completar a quantidade necessária
    while (diasAdicionados < diasNecessarios) {
      dataFim.setDate(dataFim.getDate() + 1);
      const diaDaSemana = dataFim.getDay();
      if (diaDaSemana !== 0 && diaDaSemana !== 6) {
        diasAdicionados++;
      }
    }
    
    return dataFim.toISOString().split("T")[0];
  }

  async findAll(): Promise<Atividade[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.getAtividadesFromStorage();
  }

  async findByProjetoId(projetoId: string): Promise<Atividade[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const atividades = this.getAtividadesFromStorage();
    return atividades.filter((a) => a.projetoId === projetoId);
  }

  async findById(id: string): Promise<Atividade | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const atividades = this.getAtividadesFromStorage();
    return atividades.find((a) => a.id === id) || null;
  }

  async create(data: CreateAtividadeDTO, valorHora: number): Promise<Atividade> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const dataFimEstimada = this.calcularDataFim(data.dataInicio, data.horasAtuacao);
    const lucroEstimado = data.horasAtuacao * valorHora;
    
    const atividades = this.getAtividadesFromStorage();
    const novaAtividade: Atividade = {
      id: `ativ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      horasUtilizadas: data.horasUtilizadas || 0,
      status: data.status || "pendente",
      dataFimEstimada,
      lucroEstimado,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    atividades.push(novaAtividade);
    this.saveAtividadesToStorage(atividades);
    
    return novaAtividade;
  }

  async update(
    id: string,
    data: Partial<CreateAtividadeDTO> & { status?: StatusAtividade; horasUtilizadas?: number },
    valorHora?: number
  ): Promise<Atividade> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    
    const atividades = this.getAtividadesFromStorage();
    const index = atividades.findIndex((a) => a.id === id);
    
    if (index === -1) {
      throw new Error("Atividade não encontrada");
    }
    
    const atividadeAtual = atividades[index];
    const dataAtualizada = { ...atividadeAtual, ...data };
    
    // Recalcular se necessário
    if (data.dataInicio || data.horasAtuacao) {
      const dataInicio = data.dataInicio || atividadeAtual.dataInicio;
      const horas = data.horasAtuacao || atividadeAtual.horasAtuacao;
      dataAtualizada.dataFimEstimada = this.calcularDataFim(dataInicio, horas);
    }
    
    if (data.horasAtuacao && valorHora) {
      dataAtualizada.lucroEstimado = data.horasAtuacao * valorHora;
    } else if (data.horasAtuacao) {
      dataAtualizada.lucroEstimado =
        data.horasAtuacao * (atividadeAtual.lucroEstimado / atividadeAtual.horasAtuacao);
    }
    
    // Recalcular lucro baseado em horas utilizadas se fornecido (prioridade para horas utilizadas)
    if (data.horasUtilizadas !== undefined && valorHora !== undefined) {
      dataAtualizada.lucroEstimado = data.horasUtilizadas * valorHora;
    } else if (data.horasUtilizadas !== undefined && atividadeAtual) {
      // Se não tem valorHora, recalcula proporcionalmente
      const valorHoraAtual =
        atividadeAtual.lucroEstimado / atividadeAtual.horasAtuacao;
      dataAtualizada.lucroEstimado = data.horasUtilizadas * valorHoraAtual;
    }
    
    atividades[index] = {
      ...dataAtualizada,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveAtividadesToStorage(atividades);
    return atividades[index];
  }

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const atividades = this.getAtividadesFromStorage();
    const filtered = atividades.filter((a) => a.id !== id);
    this.saveAtividadesToStorage(filtered);
  }
}

// Exporta instância única (Singleton)
export const atividadeService = new AtividadeService();

