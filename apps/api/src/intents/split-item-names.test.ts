import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitItemNames } from '@family-os/shared';

describe('splitItemNames', () => {
  describe('casos de sucesso', () => {
    it('item único sem separador', () => {
      assert.deepEqual(splitItemNames('margarina'), ['margarina']);
    });

    it('dois itens separados por vírgula', () => {
      assert.deepEqual(splitItemNames('margarina, cafe'), ['margarina', 'cafe']);
    });

    it('dois itens separados por "e"', () => {
      assert.deepEqual(splitItemNames('margarina e cafe'), ['margarina', 'cafe']);
    });

    it('mistura de vírgula e "e"', () => {
      assert.deepEqual(splitItemNames('margarina, cafe e chocolate'), [
        'margarina',
        'cafe',
        'chocolate',
      ]);
    });

    it('caso completo: vírgulas e "e" encadeados', () => {
      assert.deepEqual(
        splitItemNames('margarina, cafe e chocolate e leite e abobora, sal e açucar'),
        ['margarina', 'cafe', 'chocolate', 'leite', 'abobora', 'sal', 'açucar'],
      );
    });

    it('artigos iniciais são removidos de cada item', () => {
      assert.deepEqual(splitItemNames('a margarina e o cafe'), ['margarina', 'cafe']);
    });

    it('espaços extras são ignorados', () => {
      assert.deepEqual(splitItemNames('  margarina  ,  cafe  '), ['margarina', 'cafe']);
    });

    it('item com nome composto não é partido no meio', () => {
      assert.deepEqual(splitItemNames('creme de leite'), ['creme de leite']);
    });

    it('item composto junto de outros', () => {
      assert.deepEqual(splitItemNames('creme de leite, manteiga e sal'), [
        'creme de leite',
        'manteiga',
        'sal',
      ]);
    });

    it('mantém acentos', () => {
      assert.deepEqual(splitItemNames('açucar e macarrão'), ['açucar', 'macarrão']);
    });
  });

  describe('casos de borda', () => {
    it('string vazia retorna lista vazia', () => {
      assert.deepEqual(splitItemNames(''), []);
    });

    it('só espaços retorna lista vazia', () => {
      assert.deepEqual(splitItemNames('   '), []);
    });

    it('"e" isolado é descartado', () => {
      assert.deepEqual(splitItemNames('e'), []);
    });

    it('vírgula sozinha não gera item vazio', () => {
      assert.deepEqual(splitItemNames(','), []);
    });

    it('vírgula no início/fim é ignorada', () => {
      assert.deepEqual(splitItemNames(', margarina, cafe,'), ['margarina', 'cafe']);
    });
  });
});
