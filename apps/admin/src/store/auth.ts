import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface AuthState {
  token: string | null;
  user: {
    email: string;
    role: string;
  } | null;
}

// Persist token in localStorage
export const $auth = persistentAtom<AuthState>('flare:auth', {
  token: null,
  user: null
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

export const login = (token: string, email: string) => {
  $auth.set({
    token,
    user: { email, role: 'admin' }
  });
};

export const logout = () => {
  $auth.set({ token: null, user: null });
};
