import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EXECUTABLE_EXTENSIONS = ['html', 'htm', 'py'];

function extractFileId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) return openIdMatch[1];
  return null;
}

async function fetchDriveFile(fileId: string) {
  let downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let res = await fetch(downloadUrl, { redirect: 'follow' });
  let buf = Buffer.from(await res.arrayBuffer());

  // 대용량 파일은 Google이 "바이러스 검사 불가" 확인 페이지를 먼저 반환하므로 confirm 토큰으로 재요청
  if (res.headers.get('content-type')?.includes('text/html')) {
    const text = buf.toString('utf-8');
    const confirmMatch =
      text.match(/confirm=([0-9A-Za-z_]+)&/) || text.match(/name="confirm"\s+value="([0-9A-Za-z_]+)"/);
    if (confirmMatch) {
      downloadUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}`;
      res = await fetch(downloadUrl, { redirect: 'follow' });
      buf = Buffer.from(await res.arrayBuffer());
    }
  }

  return { res, buf };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url 파라미터가 필요합니다.' }, { status: 400 });
  }

  const fileId = extractFileId(url);
  if (!fileId) {
    return NextResponse.json({ error: 'Google Drive 링크를 해석할 수 없습니다.' }, { status: 400 });
  }

  try {
    const { res, buf } = await fetchDriveFile(fileId);

    if (!res.ok) {
      return NextResponse.json({ error: 'Google Drive에서 파일을 가져오지 못했습니다.' }, { status: 502 });
    }

    const disposition = res.headers.get('content-disposition') || '';
    const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const fileName = nameMatch ? decodeURIComponent(nameMatch[1]) : `file_${fileId}`;
    const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';

    if (!EXECUTABLE_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: 'html 또는 py 파일만 실행할 수 있습니다.', fileName, extension },
        { status: 415 }
      );
    }

    return NextResponse.json({ fileName, extension, content: buf.toString('utf-8') });
  } catch (err) {
    return NextResponse.json({ error: '파일을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
