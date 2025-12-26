"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Atividade, CreateAtividadeDTO } from "@/types";
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
  const [loading, setLoading] = useState(false);
  const { getProjetoById } = useProjetos();

  const loadAtividadesByProjeto = async (projetoId: string) => {
    try {
      setLoading(true);
      const data = await atividadeService.findByProjetoId(projetoId);
      setAtividades(data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAtividade = async (
    data: CreateAtividadeDTO,
    projetoId: string
  ): Promise<Atividade> => {
    const projeto = getProjetoById(projetoId);
    if (!projeto) {
      throw new Error("Projeto não encontrado");
    }

    const novaAtividade = await atividadeService.create(data, projeto.valorHora);
    setAtividades((prev) => [...prev, novaAtividade]);
    return novaAtividade;
  };

  const updateAtividade = async (
    id: string,
    data: Partial<CreateAtividadeDTO>
  ): Promise<Atividade> => {
    const atividadeAtual = atividades.find((a) => a.id === id);
    if (!atividadeAtual) {
      throw new Error("Atividade não encontrada");
    }

    const projeto = getProjetoById(atividadeAtual.projetoId);
    const atividadeAtualizada = await atividadeService.update(
      id,
      data,
      projeto?.valorHora
    );
    setAtividades((prev) =>
      prev.map((a) => (a.id === id ? atividadeAtualizada : a))
    );
    return atividadeAtualizada;
  };

  const deleteAtividade = async (id: string): Promise<void> => {
    await atividadeService.delete(id);
    setAtividades((prev) => prev.filter((a) => a.id !== id));
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

