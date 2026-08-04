'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertTriangle, Play } from 'lucide-react';

interface LiveExecutionPanelProps {
  url: string;
  onClose: () => void;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_VERSION = 'v0.26.2';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodideScriptPromise: Promise<void> | null = null;
function loadPyodideScript(): Promise<void> {
  if (window.loadPyodide) return Promise.resolve();
  if (!pyodideScriptPromise) {
    pyodideScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Python 실행 환경(Pyodide)을 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
  }
  return pyodideScriptPromise;
}

// 사용자 코드를 격리된 스코프에서 실행하고 stdout/matplotlib 결과물을 수집하는 하네스
const PY_HARNESS = `
import io, base64, contextlib, json as _json

_stdout_buf = io.StringIO()
_figures = []
_plt = None
try:
    import matplotlib
    matplotlib.use("AGG")
    import matplotlib.pyplot as plt
    _plt = plt
    def _capture_show(*args, **kwargs):
        buf = io.BytesIO()
        plt.gcf().savefig(buf, format="png", bbox_inches="tight")
        _figures.append(base64.b64encode(buf.getvalue()).decode())
        plt.close("all")
    plt.show = _capture_show
except Exception:
    _plt = None

with contextlib.redirect_stdout(_stdout_buf), contextlib.redirect_stderr(_stdout_buf):
    try:
        exec(_USER_CODE, {"__name__": "__main__"})
    except Exception:
        import traceback
        traceback.print_exc()

if _plt is not None:
    for _num in _plt.get_fignums():
        _buf = io.BytesIO()
        _plt.figure(_num).savefig(_buf, format="png", bbox_inches="tight")
        _figures.append(base64.b64encode(_buf.getvalue()).decode())

_json.dumps({"stdout": _stdout_buf.getvalue(), "figures": _figures})
`;

type Status = 'loading' | 'ready' | 'error';

export default function LiveExecutionPanel({ url, onClose }: LiveExecutionPanelProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [statusMessage, setStatusMessage] = useState('파일을 불러오는 중...');
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [stdout, setStdout] = useState('');
  const [figures, setFigures] = useState<string[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    runFile();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function runFile() {
    setStatus('loading');
    setStatusMessage('Google Drive에서 파일을 불러오는 중...');
    try {
      const res = await fetch(`/api/drive-proxy?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (cancelledRef.current) return;

      if (!res.ok) {
        setStatus('error');
        setStatusMessage(data.error || '파일을 불러오지 못했습니다.');
        return;
      }

      setFileName(data.fileName);
      setExtension(data.extension);

      if (data.extension === 'html' || data.extension === 'htm') {
        setHtmlContent(data.content);
        setStatus('ready');
        return;
      }

      if (data.extension === 'py') {
        await runPython(data.content);
        return;
      }

      setStatus('error');
      setStatusMessage('html 또는 py 파일만 실행할 수 있습니다.');
    } catch (err: any) {
      if (cancelledRef.current) return;
      setStatus('error');
      setStatusMessage(err?.message || '실행 중 오류가 발생했습니다.');
    }
  }

  async function runPython(code: string) {
    try {
      setStatusMessage('Python 실행 환경을 불러오는 중... (최초 1회는 다소 걸릴 수 있어요)');
      await loadPyodideScript();
      if (cancelledRef.current) return;

      const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_INDEX_URL });
      if (cancelledRef.current) return;

      const neededPackages = ['numpy', 'pandas', 'matplotlib'].filter((pkg) =>
        new RegExp(`\\b${pkg}\\b`).test(code)
      );
      if (neededPackages.length > 0) {
        setStatusMessage(`필요한 패키지를 불러오는 중: ${neededPackages.join(', ')}`);
        await pyodide.loadPackage(neededPackages);
      }
      if (cancelledRef.current) return;

      setStatusMessage('코드 실행 중...');
      pyodide.globals.set('_USER_CODE', code);
      const resultJson: string = await pyodide.runPythonAsync(PY_HARNESS);
      if (cancelledRef.current) return;

      const result = JSON.parse(resultJson);
      setStdout(result.stdout || '');
      setFigures(result.figures || []);
      setStatus('ready');
    } catch (err: any) {
      if (cancelledRef.current) return;
      setStatus('error');
      setStatusMessage(err?.message || 'Python 코드 실행 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Play className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-semibold text-gray-800 truncate">
              {fileName || '실행 결과'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto relative bg-white">
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 text-sm px-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              {statusMessage}
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 text-sm p-6 text-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              {statusMessage}
            </div>
          )}

          {status === 'ready' && (extension === 'html' || extension === 'htm') && (
            <iframe
              srcDoc={htmlContent}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
              title={fileName}
            />
          )}

          {status === 'ready' && extension === 'py' && (
            <div className="p-4 space-y-4">
              {figures.map((fig, i) => (
                <img
                  key={i}
                  src={`data:image/png;base64,${fig}`}
                  alt={`실행 결과 ${i + 1}`}
                  className="max-w-full rounded-lg border border-gray-200 mx-auto"
                />
              ))}
              {stdout && (
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                  {stdout}
                </pre>
              )}
              {!stdout && figures.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">출력 결과가 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
