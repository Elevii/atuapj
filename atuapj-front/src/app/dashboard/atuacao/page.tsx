import EmptyState from "@/components/dashboard/EmptyState";

export default function AtuacaoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Minha Atuação
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Registre suas atividades realizadas e acompanhe sua atuação como PJ
        </p>
      </div>

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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
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
    </div>
  );
}

