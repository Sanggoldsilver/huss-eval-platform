import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _db: PrismaClient | null = null;

try {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['error'] });
  }
  _db = globalForPrisma.prisma;
} catch {
  _db = null;
}

// db가 null일 경우 각 route의 try 블록에서 오류를 발생시켜
// catch 블록의 MockStore 폴백으로 자연스럽게 넘어가도록 Proxy 래핑
const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (_db) return (_db as any)[prop];
    // DB 없을 때 모든 속성 접근 시 오류를 발생시켜 폴백 유도
    throw new Error(`DB not connected (accessed: ${String(prop)})`);
  },
};

export const db = new Proxy({}, handler) as PrismaClient;
