const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting KnowledgeHub Seeding ---');

  // Clean existing data for idempotency
  await prisma.auditLog.deleteMany({});
  await prisma.articleView.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.searchLog.deleteMany({});
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

  const acmeEditor = await prisma.user.create({
    data: {
      name: 'Acme Editor',
      email: 'editor@acme.com',
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

  await prisma.membership.create({
    data: {
      tenantId: acmeTenant.id,
      userId: acmeEditor.id,
      role: 'EDITOR',
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
  const acmeArticle1 = await prisma.article.create({
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
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const acmeArticle2 = await prisma.article.create({
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
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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

  // Week 3 Feedback Data for Acme Corp
  await prisma.feedback.createMany({
    data: [
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle1.id,
        helpful: true,
        comment: 'Very straightforward walkthrough!',
        ipHash: 'seed_ip_hash_1',
      },
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle1.id,
        helpful: true,
        comment: 'Got my workspace up and running in 3 minutes.',
        ipHash: 'seed_ip_hash_2',
      },
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle1.id,
        helpful: true,
        ipHash: 'seed_ip_hash_3',
      },
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle1.id,
        helpful: false,
        comment: 'Could use screenshots for step 2.',
        ipHash: 'seed_ip_hash_4',
      },
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle2.id,
        helpful: true,
        comment: 'Clear invoicing instructions.',
        ipHash: 'seed_ip_hash_5',
      },
      {
        tenantId: acmeTenant.id,
        articleId: acmeArticle2.id,
        helpful: false,
        comment: 'Does not explain VAT reverse charge.',
        ipHash: 'seed_ip_hash_6',
      },
    ],
  });

  // Week 3 Views Data for Acme Corp
  const viewsData = [];
  for (let i = 0; i < 28; i++) {
    viewsData.push({
      tenantId: acmeTenant.id,
      articleId: acmeArticle1.id,
      sessionHash: `session_a1_${i}`,
      isBot: false,
      viewedAt: new Date(Date.now() - (i % 6) * 24 * 60 * 60 * 1000),
    });
  }
  for (let i = 0; i < 16; i++) {
    viewsData.push({
      tenantId: acmeTenant.id,
      articleId: acmeArticle2.id,
      sessionHash: `session_a2_${i}`,
      isBot: false,
      viewedAt: new Date(Date.now() - (i % 4) * 24 * 60 * 60 * 1000),
    });
  }
  await prisma.articleView.createMany({ data: viewsData });

  // Week 3 Search Logs for Acme Corp
  await prisma.searchLog.createMany({
    data: [
      { tenantId: acmeTenant.id, queryText: 'quickstart', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'quickstart', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'quickstart', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'invoicing', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'invoicing', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'payment methods', resultsCount: 1 },
      { tenantId: acmeTenant.id, queryText: 'sso saml login', resultsCount: 0 },
      { tenantId: acmeTenant.id, queryText: 'sso saml login', resultsCount: 0 },
      { tenantId: acmeTenant.id, queryText: 'webhook delivery', resultsCount: 0 },
    ],
  });

  // Week 3 Audit Logs for Acme Corp
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: acmeTenant.id,
        actorUserId: acmeOwner.id,
        action: 'ARTICLE_PUBLISHED',
        resourceType: 'ARTICLE',
        resourceId: acmeArticle1.id,
        details: { title: acmeArticle1.title },
      },
      {
        tenantId: acmeTenant.id,
        actorUserId: acmeAdmin.id,
        action: 'ARTICLE_PUBLISHED',
        resourceType: 'ARTICLE',
        resourceId: acmeArticle2.id,
        details: { title: acmeArticle2.title },
      },
      {
        tenantId: acmeTenant.id,
        actorUserId: acmeOwner.id,
        action: 'MEMBER_ROLE_UPDATED',
        resourceType: 'MEMBERSHIP',
        resourceId: acmeAdmin.id,
        details: { previousRole: 'EDITOR', newRole: 'ADMIN' },
      },
    ],
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

  const globexArticle1 = await prisma.article.create({
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

  // Week 3 Globex Data
  await prisma.feedback.create({
    data: {
      tenantId: globexTenant.id,
      articleId: globexArticle1.id,
      helpful: true,
      comment: 'Globex HPC setup works great.',
      ipHash: 'globex_ip_1',
    },
  });

  await prisma.articleView.create({
    data: {
      tenantId: globexTenant.id,
      articleId: globexArticle1.id,
      sessionHash: 'globex_sess_1',
      isBot: false,
    },
  });

  await prisma.searchLog.create({
    data: {
      tenantId: globexTenant.id,
      queryText: 'hpc cluster',
      resultsCount: 1,
    },
  });

  console.log('Demo Tenants created:');
  console.log(`- ${acmeTenant.name} (slug: ${acmeTenant.slug}, id: ${acmeTenant.id})`);
  console.log(`  - Owner: ${acmeOwner.email} (Password123!)`);
  console.log(`  - Admin: ${acmeAdmin.email} (Password123!)`);
  console.log(`  - Editor: ${acmeEditor.email} (Password123!)`);
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
