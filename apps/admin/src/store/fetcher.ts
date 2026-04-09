import { nanoquery } from '@nanostores/query';
import { $auth } from './auth';

export const [createFetcherStore, createMutatorStore] = nanoquery({
  fetcher: (...keys) => {
    const { token } = $auth.get();
    return fetch(keys.join(''), {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    }).then(async (r) => {
      if (r.status === 401) {
        // Optional: logout if token expired
      }
      const json = await r.json();
      // Automatically unwrap the .data property from our standardized API response
      if (json && typeof json === 'object' && 'data' in json && !('error' in json)) {
        return json.data;
      }
      return json;
    });
  },
});
