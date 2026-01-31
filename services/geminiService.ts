
import { GoogleGenAI, Type } from "@google/genai";
import { NutrientInfo, LocalFoodSuggestion, UserProfile, SpecialistId, FoodHistoryEntry, MealPlan, PlannerResults } from '../types';
import { SPECIALIST_TEAM } from "../constants";

const API_ERROR_MESSAGE = "ฟีเจอร์ AI ใช้งานแบบจำกัด กรุณารอสักครู่";

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
    protein: { type: Type.NUMBER, description: "โปรตีน (กรัม) โดยประมาณ" },
    carbohydrates: { type: Type.NUMBER, description: "คาร์โบไฮเดรต (กรัม) โดยประมาณ" },
    fat: { type: Type.NUMBER, description: "ไขมัน (กรัม) โดยประมาณ" },
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
  required: ['calories', 'protein', 'carbohydrates', 'fat', 'description', 'isHealthyChoice', 'verification']
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
          { text: "วิเคราะห์ภาพอาหารนี้ ให้ชื่อเมนู (description), แคลอรี่ (calories), โปรตีน (protein), คาร์โบไฮเดรต (carbohydrates), ไขมัน (fat) และตรวจสอบว่าเป็นอาหารเพื่อสุขภาพหรือไม่ (isHealthyChoice). Return JSON." }
        ]
      }],
      config: config
    });
    
    if (!response.text) throw new Error('AI No Response');
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(API_ERROR_MESSAGE);
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
      contents: `วิเคราะห์สารอาหารจากชื่อเมนู: "${text}". ให้ชื่อเมนู, แคลอรี่, โปรตีน, คาร์บ, ไขมัน Return JSON.`,
      config: config
    });
    return JSON.parse(response.text);
  } catch (error) {
    throw new Error(API_ERROR_MESSAGE);
  }
};

export const getHealthCoachingTip = async (data: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Find Specialist Data
  const specialist = SPECIALIST_TEAM.find(s => s.id === data.specialistId);
  const specialistName = specialist?.name || "AI Coach";
  const role = specialist?.role || "General Wellness";
  
  const userContext = `
    User Profile: Age ${data.userProfile?.age}, Gender ${data.userProfile?.gender}, BMI ${data.bmi?.value?.toFixed(1) || '-'}, TDEE ${data.tdee?.value?.toFixed(0) || '-'}.
    Health Condition: ${data.userProfile?.healthCondition || 'None'}.
    Recent Water Intake: ${data.waterIntake} ml.
    Recent Food: ${data.food?.description || 'No recent log'}.
  `;

  // --- Dynamic Persona Construction based on Department of Health Guidelines ---
  let specificInstructions = "";
  
  if (data.specialistId === 'nutritionist') {
      specificInstructions = `
      Persona: You are a strict but encouraging Nutritionist following Thai Department of Health standards.
      MANDATORY: Always reference the "2:1:1 Formula" (Vegetables 2 : Rice 1 : Meat 1) in your advice.
      Keywords to use: "ลดหวาน มัน เค็ม" (Reduce Sweet, Oily, Salty).
      `;
  } else if (data.specialistId === 'trainer') {
      specificInstructions = `
      Persona: You are a certified Physical Trainer adhering to WHO/Thai Health guidelines.
      MANDATORY: Reference the standard of "150 minutes per week" of moderate-intensity activity.
      Encourage consistency over intensity for beginners.
      `;
  } else if (data.specialistId === 'ncd_doctor') {
      specificInstructions = `
      Persona: You are a medical doctor specializing in NCDs (Diabetes, Hypertension).
      MANDATORY: Emphasize "Medication Adherence" (การกินยาต่อเนื่อง ห้ามหยุดยาเอง).
      Advise on preparation for doctor visits (fasting food/water for blood tests).
      Tone: Professional, caring, authoritative yet accessible.
      `;
  } else if (data.specialistId === 'psychologist') {
      specificInstructions = `
      Persona: You are a mental health counselor.
      Focus: Stress management, sleep hygiene, and emotional well-being.
      `;
  }

  // --- 5A Model Logic for Quitting Plan ---
  let quittingInstruction = "";
  const isQuittingTopic = data.focusTopic && (data.focusTopic.includes('เลิก') || data.focusTopic.includes('Quitting') || data.focusTopic.includes('บุหรี่') || data.focusTopic.includes('สุรา'));
  
  if (isQuittingTopic) {
      quittingInstruction = `
      CRITICAL: The user is asking about Quitting Smoking or Alcohol.
      You MUST structure your response using the "5A Model" (Ask, Advise, Assess, Assist, Arrange).
      
      Structure your response exactly like this:
      1. **Ask/Advise**: Acknowledge their intention and strongly advise quitting for their health.
      2. **Assess**: Ask them to reflect on their readiness (e.g., "Are you ready to set a quit date?").
      3. **Assist**: Give ONE specific tip to cope with cravings (e.g., drink water, deep breathing).
      4. **Arrange**: Suggest calling the hotline (1600 for Smoking, 1413 for Alcohol) if they need more help.
      
      Keep it concise but empathetic.
      `;
  }

  let prompt = `
    Act as ${specialistName} (${role}).
    ${specificInstructions}
    ${quittingInstruction}
    
    ${data.focusTopic ? `Focus STRICTLY on this topic: "${data.focusTopic}".` : `Provide general advice based on the user's data.`}
    
    Context: ${userContext}
    
    Task: Give a short, actionable advice (max 4 sentences) in Thai.
    ${CLEAN_FORMAT_INSTRUCTION}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || API_ERROR_MESSAGE;
  } catch (error) {
    return API_ERROR_MESSAGE;
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
        return { title: "แจ้งเตือน", message: API_ERROR_MESSAGE, type: "info" };
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
  } catch (error) { 
      console.error(error);
      throw new Error(API_ERROR_MESSAGE);
  }
};

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
    throw new Error(API_ERROR_MESSAGE);
  }
};

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
    throw new Error(API_ERROR_MESSAGE);
  }
};

export const generateMealPlan = async (
    results: any, 
    cuisine: string, 
    diet: string, 
    healthCondition: string, 
    lifestyleGoal: string, 
    userGoals: any[], // NEW: User defined goals
    recentContext: any, // NEW: Summarized recent behavior
    systemInstruction?: string
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mealSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        breakfast: {
          type: Type.OBJECT,
          properties: {
            menu: { type: Type.STRING },
            calories: { type: Type.NUMBER }
          },
          required: ['menu', 'calories']
        },
        lunch: {
          type: Type.OBJECT,
          properties: {
            menu: { type: Type.STRING },
            calories: { type: Type.NUMBER }
          },
          required: ['menu', 'calories']
        },
        dinner: {
          type: Type.OBJECT,
          properties: {
            menu: { type: Type.STRING },
            calories: { type: Type.NUMBER }
          },
          required: ['menu', 'calories']
        },
        nutritionTip: { type: Type.STRING, description: "คำแนะนำลดหวาน มัน เค็ม สำหรับวันนี้" },
        fruitVegGoal: { type: Type.STRING, description: "เป้าหมายการกินผักผลไม้" },
        activity: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            intensity: { type: Type.STRING }
          },
          required: ['name', 'durationMinutes', 'intensity']
        },
        wellness: {
            type: Type.OBJECT,
            properties: {
                sleep: { type: Type.STRING },
                stress: { type: Type.STRING }
            },
            required: ['sleep', 'stress']
        },
        avoidance: { type: Type.STRING, description: "สิ่งที่ควรงด (เหล้า/บุหรี่/พฤติกรรมเสี่ยง)" }
      },
      required: ['day', 'breakfast', 'lunch', 'dinner', 'nutritionTip', 'fruitVegGoal', 'activity', 'wellness', 'avoidance']
    }
  };

  const goalsString = userGoals.map(g => `${g.type}: ${g.targetValue}`).join(", ");
  const contextString = `
    Recent Sleep Avg: ${recentContext.avgSleep || '-'} hrs
    Recent Stress Avg: ${recentContext.avgStress || '-'}/10
    Recent Activity Level: ${recentContext.activityStatus || 'Normal'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `สร้างแผนสุขภาพองค์รวม 7 วัน (Holistic Health Plan) โดยคำนวณจาก:
      - พลังงานเป้าหมาย: ${results.tdee} kcal/day
      - ความชอบอาหาร: ${cuisine}
      - รูปแบบการกิน: ${diet}
      - เงื่อนไขสุขภาพหลัก: ${healthCondition}
      - เป้าหมายไลฟ์สไตล์: ${lifestyleGoal}
      
      *** ข้อมูลส่วนบุคคลเพิ่มเติม (สำคัญมาก):
      - เป้าหมายของผู้ใช้ (User Goals): ${goalsString || "ไม่มี"}
      - บริบทพฤติกรรมล่าสุด (Recent Context): ${contextString}

      คำสั่งเฉพาะ (Specific Instructions):
      1. อาหาร: ต้องสอดคล้องกับ "User Goals" (เช่น ถ้ามีเป้าหมายลดความดัน ให้จัดอาหาร DASH Diet ลดเค็ม, ถ้าคุมเบาหวาน ให้ลดแป้ง/น้ำตาล)
      2. ปรับตามพฤติกรรม: ถ้า Recent Context แจ้งว่านอนน้อย ให้แนะนำการนอนเพิ่ม ถ้าเครียดสูง ให้แนะนำวิธีผ่อนคลายในช่อง wellness
      3. หลักการพื้นฐาน: เน้น "ลดหวาน มัน เค็ม", "เพิ่มผักผลไม้", "งดแอลกอฮอล์/บุหรี่"
      4. กิจกรรม: ระบุเวลา (นาที) ที่เหมาะสมกับสภาพร่างกายและเป้าหมาย
      
      ตอบกลับเป็น JSON Array 7 วัน`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: mealSchema
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) { 
    console.error("Generate Meal Plan Error:", error);
    throw new Error(API_ERROR_MESSAGE); 
  }
};
