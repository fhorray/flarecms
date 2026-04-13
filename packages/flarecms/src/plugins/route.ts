import type { FlareRouteEntry, PluginContext, RouteCtx } from './types';

interface SchemaWithSafeParse<TOut = any> {
  safeParse: (data: unknown) => { success: true; data: TOut } | { success: false; error: any };
}

export class RouteBuilder<TInput = unknown> {
  private schema?: SchemaWithSafeParse<TInput>;
  private _method?: string;

  constructor(method?: string) {
    this._method = method;
  }

  /**
   * Defines a validation schema for the route input (e.g., using Zod).
   */
  input<T>(schema: SchemaWithSafeParse<T>): RouteBuilder<T> {
    this.schema = schema as any;
    return this as any;
  }

  /**
   * Sets the handler for the route.
   */
  handler(fn: (routeCtx: RouteCtx<TInput>, ctx: PluginContext) => Promise<unknown> | unknown): FlareRouteEntry<TInput> {
    return {
      method: this._method,
      input: this.schema,
      handler: async (ctx, pCtx) => {
        return fn(ctx, pCtx);
      }
    };
  }
}

/**
 * Route builder helpers for defining plugin API endpoints.
 */
export const route = {
  get: () => new RouteBuilder('GET'),
  post: () => new RouteBuilder('POST'),
  put: () => new RouteBuilder('PUT'),
  delete: () => new RouteBuilder('DELETE'),
  patch: () => new RouteBuilder('PATCH'),
  any: () => new RouteBuilder(),
};
