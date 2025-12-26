"use client";

import { useState } from "react";
import Link from "next/link";
import { useFaturamento } from "@/contexts/FaturamentoContext";
import { useProjetos } from "@/contexts/ProjetoContext";
import EmptyState from "@/components/dashboard/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinanceiroPage() {
  const { faturas, resumo, loading, updateFatura, deleteFaturas } = useFaturamento();
  const { projetos } = useProjetos();
  const [selectedFaturas, setSelectedFaturas] = useState<Set<string>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getProjectName = (id: string) => {
    const proj = projetos.find((p) => p.id === id);
    return proj ? `${proj.empresa} - ${proj.titulo}` : "Projeto não encontrado";
  };

  // Sort by due date (ascending)
  const sortedFaturas = [...faturas].sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
  );

  const isNearDueDate = (dateString: string) => {
    const today = new Date();
    const due = new Date(dateString);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 5;
  };

  const isLate = (fatura: any) => {
    if (fatura.status === "pago" || fatura.status === "cancelado") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(fatura.dataVencimento);
    return due < today;
  };

  const toggleSelectAll = () => {
    if (selectedFaturas.size === sortedFaturas.length) {
      setSelectedFaturas(new Set());
    } else {
      setSelectedFaturas(new Set(sortedFaturas.map((f) => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedFaturas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFaturas(newSelected);
  };

  const handleBulkDelete = async () => {
    if (
      confirm(
        `Tem certeza que deseja excluir as ${selectedFaturas.size} faturas selecionadas?`
      )
    ) {
      await deleteFaturas(Array.from(selectedFaturas));
      setSelectedFaturas(new Set());
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financeiro
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Controle de contas a receber
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedFaturas.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors dark:bg-gray-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-gray-700"
            >
              Excluir Selecionadas ({selectedFaturas.size})
            </button>
          )}
          <Link
            href="/dashboard/financeiro/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Nova Fatura
          </Link>
        </div>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Recebido este Mês
          </h3>
          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(resumo.recebidoMes)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            A Receber
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(resumo.aReceber)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Em Atraso
          </h3>
          <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(resumo.atrasado)}
          </p>
        </div>
      </div>

      {/* Listagem */}
      {faturas.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <EmptyState
            icon={
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Nenhuma fatura encontrada"
            description="Registre pagamentos e faturas para acompanhar seu fluxo de caixa."
            action={{
              label: "Nova Fatura",
              href: "/dashboard/financeiro/novo",
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 w-4">
                    <input
                      type="checkbox"
                      checked={
                        selectedFaturas.size === sortedFaturas.length &&
                        sortedFaturas.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Vencimento
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Fatura / Projeto
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Valor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Lembretes
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedFaturas.map((fatura) => {
                  const late = isLate(fatura);
                  const nearDue = isNearDueDate(fatura.dataVencimento);
                  const showCobrancaAlert =
                    fatura.status === "pendente" &&
                    nearDue &&
                    !fatura.cobrancaEnviada;

                  const canPay = fatura.notaFiscalEmitida;
                  const activeReminders =
                    fatura.lembretes?.filter((l) => !l.concluido).length || 0;

                  return (
                    <tr
                      key={fatura.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Evita navegar se clicou em um botão ou checkbox
                        if (
                          (e.target as HTMLElement).closest("button") ||
                          (e.target as HTMLElement).closest("input[type='checkbox']")
                        )
                          return;
                        window.location.href = `/dashboard/financeiro/${fatura.id}`;
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFaturas.has(fatura.id)}
                          onChange={() => toggleSelect(fatura.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            fatura.status === "pago"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                              : late || fatura.status === "atrasado"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                              : fatura.status === "cancelado"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                          }`}
                        >
                          {fatura.status === "pago"
                            ? "Pago"
                            : late || fatura.status === "atrasado"
                            ? "Atrasado"
                            : fatura.status === "cancelado"
                            ? "Cancelado"
                            : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(fatura.dataVencimento)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                            {fatura.titulo}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getProjectName(fatura.projetoId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(fatura.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {activeReminders > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                            {activeReminders} pendentes
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {/* Botão de Cobrança - só se pendente e cobrancaEnviada=false e perto do vencimento */}
                          {showCobrancaAlert && (
                            <button
                              onClick={() =>
                                updateFatura(fatura.id, {
                                  cobrancaEnviada: true,
                                })
                              }
                              title="Marcar cobrança como enviada"
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                            >
                              📧 Cobrança
                            </button>
                          )}

                          {/* Fluxo: 1. Emitir NF */}
                          {fatura.status !== "pago" &&
                            fatura.status !== "cancelado" &&
                            !fatura.notaFiscalEmitida && (
                              <button
                                onClick={() =>
                                  updateFatura(fatura.id, {
                                    notaFiscalEmitida: true,
                                  })
                                }
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              >
                                Emitir NF
                              </button>
                            )}

                          {/* Fluxo: 2. Registrar Pagamento (somente após NF emitida) */}
                          {fatura.status !== "pago" &&
                            fatura.status !== "cancelado" &&
                            canPay && (
                              <button
                                onClick={() =>
                                  updateFatura(fatura.id, {
                                    dataPagamento: new Date().toISOString(),
                                    status: "pago",
                                  })
                                }
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                Registrar Pagamento
                              </button>
                            )}

                          <Link
                            href={`/dashboard/financeiro/${fatura.id}`}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
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
