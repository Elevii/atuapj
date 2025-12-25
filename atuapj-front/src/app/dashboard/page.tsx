"use client";

import StatCard from "@/components/dashboard/StatCard";
import Link from "next/link";

export default function DashboardPage() {
  // Dados hardcoded para os totalizadores
  const stats = {
    projetosAtivos: {
      title: "Projetos Ativos",
      value: 5,
      change: { value: 2, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      iconBgColor: "bg-green-500",
      trend: { value: 15, direction: "up" as const },
    },
    horasTotais: {
      title: "Horas Trabalhadas (Mês)",
      value: "142h",
      change: { value: 12, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBgColor: "bg-blue-500",
      trend: { value: 18, direction: "up" as const },
    },
    receitaTotal: {
      title: "Receita Total (Mês)",
      value: "R$ 28.400",
      change: { value: 22, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBgColor: "bg-yellow-500",
      trend: { value: 28, direction: "up" as const },
    },
    receitaHora: {
      title: "Média por Hora",
      value: "R$ 200/h",
      change: { value: 8, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      iconBgColor: "bg-indigo-500",
    },
    taxaOcupacao: {
      title: "Taxa de Ocupação",
      value: "71%",
      change: { value: 5, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      iconBgColor: "bg-purple-500",
      trend: { value: 7, direction: "up" as const },
    },
    projetosConcluidos: {
      title: "Projetos Concluídos (Mês)",
      value: 3,
      change: { value: 1, type: "increase" as const, period: "mês passado" },
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      iconBgColor: "bg-emerald-500",
      trend: { value: 10, direction: "up" as const },
    },
  };

  // Atividades recentes (hardcoded)
  const recentActivities = [
    {
      id: 1,
      type: "project",
      message: "Novo projeto 'Sistema ERP' criado",
      time: "2 horas atrás",
    },
    {
      id: 2,
      type: "hours",
      message: "Registro de 8h no projeto 'E-commerce'",
      time: "Ontem",
    },
    {
      id: 3,
      type: "hours",
      message: "Relatório de horas enviado - Projeto 'App Mobile'",
      time: "2 dias atrás",
    },
    {
      id: 4,
      type: "project",
      message: "Projeto 'Landing Page' concluído",
      time: "3 dias atrás",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Meu Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Visão geral da sua atividade como PJ
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard {...stats.projetosAtivos} />
        <StatCard {...stats.horasTotais} />
        <StatCard {...stats.receitaTotal} />
        <StatCard {...stats.receitaHora} />
        <StatCard {...stats.taxaOcupacao} />
        <StatCard {...stats.projetosConcluidos} />
      </div>

      {/* Seção de ações rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/registros/novo"
            className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
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
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Registrar Horas
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Adicionar horas trabalhadas
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/projetos/novo"
            className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
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
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Novo Projeto
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Criar novo projeto
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/relatorios"
            className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Relatórios
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Análises e métricas
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Atividades recentes e resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Atividades Recentes
            </h2>
            <Link
              href="/dashboard/atividades"
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo de Projetos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Resumo de Projetos
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Em andamento
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  5 projetos
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: "62%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Planejamento
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  1 projeto
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "12%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Concluídos
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  3 projetos
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "33%" }}
                ></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/dashboard/projetos"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Ver meus projetos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

