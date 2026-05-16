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
      'Consigo ajudar com listas e lembretes. Exemplos:',
      '"adiciona banana na mercearia",',
      '"mostra lista compras",',
      '"me lembra de pagar o aluguel dia 10 às 9h",',
      '"quais lembretes temos?" ou',
      '"cancela o lembrete do aluguel".',
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

  reminderCreated: ({ text, dateLabel }: { text: string; dateLabel: string }) =>
    `⏰ Lembrete criado: "${text}" em ${dateLabel}.`,

  reminderAmbiguousDate: () =>
    'Não consegui identificar a data/hora do lembrete. Tente ser mais específico, por exemplo: "me lembra de levar a Nicole no médico amanhã às 8h".',

  reminderMissingText: () =>
    'Não entendi o que devo te lembrar. Tente: "me lembra de levar a Nicole no médico amanhã às 8h".',

  reminderPastDate: () =>
    'Essa data já passou. Informe uma data futura para o lembrete.',

  reminderNotification: ({ text }: { text: string }) => `⏰ Lembrete: ${text}`,

  remindersHeader: () => 'Seus lembretes pendentes:',

  remindersEmpty: () => 'Não há lembretes pendentes.',

  remindersReply: (items: Array<{ dateLabel: string; text: string }>) =>
    `Lembretes pendentes:\n${items.map((r) => `• ${r.dateLabel} — ${r.text}`).join('\n')}`,

  reminderCancelled: ({ text }: { text: string }) => `Lembrete cancelado: "${text}".`,

  reminderCancelNotFound: ({ text }: { text: string }) =>
    `Não encontrei nenhum lembrete pendente com "${text}". Use "quais lembretes temos?" para ver os disponíveis.`,

  reminderCancelAmbiguous: (matches: string[]) =>
    `Encontrei ${matches.length} lembretes com esse texto. Qual deles?\n${matches.map((m, i) => `${i + 1}. ${m}`).join('\n')}`,
} as const;

export type Messages = typeof ptBrMessages;
