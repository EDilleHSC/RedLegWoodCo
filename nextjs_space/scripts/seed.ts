import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed default settings
  await prisma.setting.upsert({
    where: { key: 'default_tax_rate' },
    update: {},
    create: { key: 'default_tax_rate', value: '0' },
  });
  await prisma.setting.upsert({
    where: { key: 'dark_mode' },
    update: {},
    create: { key: 'dark_mode', value: 'true' },
  });
  await prisma.setting.upsert({
    where: { key: 'default_supplier_id' },
    update: {},
    create: { key: 'default_supplier_id', value: '' },
  });

  console.log('Default settings seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
