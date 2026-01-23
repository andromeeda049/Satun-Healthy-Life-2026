
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { CalorieHistoryEntry } from '../types';
import { TrashIcon, BeakerIcon, CameraIcon, SparklesIcon, XIcon, StarIcon, InformationCircleIcon } from './icons';
import { XP_VALUES } from '../constants';
import { analyzeFoodFromImage } from '../services/geminiService';

const MAX_HISTORY_ITEMS = 100;

const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
};

const processImageForAI = async (file: File): Promise<{ base64: string, fullBase64: string, mimeType: string }> => {
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve({
        fullBase64: dataUrl,
        base64: dataUrl.split(',')[1],
        mimeType: 'image/jpeg'
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const CalorieTracker: React.FC = () => {
    const { calorieHistory, setCalorieHistory, tdeeHistory, gainXP, userProfile } = useContext(AppContext);
    
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    // New state for Macros
    const [customProtein, setCustomProtein] = useState('');
    const [customCarbs, setCustomCarbs] = useState('');
    const [customFat, setCustomFat] = useState('');

    const [customImage, setCustomImage] = useState<File | null>(null);
    const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
    const [processedBase64, setProcessedBase64] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isHealthyChoice, setIsHealthyChoice] = useState<boolean>(false);
    
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const foodImageInputRef = useRef<HTMLInputElement>(null);

    const latestTdee = useMemo(() => {
        return [...tdeeHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [tdeeHistory]);

    const tdeeGoal = latestTdee ? Math.round(latestTdee.value) : 2000;

    const todaysEntries = useMemo(() => {
        const now = new Date();
        return calorieHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === now.getDate() &&
                   entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [calorieHistory]);

    const totalCaloriesToday = useMemo(() => {
        return todaysEntries.reduce((sum, entry) => sum + entry.calories, 0);
    }, [todaysEntries]);

    const progressPercentage = Math.min(100, Math.max(0, (totalCaloriesToday / tdeeGoal) * 100));

    const handleCustomAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        const calories = parseInt(customCalories);
        
        if (!customName.trim() || isNaN(calories)) {
            setErrorMsg("⚠️ กรุณาระบุชื่ออาหารและแคลอรี่");
            return;
        }

        try {
            let finalBase64 = processedBase64 || "";
            let imageHash = undefined;

            if (customImage && !finalBase64) {
                const proc = await processImageForAI(customImage);
                finalBase64 = proc.fullBase64;
            }
            
            if (finalBase64) {
                imageHash = hashString(finalBase64);
                if (calorieHistory.some(entry => entry.imageHash === imageHash)) {
                    throw new Error("ภาพนี้เคยถูกใช้งานไปแล้ว");
                }
            }

            const newEntry: CalorieHistoryEntry = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                name: customName.trim(),
                calories,
                protein: parseFloat(customProtein) || 0,
                carbs: parseFloat(customCarbs) || 0,
                fat: parseFloat(customFat) || 0,
                image: finalBase64,
                imageHash: imageHash,
                isHealthyChoice: isHealthyChoice
            };

            setCalorieHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
            gainXP(isHealthyChoice ? XP_VALUES.CALORIE * 2 : XP_VALUES.CALORIE, 'CALORIE');
            resetForm();
        } catch (err: any) {
            setErrorMsg(err.message);
        }
    };

    const resetForm = () => {
        setCustomName('');
        setCustomCalories('');
        setCustomProtein('');
        setCustomCarbs('');
        setCustomFat('');
        setCustomImage(null);
        setCustomImagePreview(null);
        setProcessedBase64(null);
        setIsHealthyChoice(false);
    };

    const handleScanWithAI = async () => {
        if (!customImage) return;
        setIsScanning(true);
        setErrorMsg(null);
        try {
            const { base64, fullBase64, mimeType } = await processImageForAI(customImage);
            setProcessedBase64(fullBase64);
            const analysis = await analyzeFoodFromImage(base64, mimeType, userProfile.aiSystemInstruction);
            
            if (!analysis.verification?.isFood) {
                throw new Error("❌ AI พบว่า 'ไม่ใช่ภาพอาหาร'");
            }
            
            setCustomName(analysis.description || '');
            setCustomCalories(String(analysis.calories || '0'));
            setCustomProtein(String(analysis.protein || '0'));
            setCustomCarbs(String(analysis.carbohydrates || '0'));
            setCustomFat(String(analysis.fat || '0'));
            setIsHealthyChoice(!!analysis.isHealthyChoice);
            
        } catch (err: any) {
            setErrorMsg(err.message || "AI ไม่สามารถวิเคราะห์ได้");
        } finally {
            setIsScanning(false);
        }
    };

    const confirmClearHistory = () => {
        if (itemToDelete) {
            setCalorieHistory(prev => prev.filter(item => item.id !== itemToDelete));
            setItemToDelete(null);
        } else {
            const todaysIds = todaysEntries.map(entry => entry.id);
            setCalorieHistory(prev => prev.filter(entry => !todaysIds.includes(entry.id)));
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="w-full space-y-4 animate-fade-in pb-10">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-black text-gray-800 dark:text-white mb-3 text-center flex items-center justify-center gap-2">
                    <BeakerIcon className="w-7 h-7 text-orange-500" />
                    บันทึกโภชนาการ
                </h2>

                <div className="mb-4">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-2xl font-black text-orange-600">{totalCaloriesToday.toLocaleString()}<span className="text-xs text-gray-400 font-normal ml-1">kcal</span></span>
                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest">เป้าหมาย: {tdeeGoal.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-1000 ${totalCaloriesToday > tdeeGoal ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <div className="space-y-4 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="space-y-2">
                        {customImagePreview ? (
                            <div className="space-y-2 animate-fade-in">
                                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-black shadow-lg ring-2 ring-white dark:ring-gray-700">
                                    <img src={customImagePreview} alt="Food" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    <button type="button" onClick={resetForm} className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-all transform hover:scale-110"><XIcon className="w-3 h-3" /></button>
                                </div>
                                <button type="button" onClick={handleScanWithAI} disabled={isScanning} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all active:scale-95">
                                    {isScanning ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4 animate-pulse" />}
                                    {isScanning ? 'AI กำลังวิเคราะห์ข้อมูล...' : 'วิเคราะห์ด้วย AI Food Lens'}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => foodImageInputRef.current?.click()}
                                className="group w-full relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10 transition-all duration-300 py-6 px-4 flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-[0.99]"
                            >
                                {/* Decorative Background Elements */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div className="absolute top-10 left-10 w-16 h-16 bg-indigo-400 rounded-full blur-2xl"></div>
                                    <div className="absolute bottom-10 right-10 w-20 h-20 bg-purple-400 rounded-full blur-2xl"></div>
                                </div>

                                {/* Central Graphic Composition */}
                                <div className="relative">
                                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full shadow-xl border-4 border-indigo-50 dark:border-indigo-900 flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-300">
                                        <CameraIcon className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                    <div className="absolute -right-3 -bottom-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3 py-1 rounded-full shadow-lg border border-white dark:border-gray-800 flex items-center gap-1 animate-bounce z-20">
                                        <SparklesIcon className="w-3 h-3" />
                                        <span className="text-[10px] font-black tracking-wider">AI</span>
                                    </div>
                                </div>

                                {/* Text Instructions */}
                                <div className="text-center relative z-10">
                                    <h3 className="text-base font-black text-indigo-900 dark:text-indigo-100 mb-0.5 group-hover:text-indigo-700 transition-colors">
                                        ถ่ายภาพอาหาร
                                    </h3>
                                    <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-gray-800 rounded text-[10px] text-gray-400 font-bold uppercase tracking-wide border border-indigo-100 dark:border-indigo-900">
                                        JPG/PNG
                                    </div>
                                </div>
                            </button>
                        )}
                        <input type="file" accept="image/*" ref={foodImageInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){setCustomImage(f); setCustomImagePreview(URL.createObjectURL(f)); setIsHealthyChoice(false);}}} className="hidden" />
                    </div>

                    <form onSubmit={handleCustomAdd} className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">ชื่ออาหาร</label>
                                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="เช่น ข้าวกะเพราไก่..." className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all"/>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1">แคลอรี่ (kcal)</label>
                                <input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all"/>
                            </div>
                        </div>

                        {/* Nutrient Fields */}
                        <div className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div>
                                <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-0.5 text-center">โปรตีน (g)</label>
                                <input type="number" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} placeholder="0" className="w-full px-1 py-2 text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-md text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:ring-1 focus:ring-emerald-500 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-0.5 text-center">คาร์บ (g)</label>
                                <input type="number" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} placeholder="0" className="w-full px-1 py-2 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-md text-sm font-bold text-amber-700 dark:text-amber-300 focus:ring-1 focus:ring-amber-500 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-0.5 text-center">ไขมัน (g)</label>
                                <input type="number" value={customFat} onChange={(e) => setCustomFat(e.target.value)} placeholder="0" className="w-full px-1 py-2 text-center bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-md text-sm font-bold text-rose-700 dark:text-rose-300 focus:ring-1 focus:ring-rose-500 outline-none"/>
                            </div>
                        </div>

                        {isHealthyChoice && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 animate-fade-in">
                                <StarIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">มื้อนี้เพื่อสุขภาพ (Bonus HP x2)</span>
                            </div>
                        )}
                        
                        {errorMsg && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-800 flex items-center gap-2"><InformationCircleIcon className="w-4 h-4"/>{errorMsg}</div>}

                        <button type="submit" disabled={!customName || isScanning} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-[0.98] uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                            ยืนยันและบันทึกมื้ออาหาร
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-black text-gray-800 dark:text-white uppercase tracking-tight">รายการวันนี้</h3>
                    <button onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} className="text-xs font-black text-gray-400 hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                        <TrashIcon className="w-4 h-4" /> ล้าง
                    </button>
                </div>
                
                <div className="space-y-3">
                    {todaysEntries.length > 0 ? (
                        todaysEntries.map((entry) => (
                            <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 flex gap-3 items-center transition-transform hover:scale-[1.01]">
                                {entry.image ? (
                                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white dark:border-gray-600 flex-shrink-0 bg-black shadow-sm">
                                        <img src={entry.image} alt="Food" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-2xl flex-shrink-0 border border-orange-200 dark:border-orange-800">🍱</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 dark:text-white truncate text-sm">{entry.name}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`text-xs font-black ${entry.isHealthyChoice ? 'text-emerald-500' : 'text-orange-500'}`}>{entry.calories} kcal</span>
                                        {(entry.protein || entry.carbs || entry.fat) ? (
                                            <span className="text-[10px] text-gray-400 font-medium bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                                P{entry.protein || 0} C{entry.carbs || 0} F{entry.fat || 0}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 opacity-30 flex flex-col items-center">
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                                <InformationCircleIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-400">ไม่มีข้อมูลวันนี้</p>
                        </div>
                    )}
                </div>
            </div>

            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center animate-bounce-in">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3"><TrashIcon className="w-6 h-6 text-red-500" /></div>
                        <h3 className="text-lg font-bold dark:text-white">ยืนยันการลบ?</h3>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">ยกเลิก</button>
                            <button onClick={confirmClearHistory} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-lg text-sm shadow hover:bg-red-600 transition-colors">ลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalorieTracker;
