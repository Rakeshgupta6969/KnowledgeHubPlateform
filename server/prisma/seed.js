const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting KnowledgeHub Seeding ---');

  // Clean existing data for idempotency
  await prisma.refreshToken.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Tenant A: Acme Corp
  const acmeTenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme',
      primaryColor: '#3B82F6',
      status: 'ACTIVE',
    },
  });

  const acmeOwner = await prisma.user.create({
    data: {
      name: 'Acme Owner',
      email: 'owner@acme.com',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const acmeAdmin = await prisma.user.create({
    data: {
      name: 'Acme Admin',
      email: 'admin@acme.com',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: acmeTenant.id,
      userId: acmeOwner.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: acmeTenant.id,
      userId: acmeAdmin.id,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 2. Tenant B: Globex Corporation
  const globexTenant = await prisma.tenant.create({
    data: {
      name: 'Globex Corporation',
      slug: 'globex',
      primaryColor: '#10B981',
      status: 'ACTIVE',
    },
  });

  const globexOwner = await prisma.user.create({
    data: {
      name: 'Globex Owner',
      email: 'owner@globex.com',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.membership.create({
    data: {
      tenantId: globexTenant.id,
      userId: globexOwner.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('Demo Tenants created:');
  console.log(`- ${acmeTenant.name} (slug: ${acmeTenant.slug}, id: ${acmeTenant.id})`);
  console.log(`  - Owner: ${acmeOwner.email} (Password123!)`);
  console.log(`  - Admin: ${acmeAdmin.email} (Password123!)`);
  console.log(`- ${globexTenant.name} (slug: ${globexTenant.slug}, id: ${globexTenant.id})`);
  console.log(`  - Owner: ${globexOwner.email} (Password123!)`);
  console.log('--- Seeding completed successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
