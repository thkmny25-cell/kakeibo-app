import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Receipt, ExpenseItem, ParsedReceipt } from '../types';

const STORAGE_KEY = 'kakeibo_receipts';

export function useExpenses() {
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // レシートが更新されるたびにlocalStorageへ同期
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  const addReceipt = useCallback((parsed: ParsedReceipt, imagePreview?: string) => {
    const receiptId = uuidv4();
    const items: ExpenseItem[] = parsed.items.map((item) => ({
      id: uuidv4(),
      name: item.name,
      price: item.price,
      category: item.category,
      date: parsed.date,
      store: parsed.store,
      receiptId,
    }));

    const newReceipt: Receipt = {
      id: receiptId,
      store: parsed.store,
      date: parsed.date,
      items,
      imagePreview,
      createdAt: new Date().toISOString(),
    };

    setReceipts((prev) => [newReceipt, ...prev]);
    return newReceipt;
  }, []);

  const deleteReceipt = useCallback((receiptId: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    setReceipts((prev) =>
      prev.map((r) => ({
        ...r,
        items: r.items.filter((i) => i.id !== itemId),
      })).filter((r) => r.items.length > 0)
    );
  }, []);

  // 全支出アイテムをフラットに取得
  const allItems = receipts.flatMap((r) => r.items);

  // カテゴリ別集計
  const categoryTotals = allItems.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.price;
      return acc;
    },
    {} as Record<string, number>
  );

  // 月別集計（直近6ヶ月）
  const monthlyTotals = allItems.reduce(
    (acc, item) => {
      const month = item.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + item.price;
      return acc;
    },
    {} as Record<string, number>
  );

  const validateReceipt = useCallback((parsed: ParsedReceipt): string[] => {
    const warnings: string[] = [];

    // 負の金額チェック
    const negativeItems = parsed.items.filter((i) => i.price < 0);
    if (negativeItems.length > 0) {
      const detail = negativeItems.map((i) => `${i.name}（¥${i.price.toLocaleString()}）`).join('、');
      warnings.push(`負の金額の項目があります: ${detail}`);
    }

    // 同一日付・同一合計金額の重複チェック
    const newTotal = parsed.items.reduce((s, i) => s + i.price, 0);
    const duplicate = receipts.find((r) => {
      const existingTotal = r.items.reduce((s, i) => s + i.price, 0);
      return r.date === parsed.date && existingTotal === newTotal;
    });
    if (duplicate) {
      warnings.push(
        `同じ日付（${parsed.date}）・合計金額（¥${newTotal.toLocaleString()}）のレシートが既に登録されています（${duplicate.store || '店舗不明'}）`
      );
    }

    return warnings;
  }, [receipts]);

  return {
    receipts,
    allItems,
    categoryTotals,
    monthlyTotals,
    addReceipt,
    deleteReceipt,
    deleteItem,
    validateReceipt,
  };
}
