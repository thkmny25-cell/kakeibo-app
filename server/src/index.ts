import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// メモリストレージでファイルを一時保持
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// レシート解析エンドポイント
app.post('/api/parse-receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: '画像ファイルが必要です' });
    return;
  }

  const base64Image = req.file.buffer.toString('base64');
  const mediaType = req.file.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const prompt = `このレシート画像を解析して、以下のJSON形式で返してください。
説明文は不要です。JSONのみを返してください。

{
  "store": "店舗名（不明な場合は空文字）",
  "date": "日付（YYYY-MM-DD形式。不明な場合は今日の日付）",
  "items": [
    {
      "name": "商品名",
      "price": 金額（数値のみ、税込み）,
      "category": "カテゴリ"
    }
  ]
}

カテゴリは必ず以下のいずれかを使用してください：
食費、外食、日用品、交通費、娯楽、医療、衣類、その他

分類の基準：
- 食費：スーパー・コンビニ・食料品
- 外食：レストラン・カフェ・ファストフード
- 日用品：洗剤・シャンプー・ティッシュなど生活消耗品
- 交通費：電車・バス・タクシー・ガソリン
- 娯楽：映画・書籍・ゲーム・趣味用品
- 医療：薬・病院・医療用品
- 衣類：洋服・靴・アクセサリー
- その他：上記に当てはまらないもの`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      res.status(500).json({ error: 'レシートの解析に失敗しました' });
      return;
    }

    // JSONブロックを抽出して解析
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'JSONの解析に失敗しました', raw: textContent.text });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    res.status(500).json({ error: `Claude APIエラー: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
