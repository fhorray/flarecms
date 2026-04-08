import { $auth } from '../store/auth';

/**
 * A wrapper for fetch that automatically injects the Authorization header
 * from the $auth store if it exists.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const { token } = $auth.get();
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    // Default to JSON if content-type not set and body is provided
    ...(options.body && !options.headers ? { 'Content-Type': 'application/json' } : {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  return response;
}
