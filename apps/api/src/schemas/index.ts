import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const signupSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const collectionSchema = z.object({
  slug: z.string().min(1, { message: 'Slug is required' }),
  label: z.string().min(1, { message: 'Label is required' }),
  labelSingular: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  urlPattern: z.string().optional(),
});

export const fieldSchema = z.object({
  slug: z.string().min(1, { message: 'Slug is required' }),
  label: z.string().min(1, { message: 'Label is required' }),
  type: z.string().min(1, { message: 'Type is required' }),
  required: z.boolean().optional(),
});

export const setupSchema = z.object({
  title: z.string().min(1, { message: 'Site title is required' }),
  email: z.email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().optional(),
});

export const dynamicContentSchema = z.object({
  slug: z.string().optional(),
  status: z.string().optional(),
  title: z.string().optional(),
}).loose();

export const webauthnOptionsSchema = z.object({
  email: z.string().email()
});

export const webauthnVerifySchema = z.object({
  email: z.string().email(),
  response: z.any()
});
