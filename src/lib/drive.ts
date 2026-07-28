/**
 * Google Drive URL 파싱 및 iframe preview URL 자동 변환 유틸리티
 */
import { google } from '@googleapis/drive';

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

/**
 * Google Drive API를 통한 파일 업로드
 * (서버 환경에서만 실행 가능)
 */
export async function uploadToGoogleDrive(fileName: string, mimeType: string, fileStream: any) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: mimeType,
    },
    media: {
      mimeType: mimeType,
      body: fileStream,
    },
  });
  
  return response.data;
}

/**
 * Google Drive API를 통한 파일 링크 조회
 * (서버 환경에서만 실행 가능)
 */
export async function getDriveFileLink(fileId: string) {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });
  
  const response = await drive.files.get({
    fileId: fileId,
    fields: 'webViewLink, webContentLink',
  });
  
  return response.data;
}
