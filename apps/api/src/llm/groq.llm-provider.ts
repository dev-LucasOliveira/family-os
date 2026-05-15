import { Injectable, Logger } from '@nestjs/common';
import type { IntentContext, IntentResult } from '@family-os/shared';
import { env } from '../config/env';
import { UNKNOWN_INTENT, parseGroqJson } from './groq-response.schema';
import type { LLMProvider } from './llm-provider.interface';

const SYSTEM_PROMPT = `Você é um extrator de intents para um assistente familiar doméstico.
Domínio: apenas listas da casa (mercado, compras, tarefas, etc).

REGRAS OBRIGATÓRIAS:
- Retorne APENAS JSON válido, sem markdown, sem explicações.
- Não responda ao usuário. Não execute ações. Nunca mute dados.
- Se a mensagem não for sobre listas domésticas, retorne {"type":"unknown","entities":{}}.

TIPOS DE INTENT SUPORTADOS:
- add_item: adicionar item a uma lista
- get_list: mostrar/listar itens de uma lista
- check_item: marcar item como feito/comprado
- remove_item: remover UM ITEM ESPECÍFICO de uma lista (ex: "remove banana da lista de mercado")
- list_all: listar todas as listas existentes
- clear_list: limpar/apagar TODA A LISTA (ex: "limpa a lista de mercado", "pode remover a lista moveis", "apaga a lista de compras") — quando o sujeito da ação é a LISTA em si, não um item
- unknown: qualquer outra coisa

ATENÇÃO — distinção importante:
- "remove banana da lista mercado" → remove_item (item=banana, list=mercado)
- "remove a lista mercado" / "limpa a lista mercado" / "pode remover a lista moveis" → clear_list (list=mercado)

FORMATO DE RESPOSTA:
{"type":"<tipo>","entities":{"item":"<nome do item>","list":"<nome da lista>"}}

NORMALIZAÇÃO:
- Normalize o nome da lista: "lista de mercado" → "mercado", "lista de compras" → "compras"
- Preserve o nome do item exatamente como dito, incluindo acentos, marcas, preposições
- Exemplo: "leite em pó" permanece "leite em pó", não "leite"
- Quando houver MÚLTIPLOS itens na mesma mensagem, coloque TODOS no campo "item" separados por vírgula
- Exemplo: "adiciona leite, ovos e manteiga no mercado" → "item": "leite, ovos, manteiga"
- Nunca omita itens — todos devem aparecer no campo "item"

EXEMPLOS:
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

Input: "limpa a lista de compras"
Output: {"type":"clear_list","entities":{"list":"compras"}}

Input: "pode remover a lista moveis"
Output: {"type":"clear_list","entities":{"list":"moveis"}}

Input: "remove a lista mercado"
Output: {"type":"clear_list","entities":{"list":"mercado"}}

Input: "tenho consulta amanhã?"
Output: {"type":"unknown","entities":{}}`;

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
          max_tokens: 150,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
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
