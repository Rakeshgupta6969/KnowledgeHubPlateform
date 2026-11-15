const { z } = require('zod');

const updateTenantSchema = z.object({
  name: z.string().trim().min(2, 'Tenant name must be at least 2 characters').max(255).optional(),
  primaryColor: z.string().trim().max(50).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
});

module.exports = {
  updateTenantSchema,
};
