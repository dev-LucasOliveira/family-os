import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDeterministicIntent } from './parse-deterministic-intent';

describe('multi-item parsing no intent', () => {
  describe('add_item com múltiplos itens', () => {
    it('adiciona dois itens com vírgula', () => {
      const r = parseDeterministicIntent('adiciona margarina, cafe na lista de mercado');
      assert.equal(r.type, 'add_item');
      assert.deepEqual(r.entities.items, ['margarina', 'cafe']);
      assert.equal(r.entities.listName, 'mercado');
    });

    it('adiciona múltiplos itens misturando vírgula e "e"', () => {
      const r = parseDeterministicIntent(
        'adiciona margarina, cafe e chocolate e leite e abobora, sal e açucar na lista de mercado',
      );
      assert.equal(r.type, 'add_item');
      assert.deepEqual(r.entities.items, [
        'margarina',
        'cafe',
        'chocolate',
        'leite',
        'abobora',
        'sal',
        'açucar',
      ]);
      assert.equal(r.entities.listName, 'mercado');
    });

    it('item único ainda popula items como array de um elemento', () => {
      const r = parseDeterministicIntent('adiciona banana na lista de mercado');
      assert.equal(r.type, 'add_item');
      assert.deepEqual(r.entities.items, ['banana']);
      assert.equal(r.entities.listName, 'mercado');
    });

    it('artigos são removidos de cada item', () => {
      const r = parseDeterministicIntent('adiciona a margarina e o cafe na lista de mercado');
      assert.equal(r.type, 'add_item');
      assert.deepEqual(r.entities.items, ['margarina', 'cafe']);
    });
  });

  describe('remove_item com múltiplos itens', () => {
    it('remove dois itens com vírgula', () => {
      const r = parseDeterministicIntent('remove margarina, cafe da lista de mercado');
      assert.equal(r.type, 'remove_item');
      assert.deepEqual(r.entities.items, ['margarina', 'cafe']);
      assert.equal(r.entities.listName, 'mercado');
    });
  });

  describe('check_item com múltiplos itens', () => {
    it('marca dois itens', () => {
      const r = parseDeterministicIntent('marca margarina e cafe na lista de mercado');
      assert.equal(r.type, 'check_item');
      assert.deepEqual(r.entities.items, ['margarina', 'cafe']);
      assert.equal(r.entities.listName, 'mercado');
    });
  });
});
