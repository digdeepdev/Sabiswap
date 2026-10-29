export interface PairAsset {
  coin: string;
  name: string;
  networks: string[];
}

export interface SwapPair {
  depositCoin: string;
  depositNetwork: string;
  settleCoin: string;
  settleNetwork: string;
}

const nativeNetworks: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bch: 'bitcoincash',
  ltc: 'litecoin', doge: 'doge', avax: 'avax', bnb: 'bsc',
};

export function pairPath(pathname: string, basePath = '/'): [string, string] | null {
  const base = basePath.replace(/\/$/, '');
  if (base && !pathname.startsWith(`${base}/`)) return null;
  const parts = pathname.slice(base.length).replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts.length !== 2 || !parts.every((part) => /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(part))) return null;
  return [parts[0], parts[1]];
}

function defaultNetwork(asset: PairAsset): string | undefined {
  const native = nativeNetworks[asset.coin.toLowerCase()];
  return asset.networks.find((network) => network.toLowerCase() === native) ??
    (asset.networks.length === 1 ? asset.networks[0] : undefined);
}

// Keep network identifiers explicit: the same token can exist on multiple chains.
export function readSwapPair(search: string, coins: PairAsset[], pathname = '/', basePath = '/'): SwapPair | null {
  const params = new URLSearchParams(search);
  const path = pairPath(pathname, basePath);
  if (path) {
    // The path takes precedence over legacy query-style asset identifiers.
    params.set('from', path[0]);
    params.set('to', path[1]);
  }
  if (!['from', 'to', 'fromNetwork', 'toNetwork'].some((key) => params.has(key))) return null;

  const resolve = (key: string, networkKey: string) => {
    const value = params.get(key)?.toLowerCase();
    const asset = coins.find((coin) => coin.coin.toLowerCase() === value) ??
      coins.find((coin) => coin.name.toLowerCase() === value);
    if (!asset) throw new Error('This swap link contains an unsupported asset. Choose a supported pair below.');
    const requestedNetwork = params.get(networkKey);
    const network = requestedNetwork
      ? asset.networks.find((item) => item.toLowerCase() === requestedNetwork.toLowerCase())
      : defaultNetwork(asset);
    if (!network) throw new Error('This swap link has a missing or unsupported network. Choose the asset and network below.');
    return { coin: asset.coin, network };
  };
  const from = resolve('from', 'fromNetwork');
  const to = resolve('to', 'toNetwork');
  if (from.coin === to.coin && from.network === to.network) {
    throw new Error('Choose different send and receive assets or networks.');
  }
  return {
    depositCoin: from.coin,
    depositNetwork: from.network,
    settleCoin: to.coin,
    settleNetwork: to.network,
  };
}

export function writeSwapPair(url: URL, pair: SwapPair, coins: PairAsset[] = [], basePath = '/'): URL {
  const result = new URL(url);
  result.pathname = `${basePath.replace(/\/$/, '')}/${encodeURIComponent(pair.depositCoin.toLowerCase())}/${encodeURIComponent(pair.settleCoin.toLowerCase())}`;
  result.searchParams.delete('from');
  result.searchParams.delete('to');
  for (const [key, coin, network] of [
    ['fromNetwork', pair.depositCoin, pair.depositNetwork],
    ['toNetwork', pair.settleCoin, pair.settleNetwork],
  ]) {
    const asset = coins.find((asset) => asset.coin === coin);
    if (asset && defaultNetwork(asset) === network) result.searchParams.delete(key);
    else result.searchParams.set(key, network);
  }
  return result;
}
