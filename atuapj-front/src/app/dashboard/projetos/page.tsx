import EmptyState from "@/components/dashboard/EmptyState";

export default function ProjetosPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Projetos
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie todos os seus projetos
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="Nenhum projeto encontrado"
          description="Comece criando seu primeiro projeto para organizar suas atividades e acompanhar seu progresso."
          action={{
            label: "Criar Projeto",
            href: "/dashboard/projetos/novo",
          }}
        />
      </div>
    </div>
  );
}

