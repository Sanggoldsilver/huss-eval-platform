import { google } from '@googleapis/drive';

/**
 * Google Drive API를 통한 파일 업로드
 * (서버 환경 전용)
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
 * (서버 환경 전용)
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
