const prisma = require('../../config/prisma');

class AuditService {
  async log(tenantId, actorUserId, action, resourceType, resourceId, details = null) {
    try {
      return await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId,
          action,
          resourceType,
          resourceId,
          details: details || undefined,
        },
      });
    } catch (err) {
      console.warn(`[AuditLog Error] Failed to log audit event: ${err.message}`);
      return null;
    }
  }

  async listLogs(tenantId, limit = 50) {
    return prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}

module.exports = new AuditService();
