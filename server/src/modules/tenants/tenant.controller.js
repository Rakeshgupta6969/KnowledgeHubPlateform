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
}

module.exports = new TenantController();
