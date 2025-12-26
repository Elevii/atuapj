"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Atividade, CreateAtividadeDTO, StatusAtividade } from "@/types";
import { atividadeService } from "@/services/atividadeService";
import { useProjetos } from "./ProjetoContext";

interface AtividadeContextType {
  atividades: Atividade[];
  loading: boolean;
  loadAtividadesByProjeto: (projetoId: string) => Promise<void>;
  createAtividade: (data: CreateAtividadeDTO, projetoId: string) => Promise<Atividade>;
  updateAtividade: (
    id: string,
    data: Partial<CreateAtividadeDTO>
  ) => Promise<Atividade>;
  deleteAtividade: (id: string) => Promise<void>;
  getAtividadeById: (id: string) => Atividade | undefined;
  getAtividadesByProjeto: (projetoId: string) => Atividade[];
}

const AtividadeContext = createContext<AtividadeContextType | undefined>(
  undefined
);

export function AtividadeProvider({ children }: { children: ReactNode }) {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const { getProjetoById } = useProjetos();

  // Carrega todas as atividades do storage uma vez ao montar
  useEffect(() => {
    const loadAllAtividades = async () => {
      try {
        setLoading(true);
        const allAtividades = await atividadeService.findAll();
        setAtividades(allAtividades);
      } catch (error) {
        console.error("Erro ao carregar todas as atividades:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllAtividades();
  }, []);

  // Função vazia para manter compatibilidade (não precisa carregar por projeto se já tem tudo)
  const loadAtividadesByProjeto = useCallback(async (projetoId: string) => {
    // Não precisa fazer nada, já carregou todas as atividades
    // Esta função existe apenas para manter a interface compatível
  }, []);

  const createAtividade = async (
    data: CreateAtividadeDTO,
    projetoId: string
  ): Promise<Atividade> => {
    const projeto = getProjetoById(projetoId);
    if (!projeto) {
      throw new Error("Projeto não encontrado");
    }

    const novaAtividade = await atividadeService.create(
      data,
      projeto.valorHora,
      projeto.horasUteisPorDia
    );
    // Recarrega todas as atividades para garantir sincronização
    const allAtividades = await atividadeService.findAll();
    setAtividades(allAtividades);
    return novaAtividade;
  };

  const updateAtividade = async (
    id: string,
    data: Partial<CreateAtividadeDTO> & {
      status?: StatusAtividade;
      horasUtilizadas?: number;
    }
  ): Promise<Atividade> => {
    const atividadeAtual = atividades.find((a) => a.id === id);
    if (!atividadeAtual) {
      throw new Error("Atividade não encontrada");
    }

    const projeto = getProjetoById(atividadeAtual.projetoId);
    const atividadeAtualizada = await atividadeService.update(
      id,
      data,
      projeto?.valorHora,
      projeto?.horasUteisPorDia
    );
    // Recarrega todas as atividades para garantir sincronização
    const allAtividades = await atividadeService.findAll();
    setAtividades(allAtividades);
    return atividadeAtualizada;
  };

  const deleteAtividade = async (id: string): Promise<void> => {
    await atividadeService.delete(id);
    // Recarrega todas as atividades para garantir sincronização
    const allAtividades = await atividadeService.findAll();
    setAtividades(allAtividades);
  };

  const getAtividadeById = (id: string): Atividade | undefined => {
    return atividades.find((a) => a.id === id);
  };

  const getAtividadesByProjeto = (projetoId: string): Atividade[] => {
    return atividades.filter((a) => a.projetoId === projetoId);
  };

  return (
    <AtividadeContext.Provider
      value={{
        atividades,
        loading,
        loadAtividadesByProjeto,
        createAtividade,
        updateAtividade,
        deleteAtividade,
        getAtividadeById,
        getAtividadesByProjeto,
      }}
    >
      {children}
    </AtividadeContext.Provider>
  );
}

export function useAtividades() {
  const context = useContext(AtividadeContext);
  if (context === undefined) {
    throw new Error(
      "useAtividades deve ser usado dentro de AtividadeProvider e ProjetoProvider"
    );
  }
  return context;
}

