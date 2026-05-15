const LIST_PREFIX = /^lista\s+(?:de\s+)?/i;
const LEADING_ARTICLE = /^(?:a|o|de|do|da|dos|das)\s+/i;
const ITEM_LEADING_ARTICLE = /^(?:a|o|as|os|um|uma|uns|umas)\s+/i;

/**
 * Normaliza nome de lista para persistência e comparação.
 * Remove prefixos ("lista de"), artigos iniciais; mantém acentos; lowercase.
 */
export function normalizeListName(name: string): string {
  let normalized = name.trim().toLowerCase();
  normalized = normalized.replace(LIST_PREFIX, '');

  while (LEADING_ARTICLE.test(normalized)) {
    normalized = normalized.replace(LEADING_ARTICLE, '');
  }

  return normalized.trim();
}

/**
 * Normaliza nome de item: remove artigos iniciais (a, o, as, os, um, uma…).
 * Mantém casing original pois o nome do item é exibido ao usuário.
 */
export function normalizeItemName(name: string): string {
  let normalized = name.trim();

  while (ITEM_LEADING_ARTICLE.test(normalized)) {
    normalized = normalized.replace(ITEM_LEADING_ARTICLE, '');
  }

  return normalized.trim();
}
