const { z } = require('zod');

const dateFilterSchema = z.object({
  from: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  to: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  dateFilterSchema,
};
