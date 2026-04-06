const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Enterprise2026!', 12);

  const user = await prisma.user.upsert({
    where:  { email: 'franz@buttertech.io' },
    update: { name: 'Franz Heffa' },
    create: { email: 'franz@buttertech.io', name: 'Franz Heffa' },
  });

  await prisma.authAccount.upsert({
    where:  { userId: user.id },
    update: { passwordHash: hash },
    create: {
      userId:       user.id,
      email:        'franz@buttertech.io',
      passwordHash: hash,
    },
  });

  console.log('OK:', user.email, '| id:', user.id);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
