import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';

const app = express();
const PORT = 3000;

// Support large payloads for PDF and image uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: !!apiKey });
});

// Extract text from DOCX base64 if needed
async function extractDocxText(base64Data: string): Promise<string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    console.error('Error extracting docx text:', err);
    throw new Error('Không thể đọc nội dung file Word (.docx). Vui lòng thử lại.');
  }
}

// API endpoint to generate quizzes
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const {
      grade = 'Lớp 5',
      subject = 'Toán',
      numQuestions = 10,
      difficulty = 'Tổng hợp 4 mức độ',
      questionType = 'all', // 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'all'
      textContent = '',
      fileData = null, // { base64: string, mimeType: string, fileName: string }
      topicHint = '',
    } = req.body;

    let extractedText = textContent || '';
    const contents: any[] = [];

    // Check if docx
    if (fileData && fileData.base64) {
      const isDocx =
        fileData.mimeType.includes('word') ||
        fileData.mimeType.includes('officedocument') ||
        fileData.fileName?.endsWith('.docx');

      if (isDocx) {
        const docxText = await extractDocxText(fileData.base64);
        extractedText = (extractedText ? extractedText + '\n\n' : '') + docxText;
      } else if (fileData.mimeType.startsWith('image/') || fileData.mimeType === 'application/pdf') {
        // Direct multimodal inlineData to Gemini
        contents.push({
          inlineData: {
            data: fileData.base64,
            mimeType: fileData.mimeType,
          },
        });
      }
    }

    const typeRequirement = {
      multiple_choice: 'Tất cả các câu hỏi đều là dạng Trắc nghiệm 4 lựa chọn (A, B, C, D) có 1 đáp án đúng duy nhất.',
      matching: 'Tất cả các câu hỏi đều là dạng Nối 2 cột (Ghép vế cột A với vế tương ứng ở cột B, 3-4 cặp nối/câu).',
      fill_blank: 'Tất cả các câu hỏi đều là dạng Điền từ/số vào chỗ chấm (...).',
      true_false: 'Tất cả các câu hỏi đều là dạng Đúng / Sai (Đ/S) với 2-4 nhận định cho mỗi câu.',
      all: 'ĐA DẠNG ĐỦ CÁC DẠNG TRẮC NGHIỆM: Trắc nghiệm 4 lựa chọn (A, B, C, D), Nối cột (matching), Điền vào chỗ chấm (fill_blank), và Đúng/Sai (true_false). Phân bổ hợp lý, sinh động cho học sinh.',
    }[questionType as 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'all'] || 'Đa dạng các dạng trắc nghiệm phù hợp tiểu học.';

    const systemPrompt = `Bạn là chuyên gia sư phạm tiểu học và giáo viên giỏi theo chương trình Giáo dục Phổ thông Việt Nam (sách Kết nối tri thức, Chân trời sáng tạo, Cánh diều).
Nhiệm vụ của bạn là tạo một bộ đề bài tập trắc nghiệm chất lượng cao, chuẩn mực tiếng Việt, sinh động, phù hợp tâm lý lứa tuổi học sinh tiểu học.

YÊU CẦU ĐẶC BIỆT:
1. Đối tượng: Học sinh ${grade}.
2. Môn học: ${subject}.
3. Số lượng câu hỏi: Đúng ${numQuestions} câu hỏi.
4. Mức độ câu hỏi: ${difficulty} (Mức 1: Nhận biết, Mức 2: Thông hiểu, Mức 3: Vận dụng, Mức 4: Vận dụng cao theo Thông tư 27/22 BGDĐT).
5. Dạng câu hỏi: ${typeRequirement}
6. Định dạng Tiếng Việt và Toán học:
   - Sử dụng tiếng Việt chuẩn xác, từ ngữ trong sáng, không viết tắt cẩu thả.
   - Các biểu thức toán học, số đo, phân số, diện tích cần viết chuẩn, rõ ràng, dễ đọc cho học sinh tiểu học (ví dụ: phân số viết dạng 3/4, diện tích viết cm², m², thể tích dm³, phép tính dùng dấu × và ÷ hoặc + -). Không sử dụng mã LaTeX phức tạp khiến học sinh khó đọc; biểu diễn dễ hiểu như "1/2", "3,5 m²", "x × 4 = 28".
7. Lời giải và giải thích: Mỗi câu hỏi PHẢI có phần giải thích chi tiết (explanation) ân cần, dễ hiểu như lời cô giáo giảng bài ("Em hãy nhớ lại: ...", "Cách tính: ...").
${topicHint ? `8. Yêu cầu/chủ đề bổ sung: ${topicHint}` : ''}

CẤU TRÚC JSON PHẢI TRẢ VỀ (CHỈ TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ TEXT THỪA NGOÀI JSON):
{
  "title": "Tên bài kiểm tra/chủ đề sinh động (ví dụ: Bài tập trắc nghiệm Ôn tập Toán Lớp 5)",
  "grade": "${grade}",
  "subject": "${subject}",
  "totalQuestions": ${numQuestions},
  "durationMinutes": ${Math.max(15, numQuestions * 2)},
  "summary": "Tóm tắt ngắn gọn mục tiêu kiến thức của bài tập",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "matching" | "fill_blank" | "true_false",
      "level": "Mức 1" | "Mức 2" | "Mức 3" | "Mức 4",
      "question": "Nội dung câu hỏi rõ ràng, sư phạm",
      "points": 1,
      // NẾU type == 'multiple_choice':
      "options": [
        {"id": "A", "text": "Lựa chọn A"},
        {"id": "B", "text": "Lựa chọn B"},
        {"id": "C", "text": "Lựa chọn C"},
        {"id": "D", "text": "Lựa chọn D"}
      ],
      "correctAnswer": "A", // hoặc "B", "C", "D"

      // NẾU type == 'matching' (nối cột):
      "matchingPairs": [
        {"id": "m1", "left": "Vế cột A thứ 1", "right": "Vế cột B tương ứng thứ 1"},
        {"id": "m2", "left": "Vế cột A thứ 2", "right": "Vế cột B tương ứng thứ 2"},
        {"id": "m3", "left": "Vế cột A thứ 3", "right": "Vế cột B tương ứng thứ 3"}
      ],

      // NẾU type == 'fill_blank':
      "blankText": "Đoạn văn hoặc phép tính có chỗ trống biểu thị bằng [...] ví dụ: Muốn tính chu vi hình vuông ta lấy [...] nhân với 4.",
      "acceptableAnswers": ["độ dài một cạnh", "cạnh", "một cạnh"],

      // NẾU type == 'true_false':
      "tfStatements": [
        {"id": "tf1", "statement": "Nhận định thứ nhất", "isTrue": true},
        {"id": "tf2", "statement": "Nhận định thứ hai", "isTrue": false}
      ],

      "hint": "Gợi ý nhỏ nếu học sinh chưa nghĩ ra",
      "explanation": "Lời giải chi tiết từng bước, lý do vì sao chọn đáp án đó, nhắc lại công thức/quy tắc ngữ pháp/kiến thức liên quan."
    }
  ]
}`;

    const promptText = `Dựa trên tài liệu / nội dung sau đây (nếu không có tài liệu đính kèm, hãy biên soạn một bộ câu hỏi chuẩn chương trình ${grade} môn ${subject}):
${extractedText ? `NỘI DUNG TÀI LIỆU:\n"""\n${extractedText}\n"""` : `Hãy tạo bộ câu hỏi bám sát chuẩn kiến thức kĩ năng ${grade} môn ${subject}.`}

Hãy xuất file JSON đúng theo cấu trúc đã yêu cầu ở trên.`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '{}';
    let parsedQuiz;
    try {
      parsedQuiz = JSON.parse(jsonText);
    } catch (e) {
      // If there are markdown formatting ticks
      const clean = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedQuiz = JSON.parse(clean);
    }

    res.json({
      success: true,
      quiz: parsedQuiz,
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Có lỗi xảy ra khi tạo câu hỏi trắc nghiệm. Vui lòng thử lại.',
    });
  }
});

// Configure Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
