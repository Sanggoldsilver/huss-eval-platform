let _db: any = null;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as { prisma: any };
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['error'] });
  }
  _db = globalForPrisma.prisma;
} catch {
  _db = null;
}

const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (_db) return _db[prop];
    throw new Error(`DB not connected (accessed: ${String(prop)})`);
  },
};

export const db: any = new Proxy({}, handler);
