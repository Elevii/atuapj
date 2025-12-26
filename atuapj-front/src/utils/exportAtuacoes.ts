import type { Atuacao, StatusAtividade, TipoAtuacao } from "@/types";

export type AtuacaoExportRow = {
  data: string;
  horarioInicio: string;
  projeto: string;
  atividade: string;
  tipo: string;
  status: string;
  hd: number;
  hu: number;
  descricao: string;
  impacto: string;
};

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

function toRows(params: {
  atuacoes: Atuacao[];
  projetoTitleById: Map<string, string>;
  atividadeTitleById: Map<string, string>;
  hdByAtuacaoId?: Map<string, number>;
}): AtuacaoExportRow[] {
  return params.atuacoes.map((a) => ({
    data: a.data,
    horarioInicio: (a as any).horarioInicio ?? "",
    projeto: params.projetoTitleById.get(a.projetoId) ?? "",
    atividade: params.atividadeTitleById.get(a.atividadeId) ?? "",
    tipo: tipoLabel[a.tipo],
    status: statusLabel[(a as any).statusAtividadeNoRegistro ?? "pendente"],
    hd: params.hdByAtuacaoId?.get(a.id) ?? 0,
    hu: a.horasUtilizadas,
    descricao: a.descricao ?? "",
    impacto: a.impactoGerado ?? "",
  }));
}

export async function exportAtuacoesToExcel(params: {
  atuacoes: Atuacao[];
  projetoTitleById: Map<string, string>;
  atividadeTitleById: Map<string, string>;
  hdByAtuacaoId?: Map<string, number>;
  filename?: string;
}) {
  const XLSX = await import("xlsx");
  const rows = toRows(params);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "data",
      "horarioInicio",
      "projeto",
      "atividade",
      "tipo",
      "status",
      "hd",
      "hu",
      "descricao",
      "impacto",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Atuacoes");

  XLSX.writeFile(workbook, params.filename ?? "atuacoes.xlsx", {
    compression: true,
  });
}

export async function exportAtuacoesToPdf(params: {
  atuacoes: Atuacao[];
  projetoTitleById: Map<string, string>;
  atividadeTitleById: Map<string, string>;
  hdByAtuacaoId?: Map<string, number>;
  filename?: string;
  titulo?: string;
}) {
  const jsPDFModule = await import("jspdf");
  await import("jspdf-autotable");
  const { jsPDF } = jsPDFModule;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const rows = toRows(params);

  doc.setFontSize(14);
  doc.text(params.titulo ?? "Relatório de Atuações", 40, 40);

  // @ts-expect-error: autotable é adicionado ao protótipo do jsPDF pelo plugin
  doc.autoTable({
    startY: 60,
    head: [["Data", "Início", "Projeto", "Atividade", "Tipo", "Status", "HD", "HU", "Descrição", "Impacto"]],
    body: rows.map((r) => [
      r.data,
      r.horarioInicio,
      r.projeto,
      r.atividade,
      r.tipo,
      r.status,
      String(r.hd),
      String(r.hu),
      r.descricao,
      r.impacto,
    ]),
    styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 55 },
      2: { cellWidth: 140 },
      3: { cellWidth: 200 },
      4: { cellWidth: 90 },
      5: { cellWidth: 90 },
      6: { cellWidth: 55, halign: "right" },
      7: { cellWidth: 55, halign: "right" },
      8: { cellWidth: 220 },
      9: { cellWidth: 220 },
    },
  });

  doc.save(params.filename ?? "atuacoes.pdf");
}


