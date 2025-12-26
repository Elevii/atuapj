"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useFaturamento } from "@/contexts/FaturamentoContext";
import { useProjetos } from "@/contexts/ProjetoContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lembrete } from "@/types";

export default function FaturaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getFaturaById, updateFatura, deleteFatura } = useFaturamento();
  const { getProjetoById } = useProjetos();

  const [fatura, setFatura] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [novoLembreteTitulo, setNovoLembreteTitulo] = useState("");
  const [novoLembreteData, setNovoLembreteData] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const found = getFaturaById(id);
    if (found) {
      setFatura(found);
    }
    setLoading(false);
  }, [id, getFaturaById]);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!fatura) return <div className="p-6">Fatura não encontrada</div>;

  const projeto = getProjetoById(fatura.projetoId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta fatura?")) return;
    setIsDeleting(true);
    await deleteFatura(id);
    router.push("/dashboard/financeiro");
  };

  const handleUpdateStatus = async (
    field: "cobrancaEnviada" | "notaFiscalEmitida" | "comprovanteEnviado"
  ) => {
    const updated = await updateFatura(id, { [field]: !fatura[field] });
    setFatura(updated);
  };

  const handleMarkPaid = async () => {
    const updated = await updateFatura(id, {
      status: "pago",
      dataPagamento: new Date().toISOString(),
    });
    setFatura(updated);
  };

  // Lembretes
  const addLembrete = async () => {
    if (!novoLembreteTitulo || !novoLembreteData) return;

    const novoLembreteObj: Lembrete = {
      id: `lemb_${Date.now()}`,
      faturaId: fatura.id,
      titulo: novoLembreteTitulo,
      data: novoLembreteData,
      concluido: false,
    };

    const currentLembretes = fatura.lembretes || [];
    const updated = await updateFatura(id, {
      lembretes: [...currentLembretes, novoLembreteObj],
    });
    setFatura(updated);
    setNovoLembreteTitulo("");
    setNovoLembreteData("");
  };

  const removeLembrete = async (lembreteId: string) => {
    const currentLembretes = fatura.lembretes || [];
    const updated = await updateFatura(id, {
      lembretes: currentLembretes.filter((l: Lembrete) => l.id !== lembreteId),
    });
    setFatura(updated);
  };
  
  const removeAllLembretes = async () => {
      if(!confirm("Deseja apagar TODOS os lembretes?")) return;
      const updated = await updateFatura(id, {
          lembretes: []
      });
      setFatura(updated);
  }

  const toggleLembrete = async (lembrete: Lembrete) => {
    const currentLembretes = fatura.lembretes || [];
    const newLembretes = currentLembretes.map((l: Lembrete) =>
      l.id === lembrete.id ? { ...l, concluido: !l.concluido } : l
    );
    const updated = await updateFatura(id, { lembretes: newLembretes });
    setFatura(updated);
  };

  const canPay = fatura.notaFiscalEmitida;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/financeiro"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center"
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
          Voltar
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Excluir Fatura
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {fatura.titulo}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {projeto?.empresa} - {projeto?.titulo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(fatura.valor)}
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                fatura.status === "pago"
                  ? "bg-green-100 text-green-800"
                  : fatura.status === "atrasado"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {fatura.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Detalhes
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Vencimento</span>
                <span className="font-medium">
                  {formatDate(fatura.dataVencimento)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500">Pagamento</span>
                <span className="font-medium">
                  {formatDate(fatura.dataPagamento)}
                </span>
              </div>
              <div className="py-2">
                <span className="text-gray-500 block mb-1">Observações</span>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm">
                  {fatura.observacoes || "Nenhuma observação."}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Checklist
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fatura.cobrancaEnviada}
                    onChange={() => handleUpdateStatus("cobrancaEnviada")}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Cobrança enviada
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fatura.notaFiscalEmitida}
                    onChange={() => handleUpdateStatus("notaFiscalEmitida")}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Nota Fiscal emitida
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fatura.comprovanteEnviado}
                    onChange={() => handleUpdateStatus("comprovanteEnviado")}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Comprovante enviado
                  </span>
                </label>
              </div>
              
               <div className="mt-6">
                 {fatura.status !== "pago" && fatura.status !== "cancelado" && (
                    <button
                        onClick={handleMarkPaid}
                        disabled={!canPay}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            canPay 
                            ? "bg-green-600 text-white hover:bg-green-700" 
                            : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                        }`}
                        title={!canPay ? "É necessário emitir a NF primeiro" : ""}
                    >
                        {canPay ? "Registrar Pagamento" : "Aguardando Emissão de NF"}
                    </button>
                 )}
               </div>

            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 md:pl-8 pt-8 md:pt-0">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Lembretes
               </h3>
               {fatura.lembretes && fatura.lembretes.length > 0 && (
                   <button 
                    onClick={removeAllLembretes}
                    className="text-xs text-red-500 hover:text-red-700"
                   >
                       Apagar Todos
                   </button>
               )}
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Novo lembrete..."
                  value={novoLembreteTitulo}
                  onChange={(e) => setNovoLembreteTitulo(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <input
                  type="date"
                  value={novoLembreteData}
                  onChange={(e) => setNovoLembreteData(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <button
                  onClick={addLembrete}
                  disabled={!novoLembreteTitulo || !novoLembreteData}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <div className="space-y-2">
                {fatura.lembretes?.map((lembrete: Lembrete) => (
                  <div
                    key={lembrete.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      lembrete.concluido
                        ? "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700"
                        : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={lembrete.concluido}
                        onChange={() => toggleLembrete(lembrete)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className={lembrete.concluido ? "opacity-50" : ""}>
                        <p
                          className={`text-sm font-medium ${
                            lembrete.concluido
                              ? "text-gray-500 line-through"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {lembrete.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(lembrete.data)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLembrete(lembrete.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {(!fatura.lembretes || fatura.lembretes.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum lembrete.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

