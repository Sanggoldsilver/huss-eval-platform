'use client';

import { useEffect } from 'react';
import { initKakao } from '@/lib/kakao';

export default function KakaoInit() {
  useEffect(() => {
    // 실제 카카오 앱 키로 교체하거나 환경변수 사용
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || "YOUR_KAKAO_APP_KEY";
    initKakao(appKey);
  }, []);

  return null;
}
