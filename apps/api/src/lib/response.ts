import type { Context } from 'hono';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const apiResponse = {
  /**
   * Send a successful response with data and optional metadata
   */
  ok: (c: Context, data: any, meta?: any, status: number = 200) => {
    return c.json({ data, meta }, status as any);
  },

  /**
   * Send a paginated response
   */
  paginated: (c: Context, data: any[], meta: PaginationMeta, status: number = 200) => {
    return c.json({ data, meta }, status as any);
  },

  /**
   * Send an error response
   */
  error: (c: Context, message: string | any, status: number = 400) => {
    return c.json({ error: message }, status as any);
  },

  /**
   * Specialized success response for creations
   */
  created: (c: Context, data: any) => {
    return c.json({ data }, 201);
  }
};
