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

  async listLogs(tenantId, query = {}) {
    // Support numeric limit directly or query object { page, limit }
    const pageParam = typeof query === 'object' ? query.page : 1;
    const limitParam = typeof query === 'object' ? query.limit : query;

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 50));
    const skip = (page - 1) * limit;

    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where: { tenantId } }),
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}

module.exports = new AuditService();
