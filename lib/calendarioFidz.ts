// lib/calendarioFidz.ts

export interface MesCalendario {
  mes: number;
  tema: string;
  contexto: string;
  foco: string;
  tags: string[];
}

export const CALENDARIO_FIDZ: MesCalendario[] = [
  {
    mes: 1,
    tema: "Recomeço & Propósito",
    contexto: "Pessoas motivadas com o ano novo; foco em mudanças.",
    foco: "propósito, direção, novos começos",
    tags: ["fé", "direção"],
  },
  {
    mes: 2,
    tema: "Fé & Constância",
    contexto: "Motivação começa a cair.",
    foco: "continuar mesmo sem vontade, fé, constância",
    tags: ["fé", "constância"],
  },
  {
    mes: 3,
    tema: "Perseverança",
    contexto: "Rotina pesada volta; cansaço mental.",
    foco: "não desistir, perseverança",
    tags: ["força", "constância"],
  },
  {
    mes: 4,
    tema: "Esperança",
    contexto: "Mês próximo da Páscoa.",
    foco: "renovação, recomeço interior, esperança",
    tags: ["esperança"],
  },
  {
    mes: 5,
    tema: "Amor & Relações",
    contexto: "Mês associado ao afeto (família, mães).",
    foco: "amor, cuidado, conexão",
    tags: ["amor"],
  },
  {
    mes: 6,
    tema: "Confiança",
    contexto: "Meio do ano, incertezas aparecem.",
    foco: "confiar em Deus mesmo sem controle, confiança",
    tags: ["confiança"],
  },
  {
    mes: 7,
    tema: "Descanso & Paz",
    contexto: "Férias, pausa natural.",
    foco: "desacelerar, respirar, paz interior, serenidade",
    tags: ["paz", "serenidade"],
  },
  {
    mes: 8,
    tema: "Sabedoria",
    contexto: "Volta à rotina com mais foco.",
    foco: "decisões, direção, maturidade, sabedoria",
    tags: ["sabedoria"],
  },
  {
    mes: 9,
    tema: "Gratidão",
    contexto: "Mês mais leve emocionalmente.",
    foco: "valorizar o que já tem, gratidão",
    tags: ["gratidão"],
  },
  {
    mes: 10,
    tema: "Obediência & Direção",
    contexto: "Reta final do ano começa.",
    foco: "alinhar vida com propósito, direção, obediência",
    tags: ["direção", "fé"],
  },
  {
    mes: 11,
    tema: "Força & Superação",
    contexto: "Cansaço acumulado; ansiedade de fim de ano.",
    foco: "continuar firme, força, superação",
    tags: ["força"],
  },
  {
    mes: 12,
    tema: "Reflexão & Deus",
    contexto: "Fechamento de ciclo; Natal.",
    foco: "sentido da vida, Deus, gratidão, recomeço, reflexão",
    tags: ["gratidão", "paz"],
  },
];

/**
 * Retorna as tags temáticas do mês especificado (1–12).
 * Se nenhum mês for passado, usa o mês atual do calendário.
 */
export function getTagsDoMes(month?: number): string[] {
  const mes = month ?? new Date().getMonth() + 1;
  const calendario = CALENDARIO_FIDZ.find((m) => m.mes === mes);
  return calendario?.tags ?? ["fé"];
}

/**
 * Retorna o objeto completo do mês atual do Calendário Fidz.
 */
export function getMesAtual(): MesCalendario {
  const mes = new Date().getMonth() + 1;
  return CALENDARIO_FIDZ.find((m) => m.mes === mes) ?? CALENDARIO_FIDZ[0];
}
