
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import { useProjetos } from "@/contexts/ProjetoContext";
import { useAtividades } from "@/contexts/AtividadeContext";
import { useAtuacoes } from "@/contexts/AtuacaoContext";
import { StatusAtividade, TipoAtuacao } from "@/types";
import { exportAtuacoesToExcel, exportAtuacoesToPdf } from "@/utils/exportAtuacoes";

const tipoLabel: Record<TipoAtuacao, string> = {
  reuniao: "Reunião",
  execucao: "Execução",
  planejamento: "Planejamento",
};

const statusLabel: Record<StatusAtividade, string> = {
  pendente: "Pendente",
  em_execucao: "Em execução",
  concluida: "Concluída",
};

export default function AtuacaoPage() {
  const { projetos } = useProjetos();
  const { atividades } = useAtividades();
  const { atuacoes, loading, deleteAtuacao } = useAtuacoes();

  const [filters, setFilters] = useState({
    empresa: "",
    projetoId: "",
    dataInicio: "",
    dataFim: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<null | "pdf" | "excel">(null);
  const [tooltipOpen, setTooltipOpen] = useState<null | "HD" | "HU">(null);

  const atividadesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) map.set(a.id, a.titulo);
    return map;
  }, [atividades]);

  const projetosById = useMemo(() => {
    const map = new Map<string, { titulo: string; empresa: string }>();
    for (const p of projetos) map.set(p.id, { titulo: p.titulo, empresa: p.empresa });
    return map;
  }, [projetos]);

  const empresas = useMemo(() => {
    const set = new Set<string>();
    for (const p of projetos) {
      if (p.empresa) set.add(p.empresa);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [projetos]);

  // HD por atuação: horas disponíveis para a atividade ANTES do registro
  const hdByAtuacaoId = useMemo(() => {
    const sorted = [...atuacoes].sort((a, b) => {
      const aKey = `${a.data}|${(a as any).horarioInicio ?? ""}|${a.createdAt}`;
      const bKey = `${b.data}|${(b as any).horarioInicio ?? ""}|${b.createdAt}`;
      return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    });

    const acumuladoPorAtividade = new Map<string, number>();
    const result = new Map<string, number>();

    for (const a of sorted) {
      const acumulado = acumuladoPorAtividade.get(a.atividadeId) ?? 0;
      const he = (a as any).horasEstimadasNoRegistro ?? 0;
      result.set(a.id, he - acumulado);
      acumuladoPorAtividade.set(a.atividadeId, acumulado + (a.horasUtilizadas ?? 0));
    }

    return result;
  }, [atuacoes]);

  const filteredAtuacoes = useMemo(() => {
    return atuacoes
      .filter((a) => {
        if (!filters.empresa) return true;
        const projeto = projetosById.get(a.projetoId);
        return projeto?.empresa === filters.empresa;
      })
      .filter((a) => (filters.projetoId ? a.projetoId === filters.projetoId : true))
      .filter((a) => (filters.dataInicio ? a.data >= filters.dataInicio : true))
      .filter((a) => (filters.dataFim ? a.data <= filters.dataFim : true))
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  }, [atuacoes, filters.dataFim, filters.dataInicio, filters.empresa, filters.projetoId, projetosById]);

  const formatDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAtuacao(id);
    } finally {
      setDeletingId(null);
    }
  };

  const exportData = useMemo(() => {
    const projetoTitleById = new Map<string, string>();
    for (const p of projetos) projetoTitleById.set(p.id, p.titulo);

    const atividadeTitleById = new Map<string, string>();
    for (const a of atividades) atividadeTitleById.set(a.id, a.titulo);

    return { projetoTitleById, atividadeTitleById };
  }, [atividades, projetos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Minha Atuação
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registre suas atividades realizadas e acompanhe sua atuação como PJ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loading || exporting !== null || filteredAtuacoes.length === 0}
            onClick={async () => {
              setExporting("pdf");
              try {
                await exportAtuacoesToPdf({
                  atuacoes: filteredAtuacoes,
                  ...exportData,
                  hdByAtuacaoId,
                  filename: "atuacoes.pdf",
                  titulo: "Relatório de Atuações",
                });
              } finally {
                setExporting(null);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {exporting === "pdf" ? "Exportando PDF..." : "Exportar PDF"}
          </button>
          <button
            type="button"
            disabled={loading || exporting !== null || filteredAtuacoes.length === 0}
            onClick={async () => {
              setExporting("excel");
              try {
                await exportAtuacoesToExcel({
                  atuacoes: filteredAtuacoes,
                  ...exportData,
                  hdByAtuacaoId,
                  filename: "atuacoes.xlsx",
                });
              } finally {
                setExporting(null);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {exporting === "excel" ? "Exportando Excel..." : "Exportar Excel"}
          </button>
          <Link
            href="/dashboard/atuacao/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Registrar Atuação
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa
            </label>
            <select
              value={filters.empresa}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, empresa: e.target.value, projetoId: "" }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todas</option>
              {empresas.map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Projeto
            </label>
            <select
              value={filters.projetoId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, projetoId: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              {projetos
                .filter((p) => (filters.empresa ? p.empresa === filters.empresa : true))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data início
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dataInicio: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data término
            </label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dataFim: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() =>
                setFilters({ empresa: "", projetoId: "", dataInicio: "", dataFim: "" })
              }
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando atuações...</p>
        </div>
      ) : filteredAtuacoes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="Nenhuma atuação registrada"
            description="Comece registrando suas primeiras atividades realizadas para acompanhar seu trabalho e comprovar sua atuação."
            action={{
              label: "Registrar Atuação",
              href: "/dashboard/atuacao/novo",
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="relative inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTooltipOpen((prev) => (prev === "HD" ? null : "HD"))
                        }
                        className="font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline decoration-dotted"
                        title="Clique para ver o que é HD"
                      >
                        HD
                      </button>
                      {tooltipOpen === "HD" && (
                        <div className="absolute z-10 top-full left-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg text-xs text-gray-700 dark:text-gray-200">
                          HD = Horas Disponíveis para a atividade antes do registro (HE - HU acumulado).
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setTooltipOpen(null)}
                              className="text-indigo-600 dark:text-indigo-400 font-medium"
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="relative inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTooltipOpen((prev) => (prev === "HU" ? null : "HU"))
                        }
                        className="font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline decoration-dotted"
                        title="Clique para ver o que é HU"
                      >
                        HU
                      </button>
                      {tooltipOpen === "HU" && (
                        <div className="absolute z-10 top-full left-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg text-xs text-gray-700 dark:text-gray-200">
                          HU = Horas Utilizadas registradas nesta atuação.
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setTooltipOpen(null)}
                              className="text-indigo-600 dark:text-indigo-400 font-medium"
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAtuacoes.map((a) => {
                  const tituloAtividade = atividadesById.get(a.atividadeId) ?? "Atividade removida";
                  const projeto = projetosById.get(a.projetoId);
                  const nomeProjeto = projeto?.titulo ?? "Projeto removido";
                  const nomeEmpresa = projeto?.empresa ?? "Empresa não informada";

                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(a.data)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {nomeEmpresa} • {nomeProjeto}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tituloAtividade}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {tipoLabel[a.tipo]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {statusLabel[(a as any).statusAtividadeNoRegistro ?? "pendente"]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {(hdByAtuacaoId.get(a.id) ?? 0).toFixed(2)}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {a.horasUtilizadas}h
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {a.descricao || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Excluir atuação"
                        >
                          {deletingId === a.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

