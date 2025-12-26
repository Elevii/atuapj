import type {
  Atividade,
  Orcamento,
  OrcamentoCampoAtividade,
  OrcamentoEntregavel,
  Projeto,
  StatusAtividade,
} from "@/types";
import { gerarCronogramaSequencial } from "@/utils/estimativas";

const statusLabel: Record<StatusAtividade, string> = {
  pendente: "Pendente",
  em_execucao: "Em execução",
  concluida: "Concluída",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fieldLabel(field: OrcamentoCampoAtividade): string {
  switch (field) {
    case "titulo":
      return "Título";
    case "status":
      return "Status";
    case "dataInicio":
      return "Início";
    case "dataFimEstimada":
      return "Término";
    case "horasAtuacao":
      return "Horas (HE)";
    case "custoTarefa":
      return "Custo tarefa";
    case "custoCalculado":
      return "Custo calculado";
    case "horasUtilizadas":
      return "Horas (HU)";
  }
}

function fieldValue(params: {
  field: OrcamentoCampoAtividade;
  atividade: Atividade;
  projeto: Projeto;
}): string {
  const { field, atividade, projeto } = params;
  switch (field) {
    case "titulo":
      return atividade.titulo;
    case "status":
      return statusLabel[atividade.status];
    case "dataInicio":
      return atividade.dataInicio;
    case "dataFimEstimada":
      return atividade.dataFimEstimada;
    case "horasAtuacao":
      return `${atividade.horasAtuacao}h`;
    case "custoTarefa":
      return formatCurrency(atividade.custoTarefa);
    case "custoCalculado":
      return formatCurrency(atividade.horasAtuacao * projeto.valorHora);
    case "horasUtilizadas":
      return `${atividade.horasUtilizadas ?? 0}h`;
  }
}

function subtotalForEntregavel(params: {
  entregavel: OrcamentoEntregavel;
  itens: Orcamento["itens"];
  atividadesById: Map<string, Atividade>;
  projeto: Projeto;
}) {
  const atividadeIds = params.itens
    .filter((i) => i.entregavelId === params.entregavel.id)
    .map((i) => i.atividadeId);

  const horas = atividadeIds.reduce((sum, id) => sum + (params.atividadesById.get(id)?.horasAtuacao ?? 0), 0);
  const custoCalculado = horas * params.projeto.valorHora;
  const custoTarefa = atividadeIds.reduce((sum, id) => sum + (params.atividadesById.get(id)?.custoTarefa ?? 0), 0);

  return { horas, custoCalculado, custoTarefa };
}

export async function exportOrcamentoToPdf(params: {
  orcamento: Orcamento;
  projeto: Projeto;
  atividades: Atividade[];
  empresa: string;
  filename?: string;
}) {
  const jsPDFModule = await import("jspdf");
  await import("jspdf-autotable");
  const { jsPDF } = jsPDFModule;

  const atividadesById = new Map<string, Atividade>();
  for (const a of params.atividades) atividadesById.set(a.id, a);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  let cursorY = 40;

  doc.setFontSize(16);
  doc.text(params.orcamento.titulo, marginX, cursorY);
  cursorY += 18;

  doc.setFontSize(10);
  doc.text(`Projeto: ${params.projeto.titulo}`, marginX, cursorY);
  cursorY += 14;
  doc.text(`Empresa: ${params.empresa}`, marginX, cursorY);
  cursorY += 14;
  doc.text(`Valor/hora: ${formatCurrency(params.projeto.valorHora)} | Horas úteis/dia: ${params.projeto.horasUteisPorDia}`, marginX, cursorY);
  cursorY += 18;

  const itensOrdenados = params.orcamento.itens
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const atividadesSelecionadas = itensOrdenados
    .map((i) => atividadesById.get(i.atividadeId))
    .filter(Boolean) as Atividade[];

  const totalHoras = atividadesSelecionadas.reduce((sum, a) => sum + (a.horasAtuacao ?? 0), 0);
  const totalCustoCalculado = totalHoras * params.projeto.valorHora;
  const totalCustoTarefa = atividadesSelecionadas.reduce((sum, a) => sum + (a.custoTarefa ?? 0), 0);

  // Resumo
  doc.setFontSize(12);
  doc.text("Resumo", marginX, cursorY);
  cursorY += 10;
  doc.setFontSize(10);
  doc.text(`Horas estimadas: ${totalHoras}h`, marginX, cursorY);
  cursorY += 14;
  doc.text(`Custo calculado: ${formatCurrency(totalCustoCalculado)}`, marginX, cursorY);
  cursorY += 14;
  doc.text(`Custo da tarefa (manual): ${formatCurrency(totalCustoTarefa)}`, marginX, cursorY);
  cursorY += 18;

  // Cronograma
  const cronograma = gerarCronogramaSequencial({
    dataInicioProjetoISO: params.orcamento.dataInicioProjeto,
    horasUteisPorDia: params.projeto.horasUteisPorDia,
    itens: itensOrdenados.map((it) => ({
      atividadeId: it.atividadeId,
      horasEstimadas: atividadesById.get(it.atividadeId)?.horasAtuacao ?? 0,
      inicioOverride: it.inicioOverride,
      fimOverride: it.fimOverride,
    })),
  });

  doc.setFontSize(12);
  doc.text("Cronograma", marginX, cursorY);
  cursorY += 8;

  // @ts-expect-error plugin
  doc.autoTable({
    startY: cursorY,
    head: [["Atividade", "Início", "Fim"]],
    body: cronograma.map((c) => [
      atividadesById.get(c.atividadeId)?.titulo ?? c.atividadeId,
      c.inicio,
      c.fim,
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fontSize: 10 },
    theme: "grid",
    margin: { left: marginX, right: marginX },
  });

  // @ts-expect-error plugin
  cursorY = doc.lastAutoTable.finalY + 18;

  // Seções por entregável (opcional)
  if (params.orcamento.usarEntregaveis && params.orcamento.entregaveis?.length) {
    const entregaveis = params.orcamento.entregaveis.slice().sort((a, b) => a.ordem - b.ordem);
    for (const ent of entregaveis) {
      if (cursorY > 740) {
        doc.addPage();
        cursorY = 40;
      }

      doc.setFontSize(12);
      doc.text(`Entregável: ${ent.titulo}`, marginX, cursorY);
      cursorY += 12;
      if (ent.descricao) {
        doc.setFontSize(10);
        doc.text(ent.descricao, marginX, cursorY);
        cursorY += 14;
      }

      if (ent.checkpoints?.length) {
        doc.setFontSize(10);
        doc.text("Checkpoints", marginX, cursorY);
        cursorY += 6;

        // @ts-expect-error plugin
        doc.autoTable({
          startY: cursorY,
          head: [["Título", "Data alvo"]],
          body: ent.checkpoints
            .slice()
            .sort((a, b) => a.ordem - b.ordem)
            .map((c) => [c.titulo, c.dataAlvo ?? ""]),
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fontSize: 10 },
          theme: "grid",
          margin: { left: marginX, right: marginX },
        });
        // @ts-expect-error plugin
        cursorY = doc.lastAutoTable.finalY + 12;
      }

      if (params.orcamento.mostrarSubtotaisPorEntregavel) {
        const subtotal = subtotalForEntregavel({
          entregavel: ent,
          itens: itensOrdenados,
          atividadesById,
          projeto: params.projeto,
        });

        doc.setFontSize(10);
        doc.text(
          `Subtotal: ${subtotal.horas}h | Custo calculado: ${formatCurrency(subtotal.custoCalculado)} | Custo tarefa: ${formatCurrency(subtotal.custoTarefa)}`,
          marginX,
          cursorY
        );
        cursorY += 14;
      }
    }
  }

  // Tabela das atividades (campos configurados)
  if (cursorY > 740) {
    doc.addPage();
    cursorY = 40;
  }

  doc.setFontSize(12);
  doc.text("Atividades", marginX, cursorY);
  cursorY += 8;

  const cols = params.orcamento.camposSelecionados;
  const head = cols.map(fieldLabel);
  const body = itensOrdenados.map((it) => {
    const atividade = atividadesById.get(it.atividadeId);
    if (!atividade) return cols.map(() => "");
    return cols.map((field) => fieldValue({ field, atividade, projeto: params.projeto }));
  });

  // @ts-expect-error plugin
  doc.autoTable({
    startY: cursorY,
    head: [head],
    body,
    styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fontSize: 10 },
    theme: "grid",
    margin: { left: marginX, right: marginX },
  });

  doc.save(params.filename ?? "orcamento.pdf");
}


