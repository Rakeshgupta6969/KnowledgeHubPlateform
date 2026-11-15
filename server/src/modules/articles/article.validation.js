const { z } = require('zod');

const createArticleSchema = z.object({
  title: z.string().trim().min(2, 'Article title must be at least 2 characters').max(255),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional().nullable(),
  excerpt: z.string().trim().max(1000).optional().nullable(),
  content: z.string().trim().min(1, 'Article content cannot be empty'),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
});

const updateArticleSchema = z.object({
  title: z.string().trim().min(2, 'Article title must be at least 2 characters').max(255).optional(),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional().nullable(),
  excerpt: z.string().trim().max(1000).optional().nullable(),
  content: z.string().trim().min(1, 'Article content cannot be empty').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

module.exports = {
  createArticleSchema,
  updateArticleSchema,
};
