"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Atuacao, CreateAtuacaoDTO, StatusAtividade } from "@/types";
import { atuacaoService } from "@/services/atuacaoService";
import { useAtividades } from "@/contexts/AtividadeContext";

interface AtuacaoContextType {
  atuacoes: Atuacao[];
  loading: boolean;
  refreshAtuacoes: () => Promise<void>;
  createAtuacao: (data: CreateAtuacaoDTO) => Promise<Atuacao>;
  deleteAtuacao: (id: string) => Promise<void>;
  getAtuacoesByProjeto: (projetoId: string) => Atuacao[];
}

const AtuacaoContext = createContext<AtuacaoContextType | undefined>(undefined);

function calcularStatusAtividade(params: {
  totalHorasUtilizadas: number;
  horasEstimadas: number;
}): StatusAtividade {
  if (params.totalHorasUtilizadas <= 0) return "pendente";
  if (params.totalHorasUtilizadas < params.horasEstimadas) return "em_execucao";
  return "concluida";
}

export function AtuacaoProvider({ children }: { children: ReactNode }) {
  const [atuacoes, setAtuacoes] = useState<Atuacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { atividades, updateAtividade } = useAtividades();

  const refreshAtuacoes = useCallback(async () => {
    try {
      setLoading(true);
      const all = await atuacaoService.findAll();
      setAtuacoes(all);
    } catch (error) {
      console.error("Erro ao carregar atuações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAtuacoes();
  }, [refreshAtuacoes]);

  const totalHorasPorAtividade = useMemo(() => {
    const totals = new Map<string, number>();
    for (const atuacao of atuacoes) {
      totals.set(
        atuacao.atividadeId,
        (totals.get(atuacao.atividadeId) ?? 0) + (atuacao.horasUtilizadas ?? 0)
      );
    }
    return totals;
  }, [atuacoes]);

  const syncAtividadeHorasEStatus = useCallback(
    async (params: { atividadeId: string; atuacoesSnapshot: Atuacao[] }) => {
      const atividade = atividades.find((a) => a.id === params.atividadeId);
      if (!atividade) return;

      // Total de horas acumuladas com base no snapshot (evita estado stale do React)
      const totalHoras = params.atuacoesSnapshot
        .filter((a) => a.atividadeId === params.atividadeId)
        .reduce((sum, a) => sum + (a.horasUtilizadas ?? 0), 0);

      // Status atual da atividade passa a ser o status do último registro de atuação (se existir).
      const lastAtuacao = [...params.atuacoesSnapshot]
        .filter((a) => a.atividadeId === params.atividadeId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];

      const status =
        (lastAtuacao as any)?.statusAtividadeNoRegistro ??
        calcularStatusAtividade({
          totalHorasUtilizadas: totalHoras,
          horasEstimadas: atividade.horasAtuacao,
        });

      await updateAtividade(params.atividadeId, { horasUtilizadas: totalHoras, status });
    },
    [atividades, updateAtividade]
  );

  const createAtuacao = useCallback(
    async (data: CreateAtuacaoDTO): Promise<Atuacao> => {
      const nova = await atuacaoService.create(data);
      const all = await atuacaoService.findAll();
      setAtuacoes(all);

      // Após inserir, sincroniza horas/status da atividade
      await syncAtividadeHorasEStatus({
        atividadeId: data.atividadeId,
        atuacoesSnapshot: all,
      });
      return nova;
    },
    [syncAtividadeHorasEStatus]
  );

  const deleteAtuacao = useCallback(
    async (id: string) => {
      const atuacao = atuacoes.find((a) => a.id === id);
      await atuacaoService.delete(id);
      const all = await atuacaoService.findAll();
      setAtuacoes(all);

      if (atuacao) {
        await syncAtividadeHorasEStatus({
          atividadeId: atuacao.atividadeId,
          atuacoesSnapshot: all,
        });
      }
    },
    [atuacoes, syncAtividadeHorasEStatus]
  );

  const getAtuacoesByProjeto = useCallback(
    (projetoId: string) => atuacoes.filter((a) => a.projetoId === projetoId),
    [atuacoes]
  );

  return (
    <AtuacaoContext.Provider
      value={{
        atuacoes,
        loading,
        refreshAtuacoes,
        createAtuacao,
        deleteAtuacao,
        getAtuacoesByProjeto,
      }}
    >
      {children}
    </AtuacaoContext.Provider>
  );
}

export function useAtuacoes() {
  const ctx = useContext(AtuacaoContext);
  if (!ctx) {
    throw new Error("useAtuacoes deve ser usado dentro de AtuacaoProvider");
  }
  return ctx;
}


