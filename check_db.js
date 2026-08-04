require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
console.log('DATABASE_URL exists:', !!connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const submissions = await prisma.submission.findMany();
  console.log('Submissions count:', submissions.length);
  console.log(JSON.stringify(submissions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
