const bcrypt = require('bcrypt');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/errors');
const slugify = require('../../utils/slugify');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../../utils/tokens');

class AuthService {
  async register({ companyName, slug, name, email, password }) {
    const tenantSlug = slug || slugify(companyName);

    if (!tenantSlug) {
      throw ApiError.badRequest('Unable to generate a valid slug from company name', 'INVALID_SLUG');
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (existingTenant) {
      throw ApiError.conflict('Company slug is already taken', 'SLUG_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Atomic transaction: Tenant + User + Owner Membership
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: tenantSlug,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      const membership = await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      });

      return { tenant, user, membership };
    });

    // Create session tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
    });

    const refreshTokenString = generateRefreshToken({
      userId: result.user.id,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: hashToken(refreshTokenString),
        expiresAt,
      },
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        createdAt: result.user.createdAt,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        status: result.membership.status,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                logoUrl: true,
                primaryColor: true,
              },
            },
          },
        },
      },
    });

    // Generic error if user not found to prevent user enumeration
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshTokenString = generateRefreshToken({
      userId: user.id,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshTokenString),
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      memberships: user.memberships.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        tenant: m.tenant,
      })),
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async refresh(refreshTokenString) {
    if (!refreshTokenString) {
      throw ApiError.unauthorized('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshTokenString);
    } catch (_err) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshTokenString);
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: decoded.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken || storedToken.user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    });

    return { accessToken };
  }

  async logout(refreshTokenString) {
    if (refreshTokenString) {
      const tokenHash = hashToken(refreshTokenString);
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async me(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                logoUrl: true,
                primaryColor: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
      memberships: user.memberships.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        tenant: m.tenant,
      })),
    };
  }
}

module.exports = new AuthService();
