import { drive, auth } from '@googleapis/drive';

/**
 * Google Drive API를 통한 파일 업로드
 * (서버 환경 전용)
 */
export async function uploadToGoogleDrive(fileName: string, mimeType: string, fileStream: any) {
  const googleAuth = new auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const driveClient = drive({ version: 'v3', auth: googleAuth });

  const response = await driveClient.files.create({
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
  const googleAuth = new auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const driveClient = drive({ version: 'v3', auth: googleAuth });

  const response = await driveClient.files.get({
    fileId: fileId,
    fields: 'webViewLink, webContentLink',
  });

  return response.data;
}
