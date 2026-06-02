export type Category = '食費' | '外食' | '日用品' | '交通費' | '娯楽' | '医療' | '衣類' | 'その他';

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  date: string;
  store: string;
  receiptId: string;
}

export interface Receipt {
  id: string;
  store: string;
  date: string;
  items: ExpenseItem[];
  imagePreview?: string;
  createdAt: string;
}

// Claude APIから返されるレシート解析結果
export interface ParsedReceipt {
  store: string;
  date: string;
  items: {
    name: string;
    price: number;
    category: Category;
  }[];
}

export const CATEGORIES: Category[] = ['食費', '外食', '日用品', '交通費', '娯楽', '医療', '衣類', 'その他'];

export const CATEGORY_COLORS: Record<Category, string> = {
  食費: '#FF6384',
  外食: '#FF9F40',
  日用品: '#FFCD56',
  交通費: '#4BC0C0',
  娯楽: '#9966FF',
  医療: '#36A2EB',
  衣類: '#FF8C94',
  その他: '#C9CBCF',
};
