import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchAddress } from './geocode.js'

const okResponse = (rows) => ({ ok: true, json: async () => rows })

test('searchAddress: estrae label, coordinate e nome', async () => {
  globalThis.fetch = async () => okResponse([
    { display_name: 'Via Giulio Pastore 5, Ovada', lat: '44.6419', lon: '8.6470', namedetails: { name: 'Acme' } },
  ])
  const r = await searchAddress('via giulio pastore ovada')
  assert.equal(r.length, 1)
  assert.equal(r[0].lat, 44.6419)
  assert.equal(r[0].lng, 8.647)
  assert.equal(r[0].name, 'Acme')
  assert.equal(r[0].address, 'Via Giulio Pastore 5, Ovada')
})

test('searchAddress: query troppo corta → nessuna chiamata', async () => {
  let called = false
  globalThis.fetch = async () => { called = true; return okResponse([]) }
  assert.deepEqual(await searchAddress('ab'), [])
  assert.equal(called, false)
})

test('searchAddress: errore di rete → [] senza avvelenare la cache', async () => {
  const q = 'indirizzo che prima fallisce'
  globalThis.fetch = async () => { throw new Error('network down') }
  assert.deepEqual(await searchAddress(q), [])
  // Un secondo tentativo deve RIPROVARE (la cache non è stata avvelenata dal vuoto).
  let called = 0
  globalThis.fetch = async () => { called++; return okResponse([{ display_name: 'Y', lat: '1.5', lon: '2.5' }]) }
  const r = await searchAddress(q)
  assert.equal(called, 1)
  assert.equal(r[0].lat, 1.5)
})
