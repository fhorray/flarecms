import { nanoquery } from '@nanostores/query';
import { $auth } from './auth';
import { api } from '../lib/api';
import { $apiBaseUrl } from './config';

export const [createFetcherStore, createMutatorStore] = nanoquery({
  fetcher: (...keys) => {
    const apiBase = $apiBaseUrl.get();
    let path = keys.join('');
    
    // Ensure path doesn't duplicate prefix if keys already contain it
    if (path.startsWith(apiBase)) {
      path = path.replace(apiBase, '');
    }

    return api.get(path).json().then((json: any) => {
      // Automatically unwrap the .data property from our standardized API response
      if (json && typeof json === 'object' && 'data' in json && !('error' in json)) {
        return json.data;
      }
      
      // If the API returned an error object but 2xx (rare), treat as error to prevent crashes
      if (json && typeof json === 'object' && 'error' in json) {
        throw new Error(json.error);
      }

      return json;
    });
  },
});
