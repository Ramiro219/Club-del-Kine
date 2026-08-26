import assert from 'node:assert/strict'
import test from 'node:test'
import { integerRange, optionalEmail, requiredText } from '../src/utils/configurationValidation.ts'

test('normaliza textos y emails válidos', () => {
  assert.equal(requiredText(' Centro ', 'Nombre'), 'Centro')
  assert.equal(optionalEmail(' INFO@CENTRO.COM '), 'info@centro.com')
  assert.equal(integerRange(24, 'Horas', 1, 168), 24)
})

test('rechaza valores inválidos', () => {
  assert.throws(() => requiredText('  ', 'Nombre'), /obligatorio/)
  assert.throws(() => optionalEmail('sin-arroba'), /email válido/)
  assert.throws(() => integerRange(0, 'Horas', 1, 168), /entre 1 y 168/)
})
