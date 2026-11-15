const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting KnowledgeHub Seeding ---');

  // Clean existing data for idempotency
  await prisma.article.deleteMany({});
  await prisma.category.deleteMany({});
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

  // Categories for Acme Corp
  const acmeCatGettingStarted = await prisma.category.create({
    data: {
      tenantId: acmeTenant.id,
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Quick start guides and platform setup instructions.',
      sortOrder: 1,
      status: 'ACTIVE',
    },
  });

  const acmeCatBilling = await prisma.category.create({
    data: {
      tenantId: acmeTenant.id,
      name: 'Billing & Subscriptions',
      slug: 'billing-subscriptions',
      description: 'Invoicing, payment methods, and plan management.',
      sortOrder: 2,
      status: 'ACTIVE',
    },
  });

  // Articles for Acme Corp
  await prisma.article.create({
    data: {
      tenantId: acmeTenant.id,
      authorId: acmeOwner.id,
      categoryId: acmeCatGettingStarted.id,
      title: 'Quickstart: Setting up your account in 5 minutes',
      slug: 'quickstart-setting-up-account',
      excerpt: 'Learn how to configure your company profile and invite team members.',
      content:
        '# Welcome to Acme Corp\n\nFollow these quick steps to get started:\n\n1. Sign in to your company dashboard.\n2. Go to **Settings** to update your branding.\n3. Create your first support category.\n4. Write and publish your documentation.\n\n> Need help? Contact our support team anytime.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.article.create({
    data: {
      tenantId: acmeTenant.id,
      authorId: acmeAdmin.id,
      categoryId: acmeCatBilling.id,
      title: 'Managing your Payment Methods and Invoices',
      slug: 'managing-payment-methods-invoices',
      excerpt: 'Everything you need to know about downloading monthly invoices.',
      content:
        '# Billing and Invoicing\n\nAll invoices are generated on the 1st of each calendar month.\n\n### Accepted Payment Methods\n- Credit Card (Visa, MasterCard, Amex)\n- ACH Wire Transfer (Enterprise plans only)\n\nTo update your card details, navigate to workspace settings.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  await prisma.article.create({
    data: {
      tenantId: acmeTenant.id,
      authorId: acmeAdmin.id,
      categoryId: acmeCatGettingStarted.id,
      title: 'Upcoming v2 Features Preview (Internal Draft)',
      slug: 'upcoming-v2-features-preview',
      excerpt: 'Internal roadmap draft for upcoming quarterly releases.',
      content: '# Confidential: Internal Draft\n\nDraft notes on future features.',
      status: 'DRAFT',
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

  const globexCat = await prisma.category.create({
    data: {
      tenantId: globexTenant.id,
      name: 'Globex Cloud Solutions',
      slug: 'cloud-solutions',
      description: 'Documentation for Globex Cloud services.',
      sortOrder: 1,
      status: 'ACTIVE',
    },
  });

  await prisma.article.create({
    data: {
      tenantId: globexTenant.id,
      authorId: globexOwner.id,
      categoryId: globexCat.id,
      title: 'Introduction to Globex High-Performance Computing',
      slug: 'intro-to-globex-hpc',
      excerpt: 'Overview of Globex high-availability clusters.',
      content: '# Globex HPC Documentation\n\nHigh-performance compute clusters documentation.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  console.log('Demo Tenants created:');
  console.log(`- ${acmeTenant.name} (slug: ${acmeTenant.slug}, id: ${acmeTenant.id})`);
  console.log(`  - Owner: ${acmeOwner.email} (Password123!)`);
  console.log(`  - Admin: ${acmeAdmin.email} (Password123!)`);
  console.log(`  - Public Help Center: /help/${acmeTenant.slug}`);
  console.log(`- ${globexTenant.name} (slug: ${globexTenant.slug}, id: ${globexTenant.id})`);
  console.log(`  - Owner: ${globexOwner.email} (Password123!)`);
  console.log(`  - Public Help Center: /help/${globexTenant.slug}`);
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
