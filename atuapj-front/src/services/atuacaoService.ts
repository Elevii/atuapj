import { Atuacao, CreateAtuacaoDTO } from "@/types";

// Simulação de API - em produção será substituído por chamadas HTTP reais
class AtuacaoService {
  private storageKey = "atuapj_atuacoes";

  private getAtuacoesFromStorage(): Atuacao[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      const parsed = stored ? (JSON.parse(stored) as any[]) : [];
      return Array.isArray(parsed) ? (parsed as Atuacao[]) : [];
    } catch {
      return [];
    }
  }

  private saveAtuacoesToStorage(atuacoes: Atuacao[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(atuacoes));
    } catch (error) {
      console.error("Erro ao salvar atuações:", error);
    }
  }

  async findAll(): Promise<Atuacao[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.getAtuacoesFromStorage();
  }

  async findByProjetoId(projetoId: string): Promise<Atuacao[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.getAtuacoesFromStorage().filter((a) => a.projetoId === projetoId);
  }

  async create(data: CreateAtuacaoDTO): Promise<Atuacao> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const atuacoes = this.getAtuacoesFromStorage();
    const now = new Date().toISOString();

    const novaAtuacao: Atuacao = {
      id: `atu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    atuacoes.push(novaAtuacao);
    this.saveAtuacoesToStorage(atuacoes);
    return novaAtuacao;
  }

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const atuacoes = this.getAtuacoesFromStorage();
    this.saveAtuacoesToStorage(atuacoes.filter((a) => a.id !== id));
  }
}

export const atuacaoService = new AtuacaoService();


