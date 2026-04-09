import { z } from 'zod';

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Valid email required'),
});

export const magicLinkVerifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1, 'Token is required'),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
});
