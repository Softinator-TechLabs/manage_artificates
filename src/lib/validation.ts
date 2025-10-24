import { z } from 'zod';

export const submissionSchema = z.object({
  imageData: z.string().min(1, 'Image is required'), // Base64 encoded image data
  question: z
    .string()
    .min(8, 'Question must be at least 8 characters')
    .max(280, 'Question must be less than 280 characters'),
  answer: z
    .string()
    .min(1, 'Answer is required')
    .max(1000, 'Answer must be less than 1000 characters'),
  englishQuestion: z.string().optional(),
  englishAnswer: z.string().optional(),
});

export const webhookSchema = z.object({
  submissionId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'ACCEPTED', 'REJECTED']),
  pointsAwarded: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  n8nRunId: z.string().optional(),
});

export const bankSchema = z.object({
  accountHolder: z
    .string()
    .min(2, 'Account holder name must be at least 2 characters')
    .optional(),
  accountNumber: z
    .string()
    .min(6, 'Account number must be at least 6 digits')
    .max(20, 'Account number must be less than 20 digits')
    .optional(),
  ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC code must be in format: AAAA0XXXXXX')
    .optional(),
  upiId: z
    .string()
    .regex(/^\w+@[\w.]+$/, 'UPI ID must be in format: name@bank')
    .optional(),
});

export const redemptionSchema = z.object({
  method: z.enum(['BANK', 'UPI']),
  points: z.number().int().positive('Points must be a positive number'),
});

export const userProfileSchema = z.object({
  expertise: z
    .string()
    .min(1, 'Expertise is required')
    .max(200, 'Expertise must be less than 200 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});
