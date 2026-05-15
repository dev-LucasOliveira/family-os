import { normalizeItemName } from './list-name';

/** Separa vírgulas e o conector "e" entre palavras. */
const ITEM_SEPARATOR = /,\s*|\s+e\s+/iu;

/**
 * Divide uma string de itens pt-BR em um array normalizado.
 * Aceita vírgulas e o conector "e" como separadores.
 * Remove artigos iniciais de cada item via normalizeItemName.
 *
 * Exemplos:
 *   "margarina, cafe e chocolate"   → ["margarina", "cafe", "chocolate"]
 *   "creme de leite, manteiga e sal" → ["creme de leite", "manteiga", "sal"]
 *   "a margarina e o cafe"           → ["margarina", "cafe"]
 */
export function splitItemNames(raw: string): string[] {
  return raw
    .split(ITEM_SEPARATOR)
    .map((part) => normalizeItemName(part.trim()))
    .filter((part) => part.length > 0 && !/^e$/iu.test(part));
}
