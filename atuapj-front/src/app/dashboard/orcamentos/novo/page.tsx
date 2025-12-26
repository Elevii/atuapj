"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjetos } from "@/contexts/ProjetoContext";
import { useAtividades } from "@/contexts/AtividadeContext";
import { useOrcamentos } from "@/contexts/OrcamentoContext";
import {
  OrcamentoCampoAtividade,
  OrcamentoEntregavel,
  OrcamentoItem,
} from "@/types";
import { formatTodayISODateLocal, gerarCronogramaSequencial } from "@/utils/estimativas";

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const { projetos } = useProjetos();
  const { atividades } = useAtividades();
  const { createOrcamento } = useOrcamentos();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const camposDisponiveis: { key: OrcamentoCampoAtividade; label: string }[] = [
    { key: "titulo", label: "Título" },
    { key: "status", label: "Status" },
    { key: "dataInicio", label: "Data início" },
    { key: "dataFimEstimada", label: "Término estimado" },
    { key: "horasAtuacao", label: "Horas estimadas" },
    { key: "custoTarefa", label: "Custo da tarefa" },
    { key: "custoCalculado", label: "Custo calculado (horas × valor/hora)" },
    { key: "horasUtilizadas", label: "Horas utilizadas" },
  ];

  const [form, setForm] = useState({
    projetoId: "",
    titulo: "Orçamento",
    dataInicioProjeto: formatTodayISODateLocal(),
    camposSelecionados: [
      "titulo",
      "dataInicio",
      "horasAtuacao",
      "custoTarefa",
    ] as OrcamentoCampoAtividade[],
    atividadeIds: [] as string[],
    usarEntregaveis: false,
    mostrarSubtotaisPorEntregavel: false,
  });

  const projeto = useMemo(
    () => projetos.find((p) => p.id === form.projetoId),
    [form.projetoId, projetos]
  );

  const atividadesDoProjeto = useMemo(() => {
    if (!form.projetoId) return [];
    return atividades.filter((a) => a.projetoId === form.projetoId);
  }, [atividades, form.projetoId]);

  const [itemMeta, setItemMeta] = useState<
    Record<string, { entregavelId?: string; inicioOverride?: string; fimOverride?: string }>
  >({});

  const itens: OrcamentoItem[] = useMemo(() => {
    return form.atividadeIds.map((atividadeId, idx) => ({
      atividadeId,
      ordem: idx,
      entregavelId: itemMeta[atividadeId]?.entregavelId,
      inicioOverride: itemMeta[atividadeId]?.inicioOverride,
      fimOverride: itemMeta[atividadeId]?.fimOverride,
    }));
  }, [form.atividadeIds, itemMeta]);

  const cronogramaPreview = useMemo(() => {
    if (!projeto) return [];
    if (itens.length === 0) return [];

    return gerarCronogramaSequencial({
      dataInicioProjetoISO: form.dataInicioProjeto,
      horasUteisPorDia: projeto.horasUteisPorDia,
      itens: itens.map((it) => {
        const a = atividadesDoProjeto.find((x) => x.id === it.atividadeId);
        return {
          atividadeId: it.atividadeId,
          horasEstimadas: a?.horasAtuacao ?? 0,
          inicioOverride: it.inicioOverride,
          fimOverride: it.fimOverride,
        };
      }),
    });
  }, [atividadesDoProjeto, form.dataInicioProjeto, itens, projeto]);

  const [entregaveis, setEntregaveis] = useState<OrcamentoEntregavel[]>([]);

  const addEntregavel = () => {
    const ordem = entregaveis.length;
    setEntregaveis((prev) => [
      ...prev,
      { id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, titulo: `Entregável ${ordem + 1}`, ordem, checkpoints: [] },
    ]);
  };

  const addCheckpoint = (entregavelId: string) => {
    setEntregaveis((prev) =>
      prev.map((e) => {
        if (e.id !== entregavelId) return e;
        const ordem = e.checkpoints.length;
        return {
          ...e,
          checkpoints: [
            ...e.checkpoints,
            {
              id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              titulo: `Checkpoint ${ordem + 1}`,
              ordem,
            },
          ],
        };
      })
    );
  };

  const toggleAtividade = (atividadeId: string) => {
    setForm((prev) => {
      const exists = prev.atividadeIds.includes(atividadeId);
      return {
        ...prev,
        atividadeIds: exists
          ? prev.atividadeIds.filter((id) => id !== atividadeId)
          : [...prev.atividadeIds, atividadeId],
      };
    });
  };

  const handleSave = async () => {
    setErrors({});
    const nextErrors: Record<string, string> = {};
    if (!form.projetoId) nextErrors.projetoId = "Projeto é obrigatório";
    if (!form.titulo.trim()) nextErrors.titulo = "Título é obrigatório";
    if (form.atividadeIds.length === 0) nextErrors.atividadeIds = "Selecione ao menos uma atividade";
    if (form.camposSelecionados.length === 0) nextErrors.camposSelecionados = "Selecione ao menos um campo";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const data = {
        projetoId: form.projetoId,
        titulo: form.titulo.trim(),
        dataInicioProjeto: form.dataInicioProjeto,
        camposSelecionados: form.camposSelecionados,
        itens,
        usarEntregaveis: form.usarEntregaveis,
        mostrarSubtotaisPorEntregavel: form.usarEntregaveis ? form.mostrarSubtotaisPorEntregavel : false,
        entregaveis: form.usarEntregaveis ? entregaveis : undefined,
      };
      const novo = await createOrcamento(data);
      router.push(`/dashboard/orcamentos/${novo.id}`);
    } catch (e) {
      console.error(e);
      setErrors({ submit: "Erro ao salvar orçamento. Tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/orcamentos"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para orçamentos
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Novo Orçamento
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure um orçamento para um projeto e exporte em PDF
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {errors.submit && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.titulo ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Orçamento - Projeto X"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Projeto <span className="text-red-500">*</span>
            </label>
            <select
              value={form.projetoId}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  projetoId: e.target.value,
                  atividadeIds: [],
                }))
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.projetoId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Selecione...</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo} ({p.empresa})
                </option>
              ))}
            </select>
            {errors.projetoId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projetoId}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Atividades <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {form.atividadeIds.length} selecionada(s)
                </span>
              </div>
              {!form.projetoId ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecione um projeto para listar as atividades.
                </p>
              ) : (
                <div className={`rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700`}>
                  {atividadesDoProjeto.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.atividadeIds.includes(a.id)}
                        onChange={() => toggleAtividade(a.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {a.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {a.horasAtuacao}h estimadas • status: {a.status}
                        </p>
                      </div>
                    </label>
                  ))}
                  {atividadesDoProjeto.length === 0 && (
                    <div className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      Nenhuma atividade no projeto.
                    </div>
                  )}
                </div>
              )}
              {errors.atividadeIds && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.atividadeIds}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Campos do orçamento <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {camposDisponiveis.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.camposSelecionados.includes(c.key)}
                      onChange={() =>
                        setForm((prev) => {
                          const has = prev.camposSelecionados.includes(c.key);
                          return {
                            ...prev,
                            camposSelecionados: has
                              ? prev.camposSelecionados.filter((x) => x !== c.key)
                              : [...prev.camposSelecionados, c.key],
                          };
                        })
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{c.label}</span>
                  </label>
                ))}
              </div>
              {errors.camposSelecionados && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.camposSelecionados}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Cronograma (preview)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sequencial por dias úteis, com possibilidade de override por atividade (em breve).
                  </p>
                </div>
                <div className="w-44">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Início do cronograma
                  </label>
                  <input
                    type="date"
                    value={form.dataInicioProjeto}
                    onChange={(e) => setForm((p) => ({ ...p, dataInicioProjeto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Atividade
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Início
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Fim
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Override
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cronogramaPreview.map((c) => {
                      const a = atividadesDoProjeto.find((x) => x.id === c.atividadeId);
                      return (
                        <tr key={c.atividadeId}>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {a?.titulo ?? c.atividadeId}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {c.inicio}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                            {c.fim}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={itemMeta[c.atividadeId]?.inicioOverride ?? ""}
                                onChange={(e) =>
                                  setItemMeta((prev) => ({
                                    ...prev,
                                    [c.atividadeId]: {
                                      ...prev[c.atividadeId],
                                      inicioOverride: e.target.value || undefined,
                                    },
                                  }))
                                }
                                className="w-36 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                              />
                              <input
                                type="date"
                                value={itemMeta[c.atividadeId]?.fimOverride ?? ""}
                                onChange={(e) =>
                                  setItemMeta((prev) => ({
                                    ...prev,
                                    [c.atividadeId]: {
                                      ...prev[c.atividadeId],
                                      fimOverride: e.target.value || undefined,
                                    },
                                  }))
                                }
                                className="w-36 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setItemMeta((prev) => ({
                                    ...prev,
                                    [c.atividadeId]: {
                                      ...prev[c.atividadeId],
                                      inicioOverride: undefined,
                                      fimOverride: undefined,
                                    },
                                  }))
                                }
                                className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                              >
                                limpar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {cronogramaPreview.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400" colSpan={4}>
                          Selecione projeto e atividades para ver o cronograma.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Entregáveis / checkpoints
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Opcional: organize o orçamento em entregáveis e marcos.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.usarEntregaveis}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        usarEntregaveis: e.target.checked,
                        mostrarSubtotaisPorEntregavel: e.target.checked
                          ? p.mostrarSubtotaisPorEntregavel
                          : false,
                      }))
                    }
                  />
                  Ativar
                </label>
              </div>

              {form.usarEntregaveis && (
                <div className="space-y-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.mostrarSubtotaisPorEntregavel}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, mostrarSubtotaisPorEntregavel: e.target.checked }))
                      }
                    />
                    Mostrar subtotais por entregável
                  </label>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Entregáveis: {entregaveis.length}
                    </p>
                    <button
                      type="button"
                      onClick={addEntregavel}
                      className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Adicionar entregável
                    </button>
                  </div>

                  {entregaveis.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                    >
                      <input
                        value={e.titulo}
                        onChange={(ev) =>
                          setEntregaveis((prev) =>
                            prev.map((x) => (x.id === e.id ? { ...x, titulo: ev.target.value } : x))
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Checkpoints: {e.checkpoints.length}
                          </p>
                          <button
                            type="button"
                            onClick={() => addCheckpoint(e.id)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            Adicionar checkpoint
                          </button>
                        </div>

                        {e.checkpoints.map((c) => (
                          <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              value={c.titulo}
                              onChange={(ev) =>
                                setEntregaveis((prev) =>
                                  prev.map((x) => {
                                    if (x.id !== e.id) return x;
                                    return {
                                      ...x,
                                      checkpoints: x.checkpoints.map((k) =>
                                        k.id === c.id ? { ...k, titulo: ev.target.value } : k
                                      ),
                                    };
                                  })
                                )
                              }
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="Título do checkpoint"
                            />
                            <input
                              type="date"
                              value={c.dataAlvo ?? ""}
                              onChange={(ev) =>
                                setEntregaveis((prev) =>
                                  prev.map((x) => {
                                    if (x.id !== e.id) return x;
                                    return {
                                      ...x,
                                      checkpoints: x.checkpoints.map((k) =>
                                        k.id === c.id ? { ...k, dataAlvo: ev.target.value || undefined } : k
                                      ),
                                    };
                                  })
                                )
                              }
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEntregaveis((prev) =>
                                  prev.map((x) => {
                                    if (x.id !== e.id) return x;
                                    return {
                                      ...x,
                                      checkpoints: x.checkpoints.filter((k) => k.id !== c.id),
                                    };
                                  })
                                )
                              }
                              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {entregaveis.length > 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Atribuição de atividades
                      </p>
                      {form.atividadeIds.length === 0 ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Selecione atividades para atribuir.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {form.atividadeIds.map((atividadeId) => {
                            const a = atividadesDoProjeto.find((x) => x.id === atividadeId);
                            return (
                              <div key={atividadeId} className="flex items-center justify-between gap-3">
                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                  {a?.titulo ?? atividadeId}
                                </span>
                                <select
                                  value={itemMeta[atividadeId]?.entregavelId ?? ""}
                                  onChange={(ev) =>
                                    setItemMeta((prev) => ({
                                      ...prev,
                                      [atividadeId]: {
                                        ...prev[atividadeId],
                                        entregavelId: ev.target.value || undefined,
                                      },
                                    }))
                                  }
                                  className="w-56 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                >
                                  <option value="">Sem entregável</option>
                                  {entregaveis
                                    .slice()
                                    .sort((x, y) => x.ordem - y.ordem)
                                    .map((e) => (
                                      <option key={e.id} value={e.id}>
                                        {e.titulo}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/orcamentos"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar orçamento"}
          </button>
        </div>
      </div>
    </div>
  );
}


