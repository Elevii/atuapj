/**
 * Regras atuais (até existir configuração):
 * - Considera 8 horas úteis por dia
 * - Considera apenas dias úteis (segunda a sexta)
 */
export const DEFAULT_HORAS_UTEIS_POR_DIA = 8;

export function calcularDataFimEstimada(
  dataInicioISO: string,
  horasTotais: number,
  horasUteisPorDia: number = DEFAULT_HORAS_UTEIS_POR_DIA
): string {
  const horasPorDia = horasUteisPorDia;
  const diasNecessarios = Math.ceil(horasTotais / horasPorDia);

  const dataInicioObj = new Date(dataInicioISO);
  dataInicioObj.setHours(0, 0, 0, 0);
  const dataFim = new Date(dataInicioObj);

  // Regra: considera o "início" como a data de partida e soma dias úteis a partir do dia seguinte.
  // Ex.: início 24/12 + 16h (2 dias) => 26/12
  let diasUteisSomados = 0;
  while (diasUteisSomados < diasNecessarios) {
    dataFim.setDate(dataFim.getDate() + 1);
    const diaDaSemana = dataFim.getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      diasUteisSomados++;
    }
  }

  return dataFim.toISOString().split("T")[0];
}


