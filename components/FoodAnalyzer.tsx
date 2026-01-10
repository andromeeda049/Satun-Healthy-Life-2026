
import React, { useState, useRef, useContext } from 'react';
import { analyzeFoodFromImage, analyzeFoodFromText, getLocalFoodSuggestions } from '../services/geminiService';
import { NutrientInfo, FoodHistoryEntry, LocalFoodSuggestion } from '../types';
import { ShareIcon, CameraIcon, XCircleIcon, TrashIcon, EyeIcon, ChatBubbleLeftEllipsisIcon, MapPinIcon, StarIcon, InformationCircleIcon, ClipboardListIcon } from './icons';
import { AppContext } from '../context/AppContext';
import { XP_VALUES, PILLAR_LABELS } from '../constants';

const processImage = async (file: File): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1000;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve({
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg'
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const FoodAnalyzer: React.FC = () => {
  const [mode, setMode] = useState<'image' | 'text' | 'location'>('image');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<LocalFoodSuggestion[] | null>(null);
  const [result, setResult] = useState<NutrientInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { setLatestFoodAnalysis, foodHistory, setFoodHistory, currentUser, gainXP, userProfile } = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAnalyze = async () => {
    if (!image || currentUser?.role === 'guest') return;
    setLoading(true); setError(null); setResult(null); setInfo(null);
    try {
      const { base64, mimeType } = await processImage(image);
      const res = await analyzeFoodFromImage(base64, mimeType, userProfile.aiSystemInstruction);
      setResult(res); 
      saveResultToHistory(res);
      
      if (res.isHealthyChoice === false) {
          setInfo("🥗 มื้อนี้ควรเพิ่มผักผลไม้เพื่อสุขภาพที่ดีขึ้นนะครับ");
      }
    } catch (err: any) {
      setError("AI ล้มเหลวในการวิเคราะห์ภาพอาหาร กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim() || currentUser?.role === 'guest') return;
    setLoading(true); setError(null); setResult(null); setInfo(null);
    try {
        const res = await analyzeFoodFromText(inputText, userProfile.aiSystemInstruction);
        setResult(res); 
        saveResultToHistory(res);
        if (res.isHealthyChoice === false) {
            setInfo("🥗 ลองเพิ่มผักในมื้อถัดไปดูนะครับ");
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLocationAnalyze = () => {
    if (currentUser?.role === 'guest') return;
    setLoading(true); setSuggestions(null);
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const res = await getLocalFoodSuggestions(pos.coords.latitude, pos.coords.longitude);
                setSuggestions(res);
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        },
        () => { setError("ไม่สามารถเข้าถึงตำแหน่งได้"); setLoading(false); }
    );
  };
  
  const saveResultToHistory = (res: NutrientInfo) => {
    setLatestFoodAnalysis(res);
    const newEntry: FoodHistoryEntry = { 
        id: Date.now().toString(), 
        date: new Date().toISOString(), 
        analysis: res 
    };
    setFoodHistory(prev => [newEntry, ...prev].slice(0, 15));
    
    const xpAmount = res.isHealthyChoice ? XP_VALUES.FOOD * 2 : XP_VALUES.FOOD;
    gainXP(xpAmount, 'FOOD');
  };

  const getPillarLabel = (key: string) => {
      if (key === 'physicalActivity') return PILLAR_LABELS.activity;
      if (key === 'substance') return 'สารเสพติด/ความเสี่ยง';
      return PILLAR_LABELS[key as keyof typeof PILLAR_LABELS] || key;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">วิเคราะห์อาหาร & 6 เสาหลักสุขภาพ</h2>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            {(['image', 'text', 'location'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-3 text-sm font-bold transition-all ${mode === m ? 'border-b-4 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'image' ? 'ถ่ายภาพ' : m === 'text' ? 'พิมพ์ชื่อเมนู' : 'แนะนำใกล้ฉัน'}
                </button>
            ))}
        </div>

        {mode === 'image' && (
             <div className="flex flex-col gap-4 animate-fade-in">
                <div className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover rounded-2xl" /> : <div className="text-center"><CameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-2"/><p className="text-gray-400 font-medium">กดเพื่อเลือกภาพอาหาร</p></div>}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){setImage(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(null); setInfo(null);} }} className="hidden" />
                <button onClick={handleImageAnalyze} disabled={!image || loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'AI กำลังมองภาพอาหาร...' : 'เริ่มวิเคราะห์ด้วย AI'}
                </button>
            </div>
        )}

        {mode === 'text' && (
            <div className="flex flex-col gap-4 animate-fade-in">
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="เช่น 'กะเพราไก่ไข่ดาว ข้าวน้อย ไม่ใส่น้ำตาล'..." className="w-full h-32 p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                <button onClick={handleTextAnalyze} disabled={!inputText.trim() || loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                    {loading ? 'กำลังประมวลผลข้อความ...' : 'วิเคราะห์เมนูนี้'}
                </button>
            </div>
        )}

        {mode === 'location' && (
            <div className="text-center animate-fade-in space-y-4">
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <MapPinIcon className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">ค้นหาเมนูท้องถิ่นสุขภาพดีตามพิกัดของคุณ</p>
                </div>
                <button onClick={handleLocationAnalyze} disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all">
                    {loading ? 'กำลังค้นหาร้านค้า...' : 'ค้นหารอบตัวฉัน'}
                </button>
            </div>
        )}
        
        {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-3 animate-bounce-in">
                <XCircleIcon className="w-6 h-6" />
                <span>{error}</span>
            </div>
        )}

        {info && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold flex items-center gap-3">
                <InformationCircleIcon className="w-6 h-6" />
                <span>{info}</span>
            </div>
        )}

        {result && (
            <div className={`mt-8 p-6 rounded-2xl animate-fade-in border-2 shadow-inner ${result.isHealthyChoice ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}>
                <div className="text-center mb-6">
                    {result.isHealthyChoice && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg mb-4 animate-bounce">
                            <StarIcon className="w-3 h-3" />
                            HEALTHY CHOICE: BONUS XP!
                        </div>
                    )}
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{result.description}</h3>
                    <p className={`text-3xl font-black ${result.isHealthyChoice ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{result.calories} kcal</p>
                </div>
                
                {result.healthImpact && (
                    <div className="mb-6 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-white dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-relaxed italic">" {result.healthImpact} "</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.lifestyleAnalysis && Object.entries(result.lifestyleAnalysis).filter(([k, v]) => v && k !== 'overallRisk').map(([key, val]) => (
                        <div key={key} className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] text-indigo-500 font-black uppercase mb-1 tracking-widest">
                                {getPillarLabel(key)}
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-tight">{val as string}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* เพิ่มส่วนแสดงประวัติการวิเคราะห์ล่าสุด */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full">
            <div className="flex items-center gap-2 mb-4">
                <ClipboardListIcon className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">ประวัติการวิเคราะห์ล่าสุด</h3>
            </div>
            
            <div className="space-y-3">
                {foodHistory.length > 0 ? (
                    foodHistory.map((entry) => (
                        <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{entry.analysis.description}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-black ${entry.analysis.isHealthyChoice ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                        {entry.analysis.calories} kcal
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        • {new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                            {entry.analysis.isHealthyChoice && (
                                <StarIcon className="w-5 h-5 text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <InformationCircleIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">ยังไม่มีประวัติการวิเคราะห์</p>
                    </div>
                )}
            </div>
      </div>
    </div>
  );
};

export default FoodAnalyzer;
