
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { ActivityHistoryEntry } from '../types';
import { TrashIcon, BoltIcon, CameraIcon, SparklesIcon, XIcon, ClipboardDocumentCheckIcon, FireIcon, MapPinIcon, MoonIcon, ExclamationTriangleIcon } from './icons';
import { COMMON_ACTIVITIES, XP_VALUES } from '../constants';
import { extractHealthDataFromImage, estimateExerciseCalories } from '../services/geminiService';

const MAX_HISTORY_ITEMS = 100;
const KCAL_PER_STEP = 0.04;

const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
};

const ActivityTracker: React.FC = () => {
    const { activityHistory, setActivityHistory, gainXP } = useContext(AppContext);
    
    // Custom Activity Form State
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [customDuration, setCustomDuration] = useState('');
    const [customDistance, setCustomDistance] = useState('');
    const [customImage, setCustomImage] = useState<File | null>(null);
    const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
    const [isScanningImage, setIsScanningImage] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [duplicateError, setDuplicateError] = useState<string | null>(null);
    
    // Steps & Verification State
    const [stepsInput, setStepsInput] = useState('');
    const [stepProofImage, setStepProofImage] = useState<File | null>(null);
    const [stepProofPreview, setStepProofPreview] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    const stepProofInputRef = useRef<HTMLInputElement>(null);
    const customActivityInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const todaysEntries = useMemo(() => {
        const now = new Date();
        return activityHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getDate() === now.getDate() &&
                   entryDate.getMonth() === now.getMonth() &&
                   entryDate.getFullYear() === now.getFullYear();
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activityHistory]);

    const totalCaloriesBurnedToday = useMemo(() => {
        return todaysEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    }, [todaysEntries]);

    const estimatedCaloriesFromSteps = useMemo(() => {
        const steps = parseInt(stepsInput);
        if (isNaN(steps) || steps <= 0) return 0;
        return Math.round(steps * KCAL_PER_STEP);
    }, [stepsInput]);

    const checkDuplicateImage = (base64: string): boolean => {
        const newHash = hashString(base64);
        return activityHistory.some(entry => entry.imageHash === newHash);
    };

    const addActivityEntry = async (name: string, caloriesBurned: number, duration?: string, distance?: string, imageFile?: File | null) => {
        let imageBase64 = undefined;
        let imageHash = undefined;

        if (imageFile) {
            const reader = new FileReader();
            imageBase64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(imageFile);
            });

            if (checkDuplicateImage(imageBase64)) {
                throw new Error("ภาพนี้เคยถูกใช้งานไปแล้ว กรุณาใช้ภาพกิจกรรมใหม่ของวันนี้");
            }
            imageHash = hashString(imageBase64);
        }

        const newEntry: ActivityHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name,
            caloriesBurned,
            duration,
            distance,
            image: imageBase64,
            imageHash: imageHash
        };
        setActivityHistory(prev => [newEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
        gainXP(XP_VALUES.EXERCISE, 'EXERCISE');
    };

    const handleCustomAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setDuplicateError(null);
        
        if (!customImage) {
            setDuplicateError("กรุณาแนบภาพหลักฐานกิจกรรมก่อนบันทึก");
            return;
        }

        const calories = parseInt(customCalories);
        if (customName.trim() && calories > 0) {
            try {
                await addActivityEntry(
                    customName.trim(), 
                    calories, 
                    customDuration.trim() || undefined, 
                    customDistance.trim() || undefined,
                    customImage
                );
                setCustomName('');
                setCustomCalories('');
                setCustomDuration('');
                setCustomDistance('');
                setCustomImage(null);
                setCustomImagePreview(null);
            } catch (err: any) {
                setDuplicateError(err.message);
            }
        }
    };

    const handleQuickSelect = (activity: any) => {
        setCustomName(activity.name);
        setCustomCalories(activity.caloriesBurned.toString());
        setCustomDuration(activity.duration || '');
        setDuplicateError(null);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleAutoCalculateCalories = async () => {
        if (!customName.trim() || !customDuration.trim()) {
            alert("กรุณาระบุชื่อกิจกรรมและระยะเวลาก่อนคำนวณ");
            return;
        }
        setIsCalculating(true);
        try {
            const cal = await estimateExerciseCalories(customName, parseInt(customDuration));
            setCustomCalories(cal.toString());
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleVerifyAndSaveSteps = async () => {
        if (!stepsInput || !stepProofImage) {
            setVerifyError("กรุณากรอกจำนวนก้าวและแนบรูปหลักฐาน");
            return;
        }

        setVerifyError(null);
        setIsVerifying(true);

        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
                };
                reader.readAsDataURL(stepProofImage);
            });

            const base64Data = await base64Promise;
            const fullBase64 = `data:${stepProofImage.type};base64,${base64Data}`;
            if (checkDuplicateImage(fullBase64)) {
                throw new Error("ภาพหลักฐานนี้เคยถูกใช้บันทึกไปแล้ว กรุณาใช้รูปใหม่ของวันนี้");
            }

            const aiData = await extractHealthDataFromImage(base64Data, stepProofImage.type, 'activity');

            // Removed date verification logic as requested
            // We now rely only on step count matching

            const userInputSteps = parseInt(stepsInput);
            const aiDetectedSteps = aiData.steps || 0;

            if (aiDetectedSteps === 0) {
                throw new Error("AI ไม่สามารถระบุจำนวนก้าวจากรูปภาพนี้ได้ กรุณาใช้รูปที่มีตัวเลขชัดเจน");
            }

            const difference = Math.abs(userInputSteps - aiDetectedSteps);
            const tolerance = userInputSteps * 0.1; // Allow 10% tolerance

            if (difference > tolerance) {
                throw new Error(`จำนวนก้าวไม่ตรงกับหลักฐาน (AI พบ ${aiDetectedSteps.toLocaleString()} ก้าว) กรุณาตรวจสอบอีกครั้ง`);
            }

            const caloriesToSave = Math.round(userInputSteps * KCAL_PER_STEP);
            await addActivityEntry(`เดิน ${userInputSteps.toLocaleString()} ก้าว (ตรวจสอบแล้ว)`, caloriesToSave, undefined, undefined, stepProofImage);
            
            setStepsInput('');
            setStepProofImage(null);
            setStepProofPreview(null);
            alert("✅ ตรวจสอบหลักฐานสำเร็จและบันทึกข้อมูลเรียบร้อย!");

        } catch (err: any) {
            setVerifyError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบ");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStepImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setStepProofImage(file);
            setStepProofPreview(URL.createObjectURL(file));
            setVerifyError(null);
        }
    };

    const handleCustomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCustomImage(file);
            setCustomImagePreview(URL.createObjectURL(file));
            setDuplicateError(null);
        }
    };

    const handleScanActivityImage = async () => {
        if (!customImage) return;
        setIsScanningImage(true);
        setDuplicateError(null);
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
                };
                reader.readAsDataURL(customImage);
            });
            const base64 = await base64Promise;
            const data = await extractHealthDataFromImage(base64, customImage.type, 'activity');
            
            // Removed date verification logic as requested
            // We just populate the form based on what AI sees

            if (data.name) setCustomName(data.name);
            if (data.calories) setCustomCalories(data.calories.toString());
            if (data.duration) setCustomDuration(data.duration.toString());
            if (data.distance) setCustomDistance(data.distance.toString());
            
            if (!data.name || data.name.toLowerCase() === 'activity' || data.name.toLowerCase() === 'exercise') {
               if (data.steps) setCustomName(`กิจกรรมจาก Smart Watch (${data.steps.toLocaleString()} ก้าว)`);
               else setCustomName("กิจกรรมจากการออกกำลังกาย");
            }

            alert("✨ AI ดึงข้อมูลเรียบร้อยแล้ว (โปรดตรวจสอบความถูกต้อง)");
        } catch (e) {
            console.error(e);
            alert("ขออภัย AI ไม่สามารถระบุข้อมูลจากรูปนี้ได้ กรุณาระบุข้อมูลด้วยตัวเอง");
        } finally {
            setIsScanningImage(false);
        }
    };

    const confirmClearHistory = () => {
        if (itemToDelete) {
            setActivityHistory(prev => prev.filter(item => item.id !== itemToDelete));
            setItemToDelete(null);
        } else {
            const todaysIds = todaysEntries.map(entry => entry.id);
            setActivityHistory(prev => prev.filter(entry => !todaysIds.includes(entry.id)));
        }
        setShowConfirmDialog(false);
    };

    return (
        <div className="w-full space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center flex items-center justify-center gap-2">
                    <BoltIcon className="w-8 h-8 text-yellow-500" />
                    บันทึกกิจกรรมวันนี้
                </h2>

                <div className="text-center bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl mb-6 border border-yellow-100 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">เผาผลาญแคลอรี่ทั้งหมดวันนี้</p>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 my-1">{totalCaloriesBurnedToday.toLocaleString()}</p>
                    <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">kcal</p>
                </div>
                
                {/* --- STEPS CALCULATOR --- */}
                <div className="mb-10 bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border-2 border-dashed border-teal-200 dark:border-teal-800 relative">
                    <div className="absolute -top-3 left-4 px-2 bg-white dark:bg-gray-800 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest border border-teal-100 dark:border-teal-900 rounded">
                        Evidence-based Steps
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">1. ระบุจำนวนก้าว (Steps)</label>
                            <input 
                                type="number" 
                                value={stepsInput}
                                onChange={(e) => setStepsInput(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-black text-xl text-teal-600 dark:text-teal-400 focus:border-teal-500 outline-none transition-all"
                            />
                            {estimatedCaloriesFromSteps > 0 && (
                                <p className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 animate-fade-in flex items-center gap-1">
                                    <FireIcon className="w-4 h-4" />
                                    แคลอรี่โดยประมาณ: {estimatedCaloriesFromSteps.toLocaleString()} kcal
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">2. แนบรูปหลักฐาน (Proof of Steps)</label>
                            {stepProofPreview ? (
                                <div className="relative group w-full h-40 rounded-xl overflow-hidden shadow-inner bg-black/5 border border-gray-200 dark:border-gray-700">
                                    <img src={stepProofPreview} alt="Proof" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={() => { setStepProofImage(null); setStepProofPreview(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => stepProofInputRef.current?.click()}
                                    className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-white dark:hover:bg-gray-700 transition-all text-gray-400 hover:text-teal-500"
                                >
                                    <CameraIcon className="w-8 h-8" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">อัปโหลด Screenshot จำนวนก้าว</span>
                                </button>
                            )}
                            <input type="file" accept="image/*" ref={stepProofInputRef} onChange={handleStepImageChange} className="hidden" />
                        </div>

                        {verifyError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-2 animate-bounce-in">
                                <span className="text-red-500 mt-0.5">⚠️</span>
                                <p className="text-xs text-red-600 dark:text-red-300 font-bold">{verifyError}</p>
                            </div>
                        )}

                        <button 
                            onClick={handleVerifyAndSaveSteps}
                            disabled={isVerifying || !stepsInput || !stepProofImage}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                                isVerifying 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:shadow-teal-200 dark:hover:shadow-none'
                            }`}
                        >
                            {isVerifying ? (
                                <><div className="w-5 h-5 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div><span>กำลังตรวจสอบหลักฐาน...</span></>
                            ) : (
                                <><ClipboardDocumentCheckIcon className="w-5 h-5" /><span>ตรวจสอบและบันทึกก้าวเดิน</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- OTHER ACTIVITIES --- */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">บันทึกกิจกรรมอื่น (Other Activities)</h3>
                        
                        <div className="mb-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">เลือกกิจกรรมด่วน (Quick Selection)</p>
                            <div className="flex flex-wrap gap-2">
                                {COMMON_ACTIVITIES.map(activity => (
                                    <button key={activity.name} onClick={() => handleQuickSelect(activity)} className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded-full border border-yellow-100 dark:border-yellow-800 hover:bg-yellow-100 transition-colors shadow-sm active:scale-95">
                                        {activity.name} ({activity.duration} นาที)
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div ref={formRef} className="space-y-4 bg-gray-50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-black text-teal-600 uppercase tracking-widest">ฟอร์มบันทึกกิจกรรม</h4>
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                                    <SparklesIcon className="w-3 h-3 text-indigo-500" />
                                    <span className="text-[10px] font-bold text-indigo-600">AI Enabled</span>
                                </div>
                            </div>
                            
                            <form onSubmit={handleCustomAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase">แนบภาพหลักฐาน <span className="text-red-500">*</span></label>
                                    {customImagePreview ? (
                                        <div className="space-y-3">
                                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5 shadow-inner">
                                                <img src={customImagePreview} alt="Activity" className="w-full h-full object-contain" />
                                                <button 
                                                    type="button"
                                                    onClick={() => { setCustomImage(null); setCustomImagePreview(null); }}
                                                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleScanActivityImage}
                                                disabled={isScanningImage}
                                                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 ${
                                                    isScanningImage 
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200' 
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                                }`}
                                            >
                                                {isScanningImage ? (
                                                    <><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><span>กำลังวิเคราะห์...</span></>
                                                ) : (
                                                    <><SparklesIcon className="w-4 h-4" /><span>สแกนข้อมูลจากรูปภาพอัตโนมัติ (AI)</span></>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={() => customActivityInputRef.current?.click()}
                                            className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-yellow-500 hover:bg-white dark:hover:bg-gray-700 transition-all flex flex-col items-center gap-2"
                                        >
                                            <CameraIcon className="w-8 h-8" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">อัปโหลด Screenshot หรือภาพถ่ายกิจกรรม</span>
                                        </button>
                                    )}
                                    <input type="file" accept="image/*" ref={customActivityInputRef} onChange={handleCustomImageChange} className="hidden" />
                                </div>

                                {duplicateError && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-shake">
                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-600 font-bold">{duplicateError}</p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ชื่อกิจกรรม</label>
                                            <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="เช่น เดินเร็ว, ทำความสะอาดบ้าน" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none transition-all"/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ระยะเวลา (นาที)</label>
                                            <input type="number" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none transition-all"/>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">แคลอรี่ที่เผาผลาญ (kcal)</label>
                                        <div className="flex gap-2">
                                            <input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder="0" className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none transition-all"/>
                                            <button 
                                                type="button"
                                                onClick={handleAutoCalculateCalories}
                                                disabled={isCalculating || !customName || !customDuration}
                                                className={`px-4 rounded-xl font-bold text-xs uppercase tracking-tight flex items-center gap-1.5 transition-all shadow-sm ${
                                                    isCalculating 
                                                    ? 'bg-gray-100 text-gray-400' 
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                                                }`}
                                            >
                                                {isCalculating ? (
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <SparklesIcon className="w-4 h-4" />
                                                )}
                                                <span>คำนวณอัตโนมัติ (AI)</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">ระยะทาง (กม.) - ถ้ามี</label>
                                        <input type="text" value={customDistance} onChange={(e) => setCustomDistance(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-yellow-500 outline-none transition-all"/>
                                    </div>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={!customName || !customCalories || !customImage || isScanningImage || isCalculating} 
                                    className="w-full bg-yellow-500 text-white font-black py-4 rounded-xl hover:bg-yellow-600 disabled:bg-gray-300 transition-colors uppercase tracking-widest text-xs shadow-md shadow-yellow-100 dark:shadow-none mt-2"
                                >
                                    บันทึกกิจกรรมลงในระบบ
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {activityHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">กิจกรรมของวันนี้</h3>
                         <button onClick={() => { setItemToDelete(null); setShowConfirmDialog(true); }} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors uppercase tracking-wider">
                            <TrashIcon className="w-4 h-4" /> ล้างทั้งหมด
                        </button>
                    </div>
                    <div className="space-y-3">
                        {todaysEntries.length > 0 ? (
                            todaysEntries.map((entry) => (
                                <div key={entry.id} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-3">
                                            {entry.image && (
                                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white shadow-sm bg-black/5">
                                                    <img src={entry.image} alt="Proof" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{entry.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">{new Date(entry.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-black text-yellow-600 dark:text-yellow-400">{entry.caloriesBurned} kcal</p>
                                            <button onClick={() => { setItemToDelete(entry.id); setShowConfirmDialog(true); }} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {(entry.duration || entry.distance) && (
                                        <div className="flex gap-4 mt-1 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            {entry.duration && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <MoonIcon className="w-3 h-3" />
                                                    <span>{entry.duration} นาที</span>
                                                </div>
                                            )}
                                            {entry.distance && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <MapPinIcon className="w-3 h-3" />
                                                    <span>{entry.distance} กม.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 py-6 text-sm italic">ไม่มีกิจกรรมที่บันทึกวันนี้</p>
                        )}
                    </div>
                </div>
            )}
            
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowConfirmDialog(false)}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 transform animate-bounce-in" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                             <TrashIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">ยืนยันการลบ?</h3>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                            <button onClick={confirmClearHistory} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors">ลบรายการ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTracker;
