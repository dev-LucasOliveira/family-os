import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseGroqJson, mapGroqResponseToIntentResult } from './groq-response.schema';

describe('parseGroqJson', () => {
  describe('JSON válido', () => {
    it('add_item com item e lista', () => {
      const result = parseGroqJson(
        '{"type":"add_item","entities":{"item":"leite em pó","list":"mercado"}}',
        'adiciona leite em pó na lista de mercado',
      );
      assert.equal(result.type, 'add_item');
      assert.deepEqual(result.entities.items, ['leite em pó']);
      assert.equal(result.entities.listName, 'mercado');
      assert.equal(result.confidence, 1);
    });

    it('get_list só com lista', () => {
      const result = parseGroqJson(
        '{"type":"get_list","entities":{"list":"mercado"}}',
        'o que temos no mercado?',
      );
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
      assert.equal(result.entities.items, undefined);
    });

    it('check_item com item e lista', () => {
      const result = parseGroqJson(
        '{"type":"check_item","entities":{"item":"banana","list":"mercado"}}',
        'marca banana no mercado',
      );
      assert.equal(result.type, 'check_item');
      assert.deepEqual(result.entities.items, ['banana']);
      assert.equal(result.entities.listName, 'mercado');
    });

    it('remove_item com item e lista', () => {
      const result = parseGroqJson(
        '{"type":"remove_item","entities":{"item":"arroz","list":"mercado"}}',
        'remove arroz da lista de mercado',
      );
      assert.equal(result.type, 'remove_item');
      assert.deepEqual(result.entities.items, ['arroz']);
      assert.equal(result.entities.listName, 'mercado');
    });

    it('list_all sem entidades', () => {
      const result = parseGroqJson(
        '{"type":"list_all","entities":{}}',
        'quais listas temos?',
      );
      assert.equal(result.type, 'list_all');
    });

    it('unknown sem entidades', () => {
      const result = parseGroqJson(
        '{"type":"unknown","entities":{}}',
        'tenho consulta amanhã?',
      );
      assert.equal(result.type, 'unknown');
      assert.equal(result.confidence, 0);
    });

    it('normaliza "lista de mercado" para "mercado"', () => {
      const result = parseGroqJson(
        '{"type":"get_list","entities":{"list":"lista de mercado"}}',
        'mostra lista de mercado',
      );
      assert.equal(result.entities.listName, 'mercado');
    });
  });

  describe('JSON inválido / fallback para unknown', () => {
    it('string não é JSON', () => {
      const result = parseGroqJson('não é json', 'qualquer input');
      assert.equal(result.type, 'unknown');
      assert.equal(result.confidence, 0);
    });

    it('JSON sem campo "type"', () => {
      const result = parseGroqJson('{"entities":{"item":"banana"}}', 'input');
      assert.equal(result.type, 'unknown');
    });

    it('type desconhecido é rejeitado pelo Zod', () => {
      const result = parseGroqJson(
        '{"type":"comprar_item","entities":{"item":"banana"}}',
        'input',
      );
      assert.equal(result.type, 'unknown');
    });

    it('JSON vazio retorna unknown', () => {
      const result = parseGroqJson('{}', 'input');
      assert.equal(result.type, 'unknown');
    });

    it('string vazia retorna unknown', () => {
      const result = parseGroqJson('', 'input');
      assert.equal(result.type, 'unknown');
    });
  });

  describe('rawInput é preservado', () => {
    it('input original é salvo no resultado', () => {
      const input = 'adiciona banana na lista de mercado';
      const result = parseGroqJson(
        '{"type":"add_item","entities":{"item":"banana","list":"mercado"}}',
        input,
      );
      assert.equal(result.rawInput, input);
    });
  });
});

describe('mapGroqResponseToIntentResult', () => {
  it('item passado pelo Groq vira array items via splitItemNames', () => {
    const result = mapGroqResponseToIntentResult(
      { type: 'add_item', entities: { item: 'leite em pó', list: 'mercado' } },
      'input',
    );
    assert.deepEqual(result.entities.items, ['leite em pó']);
  });

  it('sem item, entities.items é undefined', () => {
    const result = mapGroqResponseToIntentResult(
      { type: 'get_list', entities: { list: 'mercado' } },
      'input',
    );
    assert.equal(result.entities.items, undefined);
  });
});
