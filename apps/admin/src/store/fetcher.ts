import { nanoquery } from '@nanostores/query';
import { $auth } from './auth';

export const [createFetcherStore, createMutatorStore] = nanoquery({
  fetcher: (...keys) => {
    const { token } = $auth.get();
    return fetch(keys.join(''), {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    }).then((r) => {
      if (r.status === 401) {
        // Optional: logout if token expired
      }
      return r.json();
    });
  },
});
