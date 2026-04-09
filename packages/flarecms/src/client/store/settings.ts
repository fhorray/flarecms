import { map } from 'nanostores';
import { apiFetch } from '../lib/api';

export interface Settings {
  [key: string]: string;
}

export const $settings = map<Settings>({});

export async function loadSettings() {
  try {
    const res = await apiFetch('/settings');
    if (res.ok) {
      const { data } = await res.json();
      $settings.set(data);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

export function updateSettingsLocally(newSettings: Settings) {
  $settings.set({
    ...$settings.get(),
    ...newSettings
  });
}

export function getSetting(key: string, fallback: string = ''): string {
  return $settings.get()[key] || fallback;
}
