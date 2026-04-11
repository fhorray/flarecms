import { nanoquery } from '@nanostores/query';

const API_BASE = '/api/plugins/stripe-connect/routes';

async function fetcher<T>(routeName: string, input: any = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/${routeName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || 'Failed to fetch');
  }
  const data = await res.json();
  return data.data; // FlareCMS apiResponse wraps result in { data, ... }
}

const [createFetcherStore] = nanoquery({
  fetcher: (...args: any[]) => {
    const routeName = args[0] as string;
    if (!routeName) throw new Error('Route name is required');
    const input = args[1] ? JSON.parse(args[1] as string) : {};
    return fetcher(routeName, input);
  }
});

export const $balance = createFetcherStore<any>(['get-balance']);
export const $charges = createFetcherStore<any>(['get-charges']);
export const $subscriptions = createFetcherStore<any>(['get-subscriptions']);
export const $customers = createFetcherStore<any>(['get-customers']);
export const $products = createFetcherStore<any>(['get-products']);
