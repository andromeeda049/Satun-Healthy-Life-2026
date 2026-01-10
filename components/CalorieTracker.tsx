
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
        <div className="w-full space-y-8 animate-fade-in pb-10">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-6 text-center flex items-center justify-center gap-3">
                    <BeakerIcon className="w-8 h-8 text-orange-500" />
                    บันทึกโภชนาการ
                </h2>

                <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-black text-orange-600">{totalCaloriesToday.toLocaleString()} <span className="text-xs text-gray-400">kcal</span></span>
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">เป้าหมาย: {tdeeGoal.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-1000 ${totalCaloriesToday > tdeeGoal ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <div className="space-y-6 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="space-y-2">
                        {customImagePreview ? (
                            <div className="space-y-3">
                                <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black shadow-inner">
                                    <img src={customImagePreview} alt="Food" className="w-full h-full object-contain" />
                                    <button type="button" onClick={resetForm} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg"><XIcon className="w-4 h-4" /></button>
                                </div>
                                <button type="button" onClick={handleScanWithAI} disabled={isScanning} className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-500 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                                    {isScanning ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="w-4 h-4" />}
                                    {isScanning ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI Food Lens'}
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => foodImageInputRef.current?.click()} className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 flex flex-col items-center gap-3">
                                <CameraIcon className="w-10 h-10" />
                                <span className="text-[10px] font-black uppercase">ถ่ายภาพมื้ออาหารของคุณ</span>
                            </button>
                        )}
                        <input type="file" accept="image/*" ref={foodImageInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f){setCustomImage(f); setCustomImagePreview(URL.createObjectURL(f)); setIsHealthyChoice(false);}}} className="hidden" />
                    </div>

                    <form onSubmit={handleCustomAdd} className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">ชื่ออาหาร</label>
                                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="ระบุชื่อเมนู..." className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-orange-500 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">แคลอรี่ (kcal)</label>
                                <input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-orange-500 outline-none"/>
                            </div>
                        </div>

                        {isHealthyChoice && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-fade-in">
                                <StarIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-xs font-black text-emerald-700">มื้อนี้เป็นอาหารเพื่อสุขภาพ รับโบนัส HP x2 🌿</span>
                            </div>
                        )}
                        
                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{errorMsg}</div>}

                        <button type="submit" disabled={!customName || isScanning} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase text-xs tracking-widest">
                            ยืนยันและบันทึกมื้ออาหาร
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">รายการอาหารวันนี้</h3>
                    <button onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                        <TrashIcon className="w-4 h-4" /> ล้างรายการ
                    </button>
                </div>
                
                <div className="space-y-4">
                    {todaysEntries.length > 0 ? (
                        todaysEntries.map((entry) => (
                            <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4 items-center">
                                {entry.image ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white flex-shrink-0 bg-black">
                                        <img src={entry.image} alt="Food" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 dark:text-white truncate text-sm">{entry.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-black ${entry.isHealthyChoice ? 'text-emerald-500' : 'text-orange-500'}`}>{entry.calories} kcal</span>
                                        {entry.isHealthyChoice && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black">HEALTHY (x2 HP)</span>}
                                    </div>
                                </div>
                                <button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="p-2 text-gray-300 hover:text-red-500">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-30">
                            <InformationCircleIcon className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm font-bold">ยังไม่มีข้อมูลของวันนี้</p>
                        </div>
                    )}
                </div>
            </div>

            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><TrashIcon className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-xl font-bold dark:text-white">ยืนยันการลบ?</h3>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">ยกเลิก</button>
                            <button onClick={confirmClearHistory} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl">ลบรายการ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalorieTracker;
