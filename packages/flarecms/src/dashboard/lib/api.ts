import ky from 'ky';
import { $auth } from '../store/auth';
import { $router, base } from '../store/router';

/**
 * Core API instance pre-configured with:
 * 1. Automatic Bearer Token injection via beforeRequest hook
 * 2. Automatic Zero-Config redirect via afterResponse hook
 * 3. Standard error handling for non-2xx responses (built-in ky behavior)
 */
export const api = ky.create({
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const { token } = $auth.get();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      }
    ],
    afterResponse: [
      async ({ request, response }) => {
        // Intercept Setup Required (Zero-Config flow)
        if (response.status === 403) {
          try {
            // We need to clone the response to read the body without consuming it
            const data: any = await response.clone().json();
            const setupPath = `${base}/setup`;
            if (data.code === 'SETUP_REQUIRED' && !request.url.includes('/api/setup') && $router.get()?.path !== setupPath) {
              $router.open(setupPath);
            }
          } catch {
            // Not JSON or parse error - ignore
          }
        }
      }
    ]
  }
});

/**
 * A legacy wrapper for components still expecting a standard Response object from apiFetch.
 * Uses the ky 'api' instance under the hood.
 * 
 * @deprecated Use the 'api' instance directly (e.g., api.get().json()) for new code.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  // ky handles most RequestInit options directly
  const { headers, ...rest } = options;
  
  // Cast method to something ky accepts (strict string types)
  const method = (options.method?.toLowerCase() || 'get') as any;

  // We cast to any to allow the caller to treat it as a standard fetch Response
  // which has .json(): Promise<any> instead of Promise<unknown>
  return api(path, {
    method,
    headers,
    ...rest,
    // ky throws on non-2xx by default, but standard fetch/apiFetch does not.
    // We set throwHttpErrors: false to maintain backward compatibility during the transition.
    throwHttpErrors: false,
  }) as any;
}
