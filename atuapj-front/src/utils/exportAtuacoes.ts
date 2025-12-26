import type { Atuacao, TipoAtuacao } from "@/types";

export type AtuacaoExportRow = {
  data: string;
  projeto: string;
  atividade: string;
  tipo: string;
  horas: number;
  descricao: string;
  impacto: string;
};

const tipoLabel: Record<TipoAtuacao, string> = {
  reuniao: "Reunião",
  execucao: "Execução",
  planejamento: "Planejamento",
};

function toRows(params: {
  atuacoes: Atuacao[];
  projetoTitleById: Map<string, string>;
  atividadeTitleById: Map<string, string>;
}): AtuacaoExportRow[] {
  return params.atuacoes.map((a) => ({
    data: a.data,
    projeto: params.projetoTitleById.get(a.projetoId) ?? "",
    atividade: params.atividadeTitleById.get(a.atividadeId) ?? "",
    tipo: tipoLabel[a.tipo],
    horas: a.horasUtilizadas,
    descricao: a.descricao ?? "",
    impacto: a.impactoGerado ?? "",
  }));
}

export async function exportAtuacoesToExcel(params: {
  atuacoes: Atuacao[];
  projetoTitleById: Map<string, string>;
  atividadeTitleById: Map<string, string>;
  filename?: string;
}) {
  const XLSX = await import("xlsx");
  const rows = toRows(params);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ["data", "projeto", "atividade", "tipo", "horas", "descricao", "impacto"],
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
    head: [["Data", "Projeto", "Atividade", "Tipo", "Horas", "Descrição", "Impacto"]],
    body: rows.map((r) => [r.data, r.projeto, r.atividade, r.tipo, String(r.horas), r.descricao, r.impacto]),
    styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 140 },
      2: { cellWidth: 200 },
      3: { cellWidth: 90 },
      4: { cellWidth: 60, halign: "right" },
      5: { cellWidth: 220 },
      6: { cellWidth: 220 },
    },
  });

  doc.save(params.filename ?? "atuacoes.pdf");
}


