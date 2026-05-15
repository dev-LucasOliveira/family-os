import type { IntentResult, IntentType } from '@family-os/shared';
import { normalizeListName, splitItemNames } from '@family-os/shared';

const TRAILING_PUNCTUATION = /[.!?]+$/;

const ADD_VERBS = /^(?:adiciona|adicionar|coloca|colocar)\s+(.+)$/iu;
const REMOVE_VERBS = /^(?:remove|remover|tira|tirar)\s+(.+)$/iu;
const CHECK_VERBS = /^(?:marca|marcar|conferir|confere)\s+(.+)$/iu;

/** Sufixos de lista — ordem importa: padrões mais específicos primeiro. */
const LIST_SUFFIXES = [
  /\s+na\s+lista\s+de\s+(.+)$/iu,
  /\s+na\s+lista\s+(.+)$/iu,
  /\s+da\s+lista\s+de\s+(.+)$/iu,
  /\s+da\s+lista\s+(.+)$/iu,
  /\s+no\s+(.+)$/iu,
  /\s+na\s+(.+)$/iu,
  /\s+para\s+(.+)$/iu,
  /\s+da\s+(.+)$/iu,
  /\s+de\s+(.+)$/iu,
] as const;

const GET_LIST_PATTERNS: RegExp[] = [
  /^o\s+que\s+tem(?:os)?\s+na\s+lista\s+de\s+(.+)$/iu,
  /^o\s+que\s+tem(?:os)?\s+na\s+lista\s+(.+)$/iu,
  /^o\s+que\s+tem(?:os)?\s+no\s+(.+)$/iu,
  /^o\s+que\s+tem(?:os)?\s+em\s+(.+)$/iu,
  /^quais\s+itens?\s+tem\s+na\s+lista\s+de\s+(.+)$/iu,
  /^quais\s+itens?\s+tem\s+na\s+lista\s+(.+)$/iu,
  /^quais\s+itens?\s+tem\s+no\s+(.+)$/iu,
  /^quais\s+itens?\s+tem\s+em\s+(.+)$/iu,
  /^(?:mostra|mostrar|ver)\s+(?:a\s+)?lista\s+de\s+(.+)$/iu,
  /^(?:mostra|mostrar|ver)\s+(?:a\s+)?lista\s+(.+)$/iu,
  /^lista\s+(?:de\s+)?(.+)$/iu,
];

function stripTrailingPunctuation(text: string): string {
  return text.replace(TRAILING_PUNCTUATION, '').trim();
}

function splitByListSuffix(rest: string): { items: string[]; listName: string } | null {
  const body = stripTrailingPunctuation(rest);

  for (const suffix of LIST_SUFFIXES) {
    const match = body.match(suffix);
    if (!match || match.index === undefined) {
      continue;
    }

    const item = body.slice(0, match.index).trim();
    const listRaw = match[1]?.trim();
    if (!item || !listRaw) {
      continue;
    }

    const items = splitItemNames(item);
    return { items, listName: normalizeListName(listRaw) };
  }

  return null;
}

function parseWithVerb(
  text: string,
  verbPattern: RegExp,
  type: IntentType,
): IntentResult | null {
  const match = text.match(verbPattern);
  if (!match?.[1]) {
    return null;
  }

  const split = splitByListSuffix(match[1]);
  if (!split) {
    return null;
  }

  return {
    type,
    entities: { items: split.items, listName: split.listName },
    confidence: 1,
    rawInput: text,
  };
}

const CLEAR_LIST_PATTERNS: RegExp[] = [
  // "limpa/remove/apaga a lista de X" — sujeito é a lista
  /^(?:pode\s+)?(?:limpa|limpar|apaga|apagar|zera|zerar|esvazia|esvaziar|remove|remover|deleta|deletar|exclui|excluir)\s+(?:a\s+|o\s+)?lista\s+de\s+(.+)$/iu,
  /^(?:pode\s+)?(?:limpa|limpar|apaga|apagar|zera|zerar|esvazia|esvaziar|remove|remover|deleta|deletar|exclui|excluir)\s+(?:a\s+|o\s+)?lista\s+(.+)$/iu,
  // "limpa/zera/esvazia o/a X" — sem a palavra "lista" explícita
  /^(?:pode\s+)?(?:limpa|limpar|zera|zerar|esvazia|esvaziar)\s+(?:a\s+|o\s+)?(.+)$/iu,
];

function parseClearList(text: string): IntentResult | null {
  const body = stripTrailingPunctuation(text);
  for (const pattern of CLEAR_LIST_PATTERNS) {
    const match = body.match(pattern);
    const listRaw = match?.[1]?.trim();
    if (!listRaw) continue;
    return {
      type: 'clear_list',
      entities: { listName: normalizeListName(listRaw) },
      confidence: 1,
      rawInput: text,
    };
  }
  return null;
}

const LIST_ALL_PATTERNS: RegExp[] = [
  /^(?:mostrar?\s+)?listas?\s+disponíveis[.!?]?$/iu,
  /^(?:mostrar?\s+)?(?:todas\s+as\s+)?listas[.!?]?$/iu,
  /^quais\s+listas?\s+(?:temos|tem|existem)[.!?]?$/iu,
  /^ver\s+(?:todas\s+as\s+)?listas[.!?]?$/iu,
];

function parseListAll(text: string): IntentResult | null {
  const body = stripTrailingPunctuation(text);

  for (const pattern of LIST_ALL_PATTERNS) {
    if (pattern.test(body)) {
      return {
        type: 'list_all',
        entities: {},
        confidence: 1,
        rawInput: text,
      };
    }
  }

  return null;
}

function parseGetList(text: string): IntentResult | null {
  const body = stripTrailingPunctuation(text);

  for (const pattern of GET_LIST_PATTERNS) {
    const match = body.match(pattern);
    const listRaw = match?.[1]?.trim();
    if (!listRaw) {
      continue;
    }

    return {
      type: 'get_list',
      entities: { listName: normalizeListName(listRaw) },
      confidence: 1,
      rawInput: text,
    };
  }

  return null;
}

export function parseDeterministicIntent(input: string): IntentResult {
  const text = input.trim();

  const parsers: Array<() => IntentResult | null> = [
    () => parseListAll(text),
    () => parseClearList(text),
    () => parseGetList(text),
    () => parseWithVerb(text, ADD_VERBS, 'add_item'),
    () => parseWithVerb(text, REMOVE_VERBS, 'remove_item'),
    () => parseWithVerb(text, CHECK_VERBS, 'check_item'),
  ];

  for (const parse of parsers) {
    const result = parse();
    if (result) {
      return result;
    }
  }

  return {
    type: 'unknown',
    entities: {},
    confidence: 0,
    rawInput: input,
  };
}
