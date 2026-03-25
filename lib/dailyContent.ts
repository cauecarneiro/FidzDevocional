// lib/dailyContent.ts
//
// Lógica de seleção do conteúdo diário com garantia de não-repetição no ano.
//
// Estratégia:
//   - Cada array é embaralhado uma vez por usuário/ano (Fisher-Yates com seed).
//   - O dayOfYear (1–365) é usado como índice no array embaralhado.
//   - Assim cada item aparece no máximo uma vez antes de todos os outros serem exibidos.
//   - Para o salmo é usado o pool filtrado pelo mês (Calendário Fidz) e o dayOfMonth
//     como índice, preservando o tema mensal com repetição mínima.

import { salmos, type Salmo } from './salmosData';
import { frases } from './frasesData';
import { reflexoes } from './reflexoesData';
import { praticas } from './praticasData';
import { getTagsDoMes } from './calendarioFidz';

export interface DailyContent {
  salmoDoDia: Salmo;
  fraseDoDia: string;
  reflexaoDoDia: string;
  praticaDoDia: string;
}

/** Fisher-Yates shuffle determinístico usando Linear Congruential Generator. */
function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  // Converte a string de seed em um número inteiro
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (Math.imul(31, s) + seed.charCodeAt(i)) | 0;
  }
  // LCG: parâmetros de Numerical Recipes
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    const j = (s >>> 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Retorna o número do dia no ano (1 = 1º de janeiro, 365 = 31 de dezembro). */
function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
}

/**
 * Retorna o conteúdo devocional do dia para o usuário dado.
 *
 * Garantias:
 *  - Frase, reflexão e prática: cada item aparece uma vez antes de qualquer
 *    repetição (ciclo completo pelo array embaralhado ao longo do ano).
 *  - Salmo: pool filtrado pelo tema do mês (Calendário Fidz), embaralhado por
 *    usuário/ano/mês → ciclo pelo pool antes de repetir dentro do mês.
 */
export function getDailyContent(userId: string): DailyContent {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();                // 0–11
  const dayOfMonth = today.getDate() - 1;        // 0–30 (índice base-0)
  const dayOfYear = getDayOfYear(today);          // 1–365

  // ── Salmo ────────────────────────────────────────────────────────────────
  // Pool filtrado pelo tema do mês; embaralhado por usuário+ano+mês.
  const monthTags = getTagsDoMes();
  const salmosDoMes = salmos.filter(s => s.tags.some(t => monthTags.includes(t)));
  const salmosPool = salmosDoMes.length > 0 ? salmosDoMes : salmos;
  const shuffledSalmos = shuffleWithSeed(salmosPool, `${userId}${year}${month}`);
  const salmoDoDia = shuffledSalmos[dayOfMonth % shuffledSalmos.length];

  // ── Frase ─────────────────────────────────────────────────────────────────
  // Array completo embaralhado por usuário+ano; índice = dayOfYear.
  const shuffledFrases = shuffleWithSeed(frases, `${userId}${year}f`);
  const fraseDoDia = shuffledFrases[(dayOfYear - 1) % shuffledFrases.length];

  // ── Reflexão ──────────────────────────────────────────────────────────────
  const shuffledReflexoes = shuffleWithSeed(reflexoes, `${userId}${year}r`);
  const reflexaoDoDia = shuffledReflexoes[(dayOfYear - 1) % shuffledReflexoes.length];

  // ── Prática ───────────────────────────────────────────────────────────────
  const shuffledPraticas = shuffleWithSeed(praticas, `${userId}${year}p`);
  const praticaDoDia = shuffledPraticas[(dayOfYear - 1) % shuffledPraticas.length];

  return {
    salmoDoDia,
    fraseDoDia: fraseDoDia.texto,
    reflexaoDoDia: reflexaoDoDia.texto,
    praticaDoDia: praticaDoDia.texto,
  };
}
