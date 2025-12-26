"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjetos } from "@/contexts/ProjetoContext";
import { useAtividades } from "@/contexts/AtividadeContext";
import { useAtuacoes } from "@/contexts/AtuacaoContext";
import { TipoAtuacao } from "@/types";

type Errors = Partial<Record<string, string>>;

const tipoOptions: { value: TipoAtuacao; label: string }[] = [
  { value: "reuniao", label: "Reunião" },
  { value: "execucao", label: "Execução" },
  { value: "planejamento", label: "Planejamento" },
];

export default function NovaAtuacaoPage() {
  const router = useRouter();
  const { projetos } = useProjetos();
  const { getAtividadesByProjeto } = useAtividades();
  const { createAtuacao } = useAtuacoes();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [formData, setFormData] = useState({
    projetoId: "",
    atividadeId: "",
    data: new Date().toISOString().split("T")[0],
    horasUtilizadas: "",
    tipo: "execucao" as TipoAtuacao,
    descricao: "",
    impactoGerado: "",
  });

  useEffect(() => {
    // Pré-seleciona o primeiro projeto (se existir) para reduzir cliques.
    if (!formData.projetoId && projetos.length > 0) {
      setFormData((prev) => ({ ...prev, projetoId: projetos[0].id }));
    }
  }, [formData.projetoId, projetos]);

  const atividadesDoProjeto = useMemo(() => {
    return formData.projetoId ? getAtividadesByProjeto(formData.projetoId) : [];
  }, [formData.projetoId, getAtividadesByProjeto]);

  useEffect(() => {
    // Se a atividade selecionada não pertence ao projeto atual, reseta.
    if (!formData.atividadeId) return;
    const exists = atividadesDoProjeto.some((a) => a.id === formData.atividadeId);
    if (!exists) {
      setFormData((prev) => ({ ...prev, atividadeId: "" }));
    }
  }, [atividadesDoProjeto, formData.atividadeId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const nextErrors: Errors = {};
    if (!formData.projetoId) nextErrors.projetoId = "Projeto é obrigatório";
    if (!formData.atividadeId) nextErrors.atividadeId = "Atividade é obrigatória";
    if (!formData.data) nextErrors.data = "Data da atuação é obrigatória";

    const horas = parseFloat(formData.horasUtilizadas);
    if (!formData.horasUtilizadas) {
      nextErrors.horasUtilizadas = "Horas utilizadas é obrigatório";
    } else if (isNaN(horas) || horas <= 0) {
      nextErrors.horasUtilizadas = "Horas utilizadas deve ser maior que zero";
    }

    if (!formData.tipo) nextErrors.tipo = "Tipo é obrigatório";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      await createAtuacao({
        projetoId: formData.projetoId,
        atividadeId: formData.atividadeId,
        data: formData.data,
        horasUtilizadas: horas,
        tipo: formData.tipo,
        descricao: formData.descricao.trim() || undefined,
        impactoGerado: formData.impactoGerado.trim() || undefined,
      });

      router.push("/dashboard/atuacao");
    } catch (error) {
      console.error("Erro ao registrar atuação:", error);
      setErrors({ submit: "Erro ao registrar atuação. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/atuacao"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-2 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para atuações
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Registrar Atuação
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Registre o que foi feito em uma atividade
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
                  // trocar projeto deve resetar atividade
                  handleChange(e);
                  setFormData((prev) => ({ ...prev, projetoId: e.target.value, atividadeId: "" }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.projetoId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecione um projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
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
                htmlFor="atividadeId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Atividade <span className="text-red-500">*</span>
              </label>
              <select
                id="atividadeId"
                name="atividadeId"
                value={formData.atividadeId}
                onChange={handleChange}
                disabled={!formData.projetoId}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.atividadeId ? "border-red-500" : "border-gray-300"
                } ${!formData.projetoId ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <option value="">Selecione uma atividade</option>
                {atividadesDoProjeto.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.titulo}
                  </option>
                ))}
              </select>
              {errors.atividadeId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.atividadeId}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="data"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Data da Atuação <span className="text-red-500">*</span>
              </label>
              <input
                id="data"
                name="data"
                type="date"
                value={formData.data}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.data ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.data && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="horasUtilizadas"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Horas Utilizadas <span className="text-red-500">*</span>
              </label>
              <input
                id="horasUtilizadas"
                name="horasUtilizadas"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.horasUtilizadas}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.horasUtilizadas ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: 2"
              />
              {errors.horasUtilizadas && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.horasUtilizadas}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tipo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.tipo ? "border-red-500" : "border-gray-300"
                }`}
              >
                {tipoOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipo}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Descrição do que foi feito (Opcional)
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Descreva brevemente o que foi realizado..."
            />
          </div>

          <div>
            <label
              htmlFor="impactoGerado"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Impacto Gerado (Opcional)
            </label>
            <textarea
              id="impactoGerado"
              name="impactoGerado"
              value={formData.impactoGerado}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Ex.: Redução de tempo, melhoria de performance, alinhamento com stakeholder..."
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/dashboard/atuacao"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Salvando..." : "Registrar Atuação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


