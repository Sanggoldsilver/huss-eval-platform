'use client';

import { useEffect } from 'react';

export default function KakaoInit() {
  useEffect(() => {
    // Vercel 환경변수 NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 로 Kakao SDK 초기화
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

    if (!jsKey) {
      console.warn('[KakaoInit] NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 환경변수가 설정되지 않았습니다.');
      return;
    }

    const tryInit = () => {
      const kakao = (window as any).Kakao;
      if (kakao && !kakao.isInitialized()) {
        kakao.init(jsKey);
        console.log('[KakaoInit] Kakao SDK 초기화 완료:', kakao.isInitialized());
      }
    };

    // SDK 스크립트가 이미 로드된 경우 즉시 초기화
    if ((window as any).Kakao) {
      tryInit();
    } else {
      // 스크립트 로드 완료를 기다린 후 초기화
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="kakao_js_sdk"]'
      );
      if (script) {
        script.addEventListener('load', tryInit);
      }
    }
  }, []);

  return null;
}
