import { z } from 'zod';

export const tokenCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(z.object({
    resource: z.string(),
    actions: z.array(z.string()),
  })).min(1, 'At least one scope is required'),
});

export const deviceCodeRequestSchema = z.object({
  client_id: z.string(),
  scope: z.string().optional() // Space separated scopes
});

export const deviceTokenRequestSchema = z.object({
  client_id: z.string(),
  device_code: z.string(),
  grant_type: z.literal('urn:ietf:params:oauth:grant-type:device_code')
});

export const deviceApproveSchema = z.object({
  user_code: z.string()
});
