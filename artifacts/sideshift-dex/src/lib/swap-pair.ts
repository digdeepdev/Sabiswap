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

// Keep network identifiers explicit: the same token can exist on multiple chains.
export function readSwapPair(search: string, coins: PairAsset[]): SwapPair | null {
  const params = new URLSearchParams(search);
  if (!['from', 'to', 'fromNetwork', 'toNetwork'].some((key) => params.has(key))) return null;

  const resolve = (key: string, networkKey: string) => {
    const value = params.get(key)?.toLowerCase();
    const asset = coins.find((coin) => coin.coin.toLowerCase() === value) ??
      coins.find((coin) => coin.name.toLowerCase() === value);
    if (!asset) throw new Error('This swap link contains an unsupported asset. Choose a supported pair below.');
    const requestedNetwork = params.get(networkKey);
    const network = requestedNetwork
      ? asset.networks.find((item) => item.toLowerCase() === requestedNetwork.toLowerCase())
      : asset.networks.length === 1 ? asset.networks[0] : undefined;
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

export function writeSwapPair(url: URL, pair: SwapPair): URL {
  const result = new URL(url);
  result.searchParams.set('from', pair.depositCoin);
  result.searchParams.set('fromNetwork', pair.depositNetwork);
  result.searchParams.set('to', pair.settleCoin);
  result.searchParams.set('toNetwork', pair.settleNetwork);
  return result;
}
