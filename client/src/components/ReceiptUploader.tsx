import { useState, useCallback } from 'react';
import type { ParsedReceipt } from '../types';

interface Props {
  onValidate: (parsed: ParsedReceipt) => string[];
  onParsed: (receipt: ParsedReceipt, imagePreview: string) => void;
}

interface PendingItem {
  parsed: ParsedReceipt;
  imageDataUrl: string;
  warnings: string[];
  fileName: string;
}

export function ReceiptUploader({ onValidate, onParsed }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const processFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setError('画像ファイルを選択してください');
        return;
      }

      setError(null);
      setProgress({ current: 0, total: imageFiles.length });

      const newPending: PendingItem[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setProgress({ current: i + 1, total: imageFiles.length });

        const formData = new FormData();
        formData.append('receipt', file);

        const res = await fetch('/api/parse-receipt', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(`${file.name}: ${err.error || 'サーバーエラー'}`);
        }
        const parsed: ParsedReceipt = await res.json();

        const imageDataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = (e) => resolve(e.target?.result as string);
          r.readAsDataURL(file);
        });

        const warnings = onValidate(parsed);

        if (warnings.length === 0) {
          onParsed(parsed, imageDataUrl);
        } else {
          newPending.push({ parsed, imageDataUrl, warnings, fileName: file.name });
        }
      }

      setProgress(null);
      if (newPending.length > 0) {
        setPendingItems((prev) => [...prev, ...newPending]);
      }
    },
    [onValidate, onParsed]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      try {
        await processFiles(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : '読み取りに失敗しました');
        setProgress(null);
      }
    },
    [processFiles]
  );

  const handleConfirmItem = useCallback(
    (item: PendingItem) => {
      onParsed(item.parsed, item.imageDataUrl);
      setPendingItems((prev) => prev.filter((p) => p !== item));
    },
    [onParsed]
  );

  const handleSkipItem = useCallback((item: PendingItem) => {
    setPendingItems((prev) => prev.filter((p) => p !== item));
  }, []);

  const handleConfirmAll = useCallback(() => {
    pendingItems.forEach((item) => onParsed(item.parsed, item.imageDataUrl));
    setPendingItems([]);
  }, [pendingItems, onParsed]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">レシートを読み込む</h2>

      {/* 警告確認パネル */}
      {pendingItems.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-semibold text-amber-800">
                {pendingItems.length}件のレシートに警告があります
              </p>
            </div>
            <button
              onClick={handleConfirmAll}
              className="text-xs px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
            >
              すべて追加
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {pendingItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-amber-100 p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">{item.fileName}</p>
                <ul className="text-xs text-amber-700 mb-2 space-y-0.5">
                  {item.warnings.map((w, wi) => (
                    <li key={wi}>・{w}</li>
                  ))}
                </ul>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleSkipItem(item)}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    スキップ
                  </button>
                  <button
                    onClick={() => handleConfirmItem(item)}
                    className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors font-medium"
                  >
                    追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アップロードエリア */}
      <label
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
          disabled={progress !== null}
        />

        {progress !== null ? (
          <div className="flex flex-col items-center gap-3 w-full px-8">
            <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-indigo-600 font-medium">
              Claude AIが解析中... ({progress.current}/{progress.total})
            </p>
            <div className="w-full bg-indigo-100 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="font-medium">クリックまたはドラッグ＆ドロップ</p>
            <p className="text-sm text-gray-400">複数ファイル同時選択可 · JPEG・PNG・WebP（最大10MB/枚）</p>
          </div>
        )}
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
