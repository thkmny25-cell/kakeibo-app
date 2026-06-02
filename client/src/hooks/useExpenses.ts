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

  return {
    receipts,
    allItems,
    categoryTotals,
    monthlyTotals,
    addReceipt,
    deleteReceipt,
    deleteItem,
  };
}
