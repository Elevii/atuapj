"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjetos } from "@/contexts/ProjetoContext";
import { useAtividades } from "@/contexts/AtividadeContext";

import { Atividade } from "@/types";

export default function ProjetoDetalhesPage() {
  const params = useParams();
  const projetoId = params.id as string;
  const { getProjetoById } = useProjetos();
  const { atividades, loading } = useAtividades();

  const projeto = getProjetoById(projetoId);

  if (!projeto) {
    return (
      <div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Projeto não encontrado
          </p>
          <Link
            href="/dashboard/projetos"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Voltar para projetos
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };


  const atividadesDoProjeto = atividades.filter(
    (a) => a.projetoId === projetoId
  );

  const totalHoras = atividadesDoProjeto.reduce(
    (sum, atividade) => sum + atividade.horasAtuacao,
    0
  );
  const totalLucro = atividadesDoProjeto.reduce(
    (sum, atividade) => sum + atividade.lucroEstimado,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/projetos"
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
            Voltar para projetos
          </Link>
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {projeto.titulo}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {projeto.empresa}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/projetos/${projetoId}/atividades/nova`}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nova Atividade
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Valor por Hora
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(projeto.valorHora)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total de Horas
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalHoras}h
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Lucro Estimado Total
          </p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalLucro)}
          </p>
        </div>
      </div>

      {/* Atividades por Período */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando atividades...</p>
        </div>
      ) : atividadesDoProjeto.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhuma atividade
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando sua primeira atividade para este projeto.
            </p>
            <div className="mt-6">
              <Link
                href={`/dashboard/projetos/${projetoId}/atividades/nova`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Nova Atividade
              </Link>
            </div>
          </div>
        </div>
      ) : (
        Object.entries(
          atividadesDoProjeto.reduce((acc, atividade) => {
            const date = new Date(atividade.dataInicio);
            const periodo = `${date.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}`;
            
            if (!acc[periodo]) {
              acc[periodo] = [];
            }
            acc[periodo].push(atividade);
            return acc;
          }, {} as Record<string, Atividade[]>)
        ).map(([periodo, atividadesPeriodo]) => (
          <div key={periodo} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {periodo}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Atividade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Início
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Horas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Término Estimado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Lucro Estimado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {atividadesPeriodo.map((atividade) => (
                      <tr
                        key={atividade.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {atividade.titulo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(atividade.dataInicio)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {atividade.horasAtuacao}h
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-0">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(atividade.dataFimEstimada)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(atividade.lucroEstimado)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

