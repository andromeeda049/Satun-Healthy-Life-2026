
import { GoogleGenAI, Type } from "@google/genai";
import { NutrientInfo, LocalFoodSuggestion, UserProfile, SpecialistId, FoodHistoryEntry, MealPlan, PlannerResults } from '../types';
import { SPECIALIST_TEAM } from "../constants";

/**
 * Utility to ensure the image is in a supported format for Gemini API.
 */
export const validateMimeType = (mimeType: string): string => {
  const supported = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  return supported.includes(mimeType) ? mimeType : 'image/jpeg'; 
};

// Schema for Food Analysis
const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER, description: "แคลอรี่รวมของอาหาร (เฉพาะตัวเลข)" },
    description: { type: Type.STRING, description: "ชื่อเมนูอาหารภาษาไทยสั้นๆ" },
    healthImpact: { type: Type.STRING, description: "สรุปผลต่อสุขภาพสั้นๆ" },
    isHealthyChoice: { type: Type.BOOLEAN, description: "มื้อนี้เป็นอาหารเพื่อสุขภาพ (เน้นผัก/ผลไม้/โปรตีนไขมันต่ำ) หรือไม่" },
    verification: {
      type: Type.OBJECT,
      properties: {
        isFood: { type: Type.BOOLEAN, description: "ภาพนี้คืออาหารจริงหรือไม่" },
        isLikelyOriginal: { type: Type.BOOLEAN, description: "เป็นภาพถ่ายจริงหรือไม่" }
      },
      required: ['isFood', 'isLikelyOriginal']
    },
    lifestyleAnalysis: {
        type: Type.OBJECT,
        properties: {
            nutrition: { type: Type.STRING },
            physicalActivity: { type: Type.STRING },
            sleep: { type: Type.STRING },
            stress: { type: Type.STRING },
            substance: { type: Type.STRING },
            social: { type: Type.STRING },
            overallRisk: { type: Type.STRING }
        }
    }
  },
  required: ['calories', 'description', 'isHealthyChoice', 'verification']
};

const CLEAN_FORMAT_INSTRUCTION = "คำสั่งจัดรูปแบบ: ให้ตอบเป็นข้อๆ โดยใช้ตัวเลขนำหน้า (1., 2., 3., ...) เท่านั้น ห้ามใช้เครื่องหมาย Markdown เช่น ### หรือ ** โดยเด็ดขาด ให้ใช้เพียงข้อความธรรมดาและการขึ้นบรรทัดใหม่เพื่อให้จัดระเบียบง่ายและกระชับ";

export const analyzeFoodFromImage = async (base64Image: string, mimeType: string, systemInstruction?: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const safeMimeType = validateMimeType(mimeType);

  const config: any = {
    responseMimeType: 'application/json',
    responseSchema: foodAnalysisSchema,
  };
  if (systemInstruction) config.systemInstruction = `${systemInstruction}\n${CLEAN_FORMAT_INSTRUCTION}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Image, mimeType: safeMimeType } },
          { text: "วิเคราะห์ภาพอาหารนี้ ให้ชื่อเมนู (description) และแคลอรี่ (calories) เสมอ ตรวจสอบว่าเป็นอาหารเพื่อสุขภาพหรือไม่ (isHealthyChoice). Return JSON." }
        ]
      }],
      config: config
    });
    
    if (!response.text) throw new Error('AI No Response');
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw error;
  }
};

export const analyzeFoodFromText = async (text: string, systemInstruction?: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const config: any = {
    responseMimeType: 'application/json',
    responseSchema: foodAnalysisSchema,
  };
  if (systemInstruction) config.systemInstruction = `${systemInstruction}\n${CLEAN_FORMAT_INSTRUCTION}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `วิเคราะห์สารอาหารจากชื่อเมนู: "${text}". ให้ชื่อเมนูและแคลอรี่ Return JSON.`,
      config: config
    });
    return JSON.parse(response.text);
  } catch (error) {
    throw new Error('ไม่สามารถวิเคราะห์ข้อความได้');
  }
};

export const getHealthCoachingTip = async (data: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ให้คำแนะนำสุขภาพเป็นภาษาไทยจากข้อมูลนี้: ${JSON.stringify(data)}. ${CLEAN_FORMAT_INSTRUCTION}`,
    });
    return response.text;
  } catch (error) {
    return "ขออภัย ระบบไม่พร้อมใช้งานในขณะนี้";
  }
};

export const generateProactiveInsight = async (data: any, systemInstruction?: string): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `สรุปข้อมูลสุขภาพสั้นๆ สำหรับคุณ ${data.userName}. ${CLEAN_FORMAT_INSTRUCTION}`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        message: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["info", "warning"] }
                    },
                    required: ["title", "message", "type"]
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        return { title: "สวัสดี", message: "บันทึกข้อมูลเพื่อรับคำแนะนำ", type: "info" };
    }
};

// Generic helper for calories (existing)
export const estimateExerciseCalories = async (activityName: string, durationMinutes: number): Promise<number> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Estimate calories for: "${activityName}" duration ${durationMinutes} min. Return JSON {"calories": number}.`,
      config: { responseMimeType: 'application/json' }
    });
    const result = JSON.parse(response.text);
    return result.calories || 0;
  } catch (error) { return 0; }
};

// Fix: Added missing export extractHealthDataFromImage used in ActivityTracker.tsx
export const extractHealthDataFromImage = async (base64Image: string, mimeType: string, type: 'activity' | 'food'): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const safeMimeType = validateMimeType(mimeType);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: base64Image, mimeType: safeMimeType } },
          { text: `Extract health information from this ${type} image (screenshot). Look for: activity name or menu name, calories, steps, duration (min), distance (km), and date (YYYY-MM-DD) shown on screen. Return JSON.` }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            steps: { type: Type.NUMBER },
            duration: { type: Type.NUMBER },
            distance: { type: Type.NUMBER },
            detectedDate: { type: Type.STRING }
          }
        }
      }
    });
    if (!response.text) return {};
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return {};
  }
};

// Fix: Added missing export getLocalFoodSuggestions used in FoodAnalyzer.tsx
export const getLocalFoodSuggestions = async (lat: number, lng: number): Promise<LocalFoodSuggestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Recommend 3 healthy local dishes in Satun, Thailand near coordinates (${lat}, ${lng}). Return JSON as array of objects with name, description, and calories.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              calories: { type: Type.NUMBER }
            },
            required: ['name', 'description', 'calories']
          }
        }
      }
    });
    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Local Suggestions Error:", error);
    return [];
  }
};

export const generateMealPlan = async (results: any, cuisine: string, diet: string, healthCondition: string, lifestyleGoal: string, foodHistory: any[], systemInstruction?: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `สร้างแผนอาหาร 7 วัน สำหรับความต้องการ ${results.tdee} kcal. Return JSON.`,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
  } catch (error) { throw new Error('ล้มเหลว'); }
};
