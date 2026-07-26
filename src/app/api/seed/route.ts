import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: '가상 데이터 없음 (100% 클린 상태)',
  });
}
