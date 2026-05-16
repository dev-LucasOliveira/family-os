import { Injectable, Logger } from '@nestjs/common';
import type { IntentContext, IntentResult } from '@family-os/shared';
import { env } from '../config/env';
import { currentSpIsoString } from '../reminders/parse-reminder-date';
import { UNKNOWN_INTENT, parseGroqJson } from './groq-response.schema';
import type { LLMProvider } from './llm-provider.interface';

function buildSystemPrompt(): string {
  const nowSP = currentSpIsoString();
  return `Você é um extrator de intents para um assistente familiar doméstico.
Domínio: listas da casa (mercado, compras, tarefas, etc.) e lembretes.

REGRAS OBRIGATÓRIAS:
- Retorne APENAS JSON válido, sem markdown, sem explicações.
- Não responda ao usuário. Não execute ações. Nunca mute dados.
- Se a mensagem não for sobre listas ou lembretes domésticos, retorne {"type":"unknown","entities":{}}.

DATA/HORA ATUAL (fuso America/Sao_Paulo): ${nowSP}
Use essa referência para converter datas relativas em ISO 8601 com offset -03:00.

TIPOS DE INTENT SUPORTADOS:
- add_item: adicionar item a uma lista
- get_list: mostrar/listar itens de uma lista
- check_item: marcar item como feito/comprado
- remove_item: remover UM ITEM ESPECÍFICO de uma lista (ex: "remove banana da lista de mercado")
- list_all: listar todas as listas existentes
- clear_list: limpar/apagar TODA A LISTA (ex: "limpa a lista de mercado", "pode remover a lista moveis") — quando o sujeito da ação é a LISTA em si, não um item
- create_reminder: criar um lembrete com data/hora (ex: "me lembra de X amanhã às 8h")
- list_reminders: listar lembretes pendentes (ex: "quais lembretes temos?", "listar lembretes")
- cancel_reminder: cancelar/remover um lembrete pendente (ex: "cancela o lembrete da consulta")
- unknown: qualquer outra coisa

ATENÇÃO — distinções importantes:
- "remove banana da lista mercado" → remove_item (item=banana, list=mercado)
- "remove a lista mercado" / "limpa a lista mercado" / "pode remover a lista moveis" → clear_list (list=mercado)
- "me lembra de X amanhã às 8h" → create_reminder (text="X", remindAt=ISO datetime)

FORMATO DE RESPOSTA PARA LISTAS:
{"type":"<tipo>","entities":{"item":"<nome do item>","list":"<nome da lista>"}}

FORMATO DE RESPOSTA PARA LEMBRETES:
{"type":"create_reminder","entities":{"text":"<texto limpo do lembrete>","remindAt":"<ISO 8601 com offset -03:00>"}}
{"type":"list_reminders","entities":{}}

NORMALIZAÇÃO DE LISTAS:
- Normalize o nome da lista: "lista de mercado" → "mercado", "lista de compras" → "compras"
- Preserve o nome do item exatamente como dito, incluindo acentos, marcas, preposições
- Exemplo: "leite em pó" permanece "leite em pó", não "leite"
- Quando houver MÚLTIPLOS itens na mesma mensagem, coloque TODOS no campo "item" separados por vírgula
- Exemplo: "adiciona leite, ovos e manteiga no mercado" → "item": "leite, ovos, manteiga"
- Nunca omita itens — todos devem aparecer no campo "item"

NORMALIZAÇÃO DE LEMBRETES:
- "text" deve ser apenas a descrição do lembrete, sem data/hora e sem verbos de criação ("lembrar", "lembra de")
- "remindAt" deve ser o datetime em ISO 8601 com offset -03:00 (ex: "2026-05-16T08:00:00-03:00")
- Se a data/hora não puder ser determinada, use remindAt null

EXEMPLOS DE LISTAS:
Input: "adiciona leite em pó na lista de mercado"
Output: {"type":"add_item","entities":{"item":"leite em pó","list":"mercado"}}

Input: "adiciona salsicha, molho de tomate e café em pó na lista de mercado"
Output: {"type":"add_item","entities":{"item":"salsicha, molho de tomate, café em pó","list":"mercado"}}

Input: "o que temos pra comprar no mercado?"
Output: {"type":"get_list","entities":{"list":"mercado"}}

Input: "marca banana como comprado no mercado"
Output: {"type":"check_item","entities":{"item":"banana","list":"mercado"}}

Input: "remove arroz da lista de mercado"
Output: {"type":"remove_item","entities":{"item":"arroz","list":"mercado"}}

Input: "quais listas temos?"
Output: {"type":"list_all","entities":{}}

Input: "pode limpar a lista de mercado"
Output: {"type":"clear_list","entities":{"list":"mercado"}}

Input: "pode remover a lista moveis"
Output: {"type":"clear_list","entities":{"list":"moveis"}}

EXEMPLOS DE LEMBRETES:
Input: "me lembra de levar a Nicole no médico amanhã às 8h"
Output: {"type":"create_reminder","entities":{"text":"levar a Nicole no médico","remindAt":"<amanhã 08:00-03:00>"}}

Input: "lembra a gente da consulta sexta às 14h"
Output: {"type":"create_reminder","entities":{"text":"consulta","remindAt":"<próxima sexta 14:00-03:00>"}}

Input: "me lembra de pagar o aluguel dia 10"
Output: {"type":"create_reminder","entities":{"text":"pagar o aluguel","remindAt":"<dia 10 do mês atual ou próximo-03:00>"}}

Input: "quais lembretes temos?"
Output: {"type":"list_reminders","entities":{}}

Input: "listar lembretes"
Output: {"type":"list_reminders","entities":{}}

Input: "cancela o lembrete da consulta"
Output: {"type":"cancel_reminder","entities":{"text":"consulta"}}

Input: "remove o lembrete de pagar o aluguel"
Output: {"type":"cancel_reminder","entities":{"text":"pagar o aluguel"}}

Input: "tenho consulta amanhã?"
Output: {"type":"unknown","entities":{}}`;
}

@Injectable()
export class GroqLLMProvider implements LLMProvider {
  private readonly logger = new Logger(GroqLLMProvider.name);

  async extractIntent(input: string, _context?: IntentContext): Promise<IntentResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.GROQ_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          temperature: 0,
          max_tokens: 200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: input },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Groq API erro ${response.status}: ${body}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = data.choices[0]?.message?.content ?? '';
      const intent = parseGroqJson(content, input);

      this.logger.debug(`[groq] input="${env.NODE_ENV === 'development' ? input : '[redacted]'}" type=${intent.type}`);
      return intent;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn(`[groq] timeout após ${env.GROQ_TIMEOUT_MS}ms`);
      } else {
        this.logger.error('[groq] erro na chamada', error instanceof Error ? error.message : error);
      }
      return { ...UNKNOWN_INTENT, rawInput: input };
    } finally {
      clearTimeout(timeout);
    }
  }
}
