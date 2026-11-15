const prisma = require('../../config/prisma');
const cache = require('../../config/redis');

class TenantController {
  async getCurrent(req, res, next) {
    try {
      res.status(200).json({
        tenant: {
          id: req.tenant.id,
          name: req.tenant.name,
          slug: req.tenant.slug,
          logoUrl: req.tenant.logoUrl,
          primaryColor: req.tenant.primaryColor,
          status: req.tenant.status,
          createdAt: req.tenant.createdAt,
          updatedAt: req.tenant.updatedAt,
        },
        membership: {
          id: req.membership.id,
          role: req.membership.role,
          status: req.membership.status,
          createdAt: req.membership.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCurrent(req, res, next) {
    try {
      const { name, primaryColor, logoUrl } = req.body;
      const dataToUpdate = {};

      if (name !== undefined) dataToUpdate.name = name;
      if (primaryColor !== undefined) dataToUpdate.primaryColor = primaryColor;
      if (logoUrl !== undefined) dataToUpdate.logoUrl = logoUrl;

      const updatedTenant = await prisma.tenant.update({
        where: { id: req.tenant.id },
        data: dataToUpdate,
      });

      // Invalidate public tenant config cache
      await cache.invalidateTenant(req.tenant.slug);

      res.status(200).json({
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          slug: updatedTenant.slug,
          logoUrl: updatedTenant.logoUrl,
          primaryColor: updatedTenant.primaryColor,
          status: updatedTenant.status,
          createdAt: updatedTenant.createdAt,
          updatedAt: updatedTenant.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TenantController();
