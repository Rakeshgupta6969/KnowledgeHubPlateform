const { z } = require('zod');

const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must not exceed 100 characters'),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const feedbackSchema = z.object({
  helpful: z.boolean({ required_error: 'Helpful rating (true/false) is required' }),
  comment: z.string().trim().max(1000, 'Comment must not exceed 1000 characters').optional().nullable(),
});

module.exports = {
  searchQuerySchema,
  feedbackSchema,
};
