import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSwapPair, writeSwapPair } from './swap-pair.ts';

const coins = [
  { coin: 'sol', name: 'Solana', networks: ['solana'] },
  { coin: 'melania', name: 'Melania Meme', networks: ['solana'] },
  { coin: 'usdc', name: 'USD Coin', networks: ['ethereum', 'solana'] },
];

test('pair links round-trip exact assets and networks', () => {
  const pair = { depositCoin: 'sol', depositNetwork: 'solana', settleCoin: 'melania', settleNetwork: 'solana' };
  const url = writeSwapPair(new URL('https://example.com/'), pair);
  assert.deepEqual(readSwapPair(url.search, coins), pair);
  assert.equal(url.searchParams.size, 4);
});

test('accepts asset names and case without changing API identifiers', () => {
  assert.equal(readSwapPair('?from=SOLANA&to=MELANIA', coins)?.depositCoin, 'sol');
});

test('rejects unsupported assets, invalid networks and ambiguous networks', () => {
  for (const search of [
    '?from=sol&to=unlisted',
    '?from=sol&fromNetwork=ethereum&to=melania',
    '?from=sol&to=usdc',
    '?from=sol',
    '?from=sol&to=sol',
  ]) assert.throws(() => readSwapPair(search, coins));
});

test('network-specific token routes and reverse pairs stay distinct', () => {
  const pair = readSwapPair('?from=usdc&fromNetwork=ethereum&to=usdc&toNetwork=solana', coins);
  assert.equal(pair?.depositNetwork, 'ethereum');
  assert.equal(pair?.settleNetwork, 'solana');
  assert.equal(readSwapPair('?from=melania&to=sol', coins)?.settleCoin, 'sol');
});

test('ordinary homepage and campaign links retain default pair behavior', () => {
  assert.equal(readSwapPair('', coins), null);
  assert.equal(readSwapPair('?utm_source=x', coins), null);
});
