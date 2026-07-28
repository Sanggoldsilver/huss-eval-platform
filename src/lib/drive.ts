/**
 * Google Drive URL 파싱 및 iframe preview URL 자동 변환 유틸리티
 * (클라이언트 및 서버 공용 순수 유틸리티)
 */

export function getDrivePreviewUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // 1. 파일 링크 파싱: https://drive.google.com/file/d/{FILE_ID}/view...
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  // 2. open?id={FILE_ID} 링크 파싱
  const openIdMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch && openIdMatch[1]) {
    return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;
  }

  // 3. 폴더 링크 파싱: https://drive.google.com/drive/folders/{FOLDER_ID}...
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
  }

  return url;
}

export function isGoogleDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('drive.google.com');
}
