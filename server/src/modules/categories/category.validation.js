const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(255),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(255).optional(),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
