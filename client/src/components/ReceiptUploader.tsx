import { useState, useCallback } from 'react';
import type { ParsedReceipt } from '../types';

interface Props {
  onParsed: (receipt: ParsedReceipt, imagePreview: string) => void;
}

export function ReceiptUploader({ onParsed }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }

      setError(null);
      setIsLoading(true);

      // プレビュー生成
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('receipt', file);

      const res = await fetch('/api/parse-receipt', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'サーバーエラーが発生しました');
      }
      const parsed: ParsedReceipt = await res.json();

      const imageDataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.readAsDataURL(file);
      });

      onParsed(parsed, imageDataUrl);
      setPreview(null);
      setIsLoading(false);
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        try {
          await processFile(file);
        } catch (err) {
          setError(err instanceof Error ? err.message : '読み取りに失敗しました');
          setIsLoading(false);
        }
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          await processFile(file);
        } catch (err) {
          setError(err instanceof Error ? err.message : '読み取りに失敗しました');
          setIsLoading(false);
        }
      }
      e.target.value = '';
    },
    [processFile]
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">レシートを読み込む</h2>

      <label
        className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-indigo-600 font-medium">Claude AIが解析中...</p>
          </div>
        ) : preview ? (
          <img src={preview} alt="プレビュー" className="h-40 object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="font-medium">クリックまたはドラッグ＆ドロップ</p>
            <p className="text-sm text-gray-400">JPEG・PNG・WebP対応（最大10MB）</p>
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
