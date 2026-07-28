declare global {
  interface Window {
    Kakao: any;
  }
}

/**
 * 카카오 SDK 초기화 함수
 * @param appKey 카카오 앱 키 (JavaScript 키)
 */
export const initKakao = (appKey: string) => {
  if (typeof window !== "undefined" && window.Kakao) {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(appKey);
    }
  }
};

/**
 * 카카오톡 공유 기능
 * @param title 공유할 제목
 * @param description 공유할 설명
 * @param linkUrl 이동할 링크 (기본값: 현재 페이지)
 */
export const shareToKakao = (title: string, description: string, linkUrl?: string) => {
  if (typeof window === "undefined" || !window.Kakao) {
    console.error("Kakao SDK가 로드되지 않았습니다.");
    return;
  }

  const url = linkUrl || window.location.href;

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
      imageUrl: "https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png", // 기본 이미지 변경 가능
    },
    buttons: [
      {
        title: "결과 확인하기",
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
  });
};
