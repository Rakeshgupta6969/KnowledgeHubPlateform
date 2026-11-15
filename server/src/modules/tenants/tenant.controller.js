const prisma = require('../../config/prisma');
const cache = require('../../config/redis');
const auditService = require('../audit/audit.service');
const ApiError = require('../../utils/errors');

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

      // Record audit event
      await auditService.log(
        req.tenant.id,
        req.user.id,
        'TENANT_SETTINGS_UPDATED',
        'TENANT',
        req.tenant.id,
        dataToUpdate
      );

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

  async getMembers(req, res, next) {
    try {
      const memberships = await prisma.membership.findMany({
        where: { tenantId: req.tenant.id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json({
        members: memberships.map((m) => ({
          id: m.id,
          role: m.role,
          status: m.status,
          user: m.user,
          createdAt: m.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'EDITOR'].includes(role)) {
        throw ApiError.badRequest('Role must be ADMIN or EDITOR', 'INVALID_ROLE');
      }

      const membership = await prisma.membership.findUnique({
        where: { id: memberId },
        include: { user: true },
      });

      if (!membership || membership.tenantId !== req.tenant.id) {
        throw ApiError.notFound('Member not found in this workspace', 'MEMBER_NOT_FOUND');
      }

      // Cannot modify workspace owner's role
      if (membership.role === 'OWNER') {
        throw ApiError.badRequest('Workspace owner role cannot be changed', 'CANNOT_MODIFY_OWNER');
      }

      const oldRole = membership.role;
      const updated = await prisma.membership.update({
        where: { id: memberId },
        data: { role },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Record audit event
      await auditService.log(
        req.tenant.id,
        req.user.id,
        'MEMBER_ROLE_UPDATED',
        'MEMBERSHIP',
        memberId,
        { targetUserId: membership.userId, oldRole, newRole: role }
      );

      res.status(200).json({
        message: 'Member role updated successfully',
        member: {
          id: updated.id,
          role: updated.role,
          status: updated.status,
          user: updated.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const result = await auditService.listLogs(req.tenant.id, req.query);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TenantController();
