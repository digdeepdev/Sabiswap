import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSwapPair, writeSwapPair } from './swap-pair.ts';

const coins = [
  { coin: 'sol', name: 'Solana', networks: ['solana'] },
  { coin: 'melania', name: 'Melania Meme', networks: ['solana'] },
  { coin: 'usdc', name: 'USD Coin', networks: ['ethereum', 'solana'] },
  { coin: 'ETH', name: 'Ethereum', networks: ['base', 'ethereum', 'arbitrum'] },
  { coin: 'BTC', name: 'Bitcoin', networks: ['bitcoin', 'liquid'] },
];

test('pair links round-trip exact assets and networks', () => {
  const pair = { depositCoin: 'sol', depositNetwork: 'solana', settleCoin: 'melania', settleNetwork: 'solana' };
  const url = writeSwapPair(new URL('https://example.com/'), pair, coins);
  assert.deepEqual(readSwapPair(url.search, coins, url.pathname), pair);
  assert.equal(url.pathname, '/sol/melania');
  assert.equal(url.searchParams.size, 0);
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

test('clean native-asset links select native networks, not API list order', () => {
  assert.deepEqual(readSwapPair('', coins, '/eth/sol'), {
    depositCoin: 'ETH', depositNetwork: 'ethereum', settleCoin: 'sol', settleNetwork: 'solana',
  });
  assert.equal(readSwapPair('', coins, '/BTC/ETH/')?.depositNetwork, 'bitcoin');
});

test('network overrides survive copy and reload, with no legacy asset parameters', () => {
  const pair = { depositCoin: 'ETH', depositNetwork: 'base', settleCoin: 'sol', settleNetwork: 'solana' };
  const url = writeSwapPair(new URL('https://example.com/?from=btc&to=eth&utm_source=x'), pair, coins);
  assert.equal(url.pathname, '/eth/sol');
  assert.equal(url.searchParams.get('fromNetwork'), 'base');
  assert.equal(url.searchParams.get('utm_source'), 'x');
  assert.equal(url.searchParams.has('from'), false);
  assert.equal(url.searchParams.has('toNetwork'), false);
  assert.deepEqual(readSwapPair(url.search, coins, url.pathname), pair);
});

test('token links require an explicit network when ambiguous', () => {
  assert.throws(() => readSwapPair('', coins, '/usdc/sol'));
  assert.equal(readSwapPair('?fromNetwork=solana', coins, '/usdc/sol')?.depositNetwork, 'solana');
});

test('path wins over old query params; deployment base paths are respected', () => {
  assert.equal(readSwapPair('?from=melania&to=sol', coins, '/eth/sol')?.depositCoin, 'ETH');
  const pair = { depositCoin: 'ETH', depositNetwork: 'ethereum', settleCoin: 'sol', settleNetwork: 'solana' };
  const url = writeSwapPair(new URL('https://example.com/app/'), pair, coins, '/app/');
  assert.equal(url.pathname, '/app/eth/sol');
  assert.deepEqual(readSwapPair(url.search, coins, url.pathname, '/app/'), pair);
});
