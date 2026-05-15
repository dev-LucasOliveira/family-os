export interface ListItemParams {
  item: string;
  listName: string;
}

export interface ListItemsParams {
  items: string[];
  listName: string;
}

export interface ListNameParams {
  listName: string;
}

export const ptBrMessages = {
  addedItem: ({ item, listName }: ListItemParams) =>
    `Adicionei ${item} na lista ${listName}.`,

  addedItems: ({ items, listName }: ListItemsParams) =>
    `Adicionei ${items.join(', ')} na lista ${listName}.`,

  removedItem: ({ item, listName }: ListItemParams) =>
    `Removi ${item} da lista ${listName}.`,

  removedItems: ({ items, listName }: ListItemsParams) =>
    `Removi ${items.join(', ')} da lista ${listName}.`,

  checkedItem: ({ item, listName }: ListItemParams) =>
    `Marquei ${item} como feito na lista ${listName}.`,

  checkedItems: ({ items, listName }: ListItemsParams) =>
    `Marquei ${items.join(', ')} como feito na lista ${listName}.`,

  listHeader: ({ listName }: ListNameParams) => `Lista ${listName}:`,

  listEmpty: ({ listName }: ListNameParams) => `A lista ${listName} está vazia.`,

  missingItemAndList: () =>
    'Informe o item e a lista, por exemplo: "adiciona banana na mercearia".',

  missingListName: () =>
    'Informe o nome da lista, por exemplo: "mostra lista compras".',

  unknownIntent: () =>
    [
      'Ainda não entendi essa mensagem.',
      'Por enquanto consigo ajudar com listas da casa. Tente:',
      '"adiciona banana na mercearia",',
      '"mostra lista compras",',
      '"marca banana na mercearia" ou',
      '"remove banana da mercearia".',
    ].join(' '),

  emptyMessageHint: () =>
    'Envie uma mensagem de texto, por exemplo: adiciona banana na mercearia',

  databaseError: () =>
    'Algo deu errado ao salvar. Tente de novo em instantes.',

  unexpectedError: () => 'Ocorreu um erro inesperado. Tente de novo.',

  listNotFound: ({ listName }: ListNameParams) => `Lista "${listName}" não encontrada.`,

  itemNotFound: ({ item, listName }: ListItemParams) =>
    `Item "${item}" não encontrado na lista "${listName}".`,

  allListsHeader: () => 'Listas disponíveis:',

  allListsEmpty: () => 'Ainda não há listas criadas.',

  allListsReply: (listNames: string[]) =>
    `Listas disponíveis:\n${listNames.map((n) => `• ${n}`).join('\n')}`,

  clearedList: ({ listName }: ListNameParams) =>
    `Lista "${listName}" limpa e removida.`,

  clearListNotFound: ({ listName }: ListNameParams) =>
    `Lista "${listName}" não encontrada.`,
} as const;

export type Messages = typeof ptBrMessages;
