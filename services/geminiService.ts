
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, Client, AIRecommendation, AnalysisResult, SocialStrategy } from "../types";

let dynamicApiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
  dynamicApiKey = key;
};

const getAI = () => {
  const apiKey = dynamicApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === 'MASUKKAN_API_KEY_GEMINI_ANDA') {
    throw new Error("Gemini API Key tidak ditemukan. Silakan atur di Pengaturan atau Environment Variable.");
  }
  return new GoogleGenAI({ apiKey });
};

export const optimizeMenuDescription = async (itemName: string, currentDesc: string, ingredients: string[] = []) => {
  const ai = getAI();
  const context = ingredients.length > 0 ? `\nBahan baku utama: ${ingredients.join(', ')}` : '';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Nama Hidangan: ${itemName}\nDeskripsi Saat Ini: ${currentDesc}${context}`,
    config: {
      systemInstruction: "Anda adalah copywriter kuliner kelas dunia untuk layanan katering mewah. Tugas Anda adalah menulis deskripsi hidangan agar sangat menggugah selera. Jika deskripsi kosong, buatlah baru berdasarkan nama dan bahan. Jika sudah ada, poles menjadi lebih elegan. Gunakan Bahasa Indonesia yang puitis dan profesional (maksimal 3 kalimat).",
      temperature: 0.9,
    },
  });
  return response.text;
};

export const analyzeMenuAppeal = async (item: MenuItem) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Menu: ${item.name}\nDeskripsi: ${item.description}\nHarga: Rp ${item.price.toLocaleString()}`,
    config: {
      systemInstruction: "Anda adalah konsultan pemasaran katering elit. Analisis menu ini dan berikan output JSON: 1. targetAudience (segmen pasar), 2. sellingPoints (poin keunggulan), 3. upsellTip (rekomendasi pairing), 4. gourmetHook (satu kalimat puitis untuk pelanggan).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetAudience: { type: Type.STRING },
          sellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          upsellTip: { type: Type.STRING },
          gourmetHook: { type: Type.STRING }
        },
        required: ["targetAudience", "sellingPoints", "upsellTip", "gourmetHook"]
      }
    },
  });
  return JSON.parse(response.text || "{}");
};

export const generateSocialStrategy = async (topItems: MenuItem[]): Promise<SocialStrategy[]> => {
  const ai = getAI();
  const itemsText = topItems.map(i => `${i.name} (${i.salesCount} terjual)`).join(", ");
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Menu Terlaris: ${itemsText}`,
    config: {
      systemInstruction: "Anda adalah ahli strategi media sosial untuk bisnis katering. Berikan 3 ide konten promosi untuk Instagram, TikTok, dan WhatsApp Status berdasarkan menu terlaris tersebut. Berikan juga waktu posting terbaik dan draf caption yang menarik perhatian dalam Bahasa Indonesia.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            contentIdea: { type: Type.STRING },
            bestTimeToPost: { type: Type.STRING },
            suggestedCaption: { type: Type.STRING }
          },
          required: ["platform", "contentIdea", "bestTimeToPost", "suggestedCaption"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const generatePromoImage = async (itemName: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-end, professional food photography of ${itemName}. Luxury catering presentation, elegant lighting, bokeh background, commercial food styling, vibrant colors, 4k resolution.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      },
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Gagal menghasilkan gambar");
};

export const generateCollectionPitch = async (customerName: string, amountDue: number, daysOverdue: number) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Pelanggan: ${customerName}\nJumlah Tunggakan: Rp ${amountDue.toLocaleString()}\nKeterlambatan: ${daysOverdue} hari`,
    config: {
      systemInstruction: "Anda adalah asisten keuangan katering profesional. Buatlah draf pesan penagihan (collection) yang sopan, elegan, namun tegas dalam Bahasa Indonesia. Fokus pada menjaga hubungan baik dengan pelanggan sambil meminta kepastian pembayaran.",
      temperature: 0.7,
    },
  });
  return response.text;
};

export const getSalesOutreachSuggestions = async (clients: Client[]): Promise<AIRecommendation[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Daftar Pelanggan: ${JSON.stringify(clients)}`,
    config: {
      systemInstruction: "Analisis data pelanggan katering ini. Berikan 3 rekomendasi pelanggan mana yang harus dihubungi hari ini dan apa isi pesannya (pitch).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            reason: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            pitch: { type: Type.STRING }
          },
          required: ["clientName", "reason", "suggestedAction", "pitch"]
        }
      }
    },
  });
  return JSON.parse(response.text || "[]");
};

export const analyzeStockFromText = async (text: string): Promise<AnalysisResult & { mrpStatus: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Laporan Stok: ${text}`,
    config: {
      systemInstruction: "Anda adalah asisten MRP katering. Analisis teks laporan stok yang diberikan. Identifikasi satu bahan utama yang paling krusial dari teks tersebut. Berikan output dalam format JSON dengan key: status (nama bahan), freshnessScore (0-100), diagnosis, estimatedQuantity, recommendations (array of strings), mrpStatus ('Aman', 'Menipis', atau 'Habis').",
      responseMimeType: "application/json",
    },
  });
  
  return JSON.parse(response.text || "{}");
};

export const analyzeKitchenStock = async (base64Data: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data.split(',')[1],
    },
  };
  
  const prompt = "Analisis stok dapur ini. Identifikasi nama bahan, estimasi jumlah, dan klasifikasikan status stok secara ketat ke salah satu dari: 'Aman', 'Menipis', atau 'Habis' berdasarkan apa yang terlihat. Berikan output dalam format JSON valid dengan key: status (nama bahan), freshnessScore (0-100), diagnosis, estimatedQuantity, recommendations (array of strings), mrpStatus ('Aman', 'Menipis', atau 'Habis').";

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, { text: prompt }] },
  });
  
  const cleanJson = (response.text || "{}").replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson || "{}");
};
