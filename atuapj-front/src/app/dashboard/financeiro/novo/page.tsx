"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjetos } from "@/contexts/ProjetoContext";
import { useFaturamento } from "@/contexts/FaturamentoContext";
import { formatTodayISODateLocal } from "@/utils/estimativas";
import { CreateLembreteDTO, FrequenciaRecorrencia } from "@/types";

export default function NovaFaturaPage() {
  const router = useRouter();
  const { projetos } = useProjetos();
  const { createFatura, faturas } = useFaturamento();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [formData, setFormData] = useState({
    projetoId: "",
    titulo: "",
    valor: "",
    dataVencimento: formatTodayISODateLocal(),
    observacoes: "",
  });

  // Recorrência
  const [usarRecorrencia, setUsarRecorrencia] = useState(false);
  const [recorrencia, setRecorrencia] = useState<{
    frequencia: FrequenciaRecorrencia;
    repeticoes: number;
  }>({
    frequencia: "mensal",
    repeticoes: 2,
  });

  // Lembretes
  const [usarLembretes, setUsarLembretes] = useState(false);
  const [lembretes, setLembretes] = useState<CreateLembreteDTO[]>([]);
  const [novoLembrete, setNovoLembrete] = useState<{
    titulo: string;
    tipo: "relativo" | "fixo";
    diasAntes: string;
    dataFixa: string;
  }>({
    titulo: "",
    tipo: "relativo",
    diasAntes: "5",
    dataFixa: "",
  });

  const [suggestedValue, setSuggestedValue] = useState<number | null>(null);

  useEffect(() => {
    // Pre-seleciona primeiro projeto
    if (!formData.projetoId && projetos.length > 0) {
      setFormData((prev) => ({ ...prev, projetoId: projetos[0].id }));
    }
  }, [formData.projetoId, projetos]);

  useEffect(() => {
    if (!formData.projetoId) return;

    const projeto = projetos.find((p) => p.id === formData.projetoId);
    if (!projeto) return;

    if (projeto.tipoCobranca === "fixo" && projeto.valorFixo) {
      const faturasDoProjeto = faturas.filter(
        (f) => f.projetoId === projeto.id && f.status !== "cancelado"
      );
      const totalFaturado = faturasDoProjeto.reduce(
        (acc, curr) => acc + curr.valor,
        0
      );
      const restante = Math.max(0, projeto.valorFixo - totalFaturado);

      setSuggestedValue(restante);
      // Sugere o valor restante se o campo estiver vazio
      if (!formData.valor) {
        setFormData((prev) => ({ ...prev, valor: restante.toString() }));
      }
    } else {
      setSuggestedValue(null);
    }
  }, [formData.projetoId, faturas, projetos, formData.valor]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const addLembrete = () => {
    if (!novoLembrete.titulo) return;

    const lembrete: CreateLembreteDTO = {
      titulo: novoLembrete.titulo,
    };

    if (novoLembrete.tipo === "relativo") {
      const dias = parseInt(novoLembrete.diasAntes);
      if (isNaN(dias)) return;
      lembrete.diasAntesVencimento = dias;
    } else {
      if (!novoLembrete.dataFixa) return;
      lembrete.dataFixa = novoLembrete.dataFixa;
    }

    setLembretes([...lembretes, lembrete]);
    setNovoLembrete({
      titulo: "",
      tipo: "relativo",
      diasAntes: "5",
      dataFixa: "",
    });
  };

  const removeLembrete = (index: number) => {
    setLembretes(lembretes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const nextErrors: Partial<Record<string, string>> = {};
    if (!formData.projetoId) nextErrors.projetoId = "Projeto é obrigatório";
    if (!formData.titulo) nextErrors.titulo = "Título é obrigatório";
    if (!formData.dataVencimento)
      nextErrors.dataVencimento = "Data de vencimento é obrigatória";

    const valorNum = parseFloat(formData.valor);
    if (!formData.valor) {
      nextErrors.valor = "Valor é obrigatório";
    } else if (isNaN(valorNum) || valorNum <= 0) {
      nextErrors.valor = "Valor deve ser maior que zero";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      await createFatura({
        projetoId: formData.projetoId,
        titulo: formData.titulo,
        valor: valorNum,
        dataVencimento: formData.dataVencimento,
        observacoes: formData.observacoes.trim() || undefined,
        recorrencia: usarRecorrencia ? recorrencia : undefined,
        lembretesIniciais: usarLembretes ? lembretes : undefined,
      });

      router.push("/dashboard/financeiro");
    } catch (error) {
      console.error("Erro ao criar fatura:", error);
      setErrors({ submit: "Erro ao criar fatura. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/financeiro"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar para financeiro
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Nova Fatura
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Lance uma nova fatura ou previsão de recebimento
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="projetoId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Projeto <span className="text-red-500">*</span>
              </label>
              <select
                id="projetoId"
                name="projetoId"
                value={formData.projetoId}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    projetoId: e.target.value,
                    valor: "",
                  }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.projetoId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecione um projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.empresa} - {p.titulo}
                  </option>
                ))}
              </select>
              {errors.projetoId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.projetoId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="titulo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Título <span className="text-red-500">*</span>
              </label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Parcela 1, Fatura #001"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.titulo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.titulo}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="valor"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.valor ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.valor}
                </p>
              )}
              {suggestedValue !== null && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Restante do contrato: {formatCurrency(suggestedValue)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="dataVencimento"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Data de Vencimento (ou Início) <span className="text-red-500">*</span>
              </label>
              <input
                id="dataVencimento"
                name="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.dataVencimento ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dataVencimento && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.dataVencimento}
                </p>
              )}
            </div>
          </div>

          {/* Recorrência */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="usarRecorrencia"
                checked={usarRecorrencia}
                onChange={(e) => setUsarRecorrencia(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="usarRecorrencia"
                className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Fatura Recorrente?
              </label>
            </div>

            {usarRecorrencia && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequência
                  </label>
                  <select
                    value={recorrencia.frequencia}
                    onChange={(e) =>
                      setRecorrencia({
                        ...recorrencia,
                        frequencia: e.target.value as FrequenciaRecorrencia,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repetições (total de faturas)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={recorrencia.repeticoes}
                    onChange={(e) =>
                      setRecorrencia({
                        ...recorrencia,
                        repeticoes: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lembretes */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="usarLembretes"
                checked={usarLembretes}
                onChange={(e) => setUsarLembretes(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="usarLembretes"
                className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Adicionar Lembretes?
              </label>
            </div>

            {usarLembretes && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lembrete
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Enviar Relatório, Cobrar Cliente"
                      value={novoLembrete.titulo}
                      onChange={(e) =>
                        setNovoLembrete({
                          ...novoLembrete,
                          titulo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={novoLembrete.tipo}
                      onChange={(e) =>
                        setNovoLembrete({
                          ...novoLembrete,
                          tipo: e.target.value as "relativo" | "fixo",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="relativo">Relativo</option>
                      <option value="fixo">Data Fixa</option>
                    </select>
                  </div>

                  {novoLembrete.tipo === "relativo" ? (
                    <div className="w-full md:w-40">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dias antes do Venc.
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={novoLembrete.diasAntes}
                        onChange={(e) =>
                          setNovoLembrete({
                            ...novoLembrete,
                            diasAntes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-40">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        value={novoLembrete.dataFixa}
                        onChange={(e) =>
                          setNovoLembrete({
                            ...novoLembrete,
                            dataFixa: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addLembrete}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Adicionar
                  </button>
                </div>

                {lembretes.length > 0 && (
                  <ul className="space-y-2">
                    {lembretes.map((l, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {l.titulo}
                          <span className="text-gray-500 ml-2 text-xs">
                            {l.dataFixa
                              ? `(Em ${new Date(
                                  l.dataFixa
                                ).toLocaleDateString()})`
                              : `(${l.diasAntesVencimento} dias antes)`}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLembrete(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="observacoes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Observações
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Informações adicionais..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/financeiro"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Salvando..." : "Criar Fatura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
