import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDeterministicIntent } from './parse-deterministic-intent';

describe('parseDeterministicIntent', () => {
  describe('list_all', () => {
    it('mostrar listas disponíveis', () => {
      const result = parseDeterministicIntent('mostrar listas disponíveis');
      assert.equal(result.type, 'list_all');
    });

    it('listas disponíveis', () => {
      const result = parseDeterministicIntent('listas disponíveis');
      assert.equal(result.type, 'list_all');
    });

    it('quais listas temos?', () => {
      const result = parseDeterministicIntent('quais listas temos?');
      assert.equal(result.type, 'list_all');
    });

    it('todas as listas', () => {
      const result = parseDeterministicIntent('todas as listas');
      assert.equal(result.type, 'list_all');
    });
  });

  describe('normalização de artigo no item', () => {
    it('tira a margarina da lista de mercado → item sem artigo', () => {
      const result = parseDeterministicIntent('tira a margarina da lista de mercado');
      assert.equal(result.type, 'remove_item');
      assert.equal(result.entities.items?.[0], 'margarina');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('adiciona o leite na lista de mercado → item sem artigo', () => {
      const result = parseDeterministicIntent('adiciona o leite na lista de mercado');
      assert.equal(result.type, 'add_item');
      assert.equal(result.entities.items?.[0], 'leite');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('marca a banana na lista de mercado → item sem artigo', () => {
      const result = parseDeterministicIntent('marca a banana na lista de mercado');
      assert.equal(result.type, 'check_item');
      assert.equal(result.entities.items?.[0], 'banana');
      assert.equal(result.entities.listName, 'mercado');
    });
  });

  describe('remove_item', () => {
    it('remove banana da lista de mercado', () => {
      const result = parseDeterministicIntent('remove banana da lista de mercado');
      assert.equal(result.type, 'remove_item');
      assert.equal(result.entities.items?.[0], 'banana');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('remover leite em po da lista de mercado', () => {
      const result = parseDeterministicIntent('remover leite em po da lista de mercado');
      assert.equal(result.type, 'remove_item');
      assert.equal(result.entities.items?.[0], 'leite em po');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('tira arroz da mercado', () => {
      const result = parseDeterministicIntent('tira arroz da mercado');
      assert.equal(result.type, 'remove_item');
      assert.equal(result.entities.items?.[0], 'arroz');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('lista inexistente não deve criar intent add_item', () => {
      const result = parseDeterministicIntent('remove banana da lista inexistente');
      assert.equal(result.type, 'remove_item');
      assert.equal(result.entities.listName, 'inexistente');
    });
  });

  describe('check_item', () => {
    it('marca banana na lista de mercado', () => {
      const result = parseDeterministicIntent('marca banana na lista de mercado');
      assert.equal(result.type, 'check_item');
      assert.equal(result.entities.items?.[0], 'banana');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('marcar leite em po na lista de mercado', () => {
      const result = parseDeterministicIntent('marcar leite em po na lista de mercado');
      assert.equal(result.type, 'check_item');
      assert.equal(result.entities.items?.[0], 'leite em po');
      assert.equal(result.entities.listName, 'mercado');
    });
  });

  describe('add_item', () => {
    it('parses item with internal "em" before "na lista de"', () => {
      const result = parseDeterministicIntent('adiciona leite em po na lista de mercado');
      assert.equal(result.type, 'add_item');
      assert.equal(result.entities.items?.[0], 'leite em po');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses arroz na lista de mercado', () => {
      const result = parseDeterministicIntent('adiciona arroz na lista de mercado');
      assert.equal(result.type, 'add_item');
      assert.equal(result.entities.items?.[0], 'arroz');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses coloca banana na lista mercado', () => {
      const result = parseDeterministicIntent('coloca banana na lista mercado');
      assert.equal(result.type, 'add_item');
      assert.equal(result.entities.items?.[0], 'banana');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses arroz integral na lista de mercado', () => {
      const result = parseDeterministicIntent('adiciona arroz integral na lista de mercado');
      assert.equal(result.type, 'add_item');
      assert.equal(result.entities.items?.[0], 'arroz integral');
      assert.equal(result.entities.listName, 'mercado');
    });
  });

  describe('get_list', () => {
    it('parses o que temos na lista de mercado?', () => {
      const result = parseDeterministicIntent('o que temos na lista de mercado?');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses mostrar lista de mercado', () => {
      const result = parseDeterministicIntent('mostrar lista de mercado');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses lista mercado', () => {
      const result = parseDeterministicIntent('lista mercado');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses mostra a lista de mercado', () => {
      const result = parseDeterministicIntent('mostra a lista de mercado');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses quais itens tem no mercado?', () => {
      const result = parseDeterministicIntent('quais itens tem no mercado?');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });

    it('parses o que tem na lista de mercado?', () => {
      const result = parseDeterministicIntent('o que tem na lista de mercado?');
      assert.equal(result.type, 'get_list');
      assert.equal(result.entities.listName, 'mercado');
    });
  });
});
