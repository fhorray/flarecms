import { atom } from 'nanostores';

export const $basePath = atom('/admin');
export const $apiBaseUrl = atom('/api');

export function setBase(base: string) {
  $basePath.set(base === '/' ? '' : base);
}

export function setApiBaseUrl(url: string) {
  $apiBaseUrl.set(url);
}
