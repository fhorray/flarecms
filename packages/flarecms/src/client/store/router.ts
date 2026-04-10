import { createRouter, openPage, redirectPage, type Page, type Router } from '@nanostores/router';
import { map } from 'nanostores';

const ROUTE_PATTERNS = {
  home: '',
  setup: '/setup',
  login: '/login',
  signup: '/signup',
  collections: '/collections',
  users: '/users',
  settings: '/settings',
  settings_general: '/settings/general',
  settings_seo: '/settings/seo',
  settings_security: '/settings/security',
  settings_signup: '/settings/signup',
  settings_api: '/settings/api',
  device: '/device',
  collection: '/collection/:id/:slug',
  plugins: '/plugins',
  plugin_page: '/plugins/:pluginId',
  plugin_subpage: '/plugins/:pluginId/:page',
  document_list: '/:slug',
  document_edit: '/:slug/:id',
} as const;

/**
 * ExtractParams is a mapped type that extracts the parameters for each route.
 */
type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
  : Path extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : {};

/**
 * RouteParams is a mapped type that extracts the parameters for each route.
 */
type RouteParams = {
  [K in RouteName]: ExtractParams<RoutePatterns[K]>;
};

/**
 * RoutePatterns is a mapped type that extracts the parameters for each route.
 */
type RoutePatterns = typeof ROUTE_PATTERNS;

/**
 * RouteName is a mapped type that extracts the parameters for each route.
 */
export type RouteName = keyof RoutePatterns;

// Global reference to the internal nanostores-router instance
let internalRouter: Router<RoutePatterns> | null = null;

// The public store that components consume. 
// It mirrors the state of the active internal router.
// We initialize it with a safe default state.
export const $router = map<Page<RoutePatterns>>({
  route: 'home',
  path: '/',
  params: {} as any,
  search: {},
  hash: '',
});

/**
 * Initializes the router with a specific base path.
 */
export function initRouter(base: string) {
  const prefix = base === '/' ? '' : base;

  // We cast to any here only because we are dynamically building the object keys,
  // but the resulting structure is guaranteed to match RoutePatterns.
  const patterns = {} as any;
  for (const name of Object.keys(ROUTE_PATTERNS) as RouteName[]) {
    const path = ROUTE_PATTERNS[name];
    patterns[name] = name === 'home' ? (prefix || '/') : `${prefix}${path}`;
  }

  // Create new underlying router
  internalRouter = createRouter<RoutePatterns>(patterns);

  // Sync internal router state to our public $router map
  internalRouter.subscribe((state) => {
    if (state) {
      $router.set(state as Page<RoutePatterns>);
    }
  });

  return internalRouter;
}

/**
 * Navigate to a named route.
 */
export function navigate<T extends RouteName>(
  route: T,
  params?: RouteParams[T],
  search?: Record<string, string | number>
) {
  if (!internalRouter) {
    console.warn('Router not initialized.');
    return;
  }

  openPage(internalRouter, {
    route,
    params,
    search,
  } as any);
}

/**
 * Redirect to a named route.
 */
export function redirect<T extends RouteName>(
  route: T,
  params?: any,
  search?: Record<string, string | number>
) {
  if (!internalRouter) return;
  redirectPage(internalRouter, route, params, search as any);
}

// Default initialization
// Removed: initRouter(''); // This was causing initialization order issues in some environments.
