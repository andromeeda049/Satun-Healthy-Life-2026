
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { HeartIcon, BrainIcon, MoonIcon, ClipboardCheckIcon, ArrowLeftIcon, ExclamationTriangleIcon, ScaleIcon, BoltIcon, FireIcon } from './icons';
import { UserProfile } from '../types';

// --- Types & Constants ---
type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';

// 9Q Questions
const QUESTIONS_9Q = [
    "1. เบื่อ ไม่สนใจอยากทำอะไร",
    "2. ไม่สบายใจ ซึมเศร้า ท้อแท้",
    "3. หลับยาก หรือหลับๆ ตื่นๆ หรือหลับมากไป",
    "4. เหนื่อยง่าย หรือ ไม่ค่อยมีแรง",
    "5. เบื่ออาหาร หรือ กินมากเกินไป",
    "6. รู้สึกไม่ดีกับตัวเอง คิดว่าล้มเหลว หรือทำให้ตนเองหรือครอบครัวผิดหวัง",
    "7. สมาธิไม่ดีเวลาทำอะไร เช่น ดูโทรทัศน์ ฟังวิทยุ หรือทำงานที่ต้องใช้ความตั้งใจ",
    "8. พูดช้า ทำอะไรช้าลง จนคนอื่นสังเกตเห็นได้ หรือกระสับกระส่ายไม่สามารถอยู่นิ่งได้เหมือนที่เคยเป็น",
    "9. คิดทำร้ายตนเอง หรือคิดว่าถ้าตายไปคงจะดี"
];

const HealthRiskAssessment: React.FC = () => {
    const { userProfile, setUserProfile, currentUser, clinicalHistory, habitHistory, setActiveView } = useContext(AppContext);
    
    const [step, setStep] = useState<'menu' | 'cvd' | '2q' | '9q' | 'stopbang'>('menu');
    
    // --- CVD State ---
    const [cvdData, setCvdData] = useState({
        age: '',
        gender: 'male',
        weight: '',
        height: '',
        waist: '',
        sbp: '', // Systolic BP
        isSmoker: false,
        hasDiabetes: false
    });

    // --- 2Q/9Q State ---
    const [q2_1, setQ2_1] = useState(false);
    const [q2_2, setQ2_2] = useState(false);
    const [scores9Q, setScores9Q] = useState<number[]>(new Array(9).fill(0));

    // --- STOP-BANG State ---
    const [sbScore, setSbScore] = useState(0);

    // Initialize Data from Context
    useEffect(() => {
        if (userProfile) {
            // Get latest BP from clinical history
            const latestClinical = [...(clinicalHistory || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const latestBP = latestClinical?.systolic ? String(latestClinical.systolic) : '';

            // Get Smoking from Habit History
            const latestHabit = [...(habitHistory || [])].filter(h => h.type === 'smoking').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const isSmoker = latestHabit ? !latestHabit.isClean : false;

            // Check Diabetes from Health Condition string
            const hasDiabetes = userProfile.healthCondition?.includes('เบาหวาน') || userProfile.healthCondition?.includes('Diabetes') || false;

            setCvdData({
                age: userProfile.age || '',
                gender: userProfile.gender || 'male',
                weight: userProfile.weight || '',
                height: userProfile.height || '',
                waist: userProfile.waist || '',
                sbp: latestBP || '120', // Default 120 if no data
                isSmoker: isSmoker,
                hasDiabetes: hasDiabetes
            });
        }
    }, [userProfile, clinicalHistory, habitHistory]);

    // --- Logic: Calculate Thai CVD Risk (Non-lab) ---
    // Reference: Simplified scoring based on Thai CV Risk Charts (Age, Gender, SBP, Smoking, Diabetes, BMI/Waist)
    const cvdResult = useMemo(() => {
        let score = 0;
        const age = parseInt(cvdData.age || '0');
        const sbp = parseInt(cvdData.sbp || '0');
        
        // 1. Age Factor (Approximate score mapping)
        if (age >= 30 && age < 40) score += 0;
        else if (age >= 40 && age < 50) score += 1;
        else if (age >= 50 && age < 60) score += 2;
        else if (age >= 60) score += 3;

        // 2. Gender
        if (cvdData.gender === 'male') score += 1;

        // 3. Smoking (High Risk Factor)
        if (cvdData.isSmoker) score += 2;

        // 4. Diabetes (High Risk Factor)
        if (cvdData.hasDiabetes) score += 2;

        // 5. Blood Pressure (SBP)
        if (sbp >= 140 && sbp < 160) score += 1;
        else if (sbp >= 160 && sbp < 180) score += 2;
        else if (sbp >= 180) score += 3;

        // 6. Obesity (BMI or Waist)
        const h = parseFloat(cvdData.height) / 100;
        const w = parseFloat(cvdData.weight);
        const waist = parseFloat(cvdData.waist);
        const bmi = (h > 0 && w > 0) ? w / (h * h) : 0;
        
        let isObese = false;
        if (bmi >= 25) isObese = true;
        if (cvdData.gender === 'male' && waist > 90) isObese = true;
        if (cvdData.gender === 'female' && waist > 80) isObese = true;

        if (isObese) score += 1;

        // Result Mapping
        if (score <= 2) return { level: 'low', label: 'เสี่ยงต่ำ (<10%)', color: 'text-green-600', bg: 'bg-green-100', barColor: 'bg-green-500', pct: 20 };
        if (score <= 4) return { level: 'moderate', label: 'เสี่ยงปานกลาง (10-20%)', color: 'text-yellow-600', bg: 'bg-yellow-100', barColor: 'bg-yellow-500', pct: 50 };
        if (score <= 7) return { level: 'high', label: 'เสี่ยงสูง (20-30%)', color: 'text-orange-600', bg: 'bg-orange-100', barColor: 'bg-orange-500', pct: 80 };
        return { level: 'very_high', label: 'เสี่ยงสูงมาก (>30%)', color: 'text-red-600', bg: 'bg-red-100', barColor: 'bg-red-600', pct: 100 };

    }, [cvdData]);

    const handleSaveRisk = (result: any) => {
        if (!currentUser) return;
        const updatedProfile = { 
            ...userProfile, 
            riskAssessment: {
                ...userProfile.riskAssessment,
                ...result,
                lastAssessmentDate: new Date().toISOString()
            }
        };
        setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
    };

    const renderMenu = () => (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all" onClick={() => setStep('cvd')}>
                <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <HeartIcon className="w-6 h-6" /> Thai CVD Risk (โรคหัวใจ)
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">ประเมินความเสี่ยงโรคหัวใจและหลอดเลือด (ใช้ข้อมูลอายุ, ความดัน, รอบเอว)</p>
                <div className="mt-3 w-full py-2 bg-white/50 dark:bg-white/10 rounded-lg text-center text-xs font-bold text-blue-700 dark:text-blue-300">
                    กดเพื่อเริ่มประเมิน &gt;
                </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800 cursor-pointer hover:shadow-md transition-all" onClick={() => setStep('2q')}>
                <h3 className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <BrainIcon className="w-6 h-6" /> 2Q & 9Q Screening (สุขภาพจิต)
                </h3>
                <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">คัดกรองภาวะซึมเศร้าเบื้องต้นและประเมินความรุนแรง</p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-md transition-all" onClick={() => setStep('stopbang')}>
                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                    <MoonIcon className="w-6 h-6" /> STOP-BANG (การนอน)
                </h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">คัดกรองความเสี่ยงภาวะหยุดหายใจขณะหลับ (OSA)</p>
            </div>
        </div>
    );

    const renderCVD = () => {
        return (
            <div className="space-y-6 animate-slide-up pb-20">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <ClipboardCheckIcon className="w-5 h-5 text-teal-500"/> ข้อมูลส่วนตัว (Personal Data)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">อายุ (ปี)</label>
                            <input 
                                type="number" 
                                value={cvdData.age} 
                                onChange={(e) => setCvdData({...cvdData, age: e.target.value})} 
                                className="w-full p-2.5 bg-white dark:bg-gray-700 border rounded-lg text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เพศ</label>
                            <select 
                                value={cvdData.gender} 
                                onChange={(e) => setCvdData({...cvdData, gender: e.target.value})} 
                                className="w-full p-2.5 bg-white dark:bg-gray-700 border rounded-lg text-sm font-bold"
                            >
                                <option value="male">ชาย</option>
                                <option value="female">หญิง</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">น้ำหนัก (กก.)</label>
                            <input type="number" value={cvdData.weight} onChange={(e) => setCvdData({...cvdData, weight: e.target.value})} className="w-full p-2 border rounded-lg text-sm text-center"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ส่วนสูง (ซม.)</label>
                            <input type="number" value={cvdData.height} onChange={(e) => setCvdData({...cvdData, height: e.target.value})} className="w-full p-2 border rounded-lg text-sm text-center"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">รอบเอว (ซม.)</label>
                            <input type="number" value={cvdData.waist} onChange={(e) => setCvdData({...cvdData, waist: e.target.value})} className="w-full p-2 border rounded-lg text-sm text-center"/>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <HeartIcon className="w-5 h-5 text-rose-500"/> ปัจจัยเสี่ยง (Risk Factors)
                    </h3>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ความดันโลหิตตัวบน (SBP)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={cvdData.sbp} 
                                onChange={(e) => setCvdData({...cvdData, sbp: e.target.value})} 
                                placeholder="120" 
                                className="flex-1 p-3 border rounded-xl text-lg font-bold text-center dark:bg-gray-700 dark:border-gray-600" 
                            />
                            <span className="text-xs text-gray-500">mmHg</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <BoltIcon className="w-4 h-4 text-orange-500" /> เป็นโรคเบาหวาน
                            </span>
                            <input 
                                type="checkbox" 
                                checked={cvdData.hasDiabetes} 
                                onChange={(e) => setCvdData({...cvdData, hasDiabetes: e.target.checked})} 
                                className="w-5 h-5 accent-orange-500" 
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <FireIcon className="w-4 h-4 text-gray-500" /> สูบบุหรี่
                            </span>
                            <input 
                                type="checkbox" 
                                checked={cvdData.isSmoker} 
                                onChange={(e) => setCvdData({...cvdData, isSmoker: e.target.checked})} 
                                className="w-5 h-5 accent-gray-600" 
                            />
                        </label>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] -mx-4 rounded-t-2xl z-20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase">ผลประเมิน (Thai CV Risk)</p>
                            <h2 className={`text-xl font-black ${cvdResult.color}`}>{cvdResult.label}</h2>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg ${cvdResult.barColor}`}>
                            {cvdResult.level === 'very_high' ? '30%+' : cvdResult.level === 'high' ? '20%' : cvdResult.level === 'moderate' ? '10%' : '<10%'}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            // Calculate Score based on current inputs (approx score for logic)
                            handleSaveRisk({ cvdRiskLevel: cvdResult.level, cvdScore: cvdResult.pct }); // pct is just visual here, logic can be refined
                            setStep('menu');
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                        บันทึกผลการประเมิน
                    </button>
                </div>
            </div>
        );
    };

    const render2Q = () => {
        const isPositive = q2_1 || q2_2;
        return (
            <div className="space-y-6 animate-slide-up">
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800">
                    ใน 2 สัปดาห์ที่ผ่านมา รวมวันนี้ ท่านมีอาการเหล่านี้หรือไม่?
                </p>
                
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer shadow-sm">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-4">1. รู้สึกหดหู่ เศร้า หรือท้อแท้สิ้นหวัง</span>
                        <input type="checkbox" checked={q2_1} onChange={(e) => setQ2_1(e.target.checked)} className="w-6 h-6 accent-rose-500 flex-shrink-0" />
                    </label>
                    <label className="flex items-center justify-between p-4 border rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer shadow-sm">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-4">2. เบื่อ ทำอะไรก็ไม่เพลิดเพลิน</span>
                        <input type="checkbox" checked={q2_2} onChange={(e) => setQ2_2(e.target.checked)} className="w-6 h-6 accent-rose-500 flex-shrink-0" />
                    </label>
                </div>

                <div className="text-center py-4">
                    {isPositive ? (
                        <div className="text-rose-600 font-bold bg-rose-50 p-4 rounded-xl border border-rose-200 flex flex-col items-center gap-2">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                            <span>ผลเป็นบวก (Positive)<br/><span className="text-sm font-normal">มีแนวโน้มซึมเศร้า ควรประเมินต่อ</span></span>
                        </div>
                    ) : (
                        <div className="text-green-600 font-bold bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col items-center gap-2">
                            <ClipboardCheckIcon className="w-8 h-8" />
                            <span>ปกติ (Normal)<br/><span className="text-sm font-normal">ไม่มีแนวโน้มซึมเศร้า</span></span>
                        </div>
                    )}
                </div>

                {isPositive ? (
                    <button 
                        onClick={() => setStep('9q')}
                        className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-lg animate-pulse hover:bg-rose-700 transition-colors"
                    >
                        ทำแบบประเมิน 9Q ต่อทันที
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            handleSaveRisk({ depressionRisk: false, depressionSeverity: 'normal' });
                            setStep('menu');
                        }}
                        className="w-full py-3.5 bg-gray-600 text-white rounded-xl font-bold shadow-md hover:bg-gray-700 transition-colors"
                    >
                        บันทึกผล (ปกติ)
                    </button>
                )}
            </div>
        );
    };

    const render9Q = () => {
        const totalScore = scores9Q.reduce((a, b) => a + b, 0);
        
        let severity = 'normal';
        let severityLabel = 'ไม่มีอาการ (Normal)';
        let severityColor = 'text-green-600';

        if (totalScore >= 7 && totalScore <= 12) {
            severity = 'mild'; severityLabel = 'ระดับน้อย (Mild)'; severityColor = 'text-yellow-600';
        } else if (totalScore >= 13 && totalScore <= 18) {
            severity = 'moderate'; severityLabel = 'ระดับปานกลาง (Moderate)'; severityColor = 'text-orange-600';
        } else if (totalScore >= 19) {
            severity = 'severe'; severityLabel = 'ระดับรุนแรง (Severe)'; severityColor = 'text-red-600';
        }

        const handleScoreChange = (index: number, score: number) => {
            const newScores = [...scores9Q];
            newScores[index] = score;
            setScores9Q(newScores);
        };

        return (
            <div className="space-y-6 animate-slide-up pb-20">
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-800">
                    <h3 className="font-bold text-rose-800 dark:text-rose-300 mb-1">แบบประเมิน 9Q</h3>
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                        ใน 2 สัปดาห์ที่ผ่านมา รวมวันนี้ ท่านมีอาการเหล่านี้บ่อยแค่ไหน?
                    </p>
                </div>

                <div className="space-y-6">
                    {QUESTIONS_9Q.map((q, idx) => (
                        <div key={idx} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">{q}</p>
                            <div className="grid grid-cols-4 gap-2 text-[10px]">
                                {[
                                    { l: 'ไม่มีเลย', v: 0 },
                                    { l: 'เป็นบางวัน', v: 1 },
                                    { l: 'บ่อย', v: 2 },
                                    { l: 'ทุกวัน', v: 3 }
                                ].map((opt) => (
                                    <button
                                        key={opt.v}
                                        onClick={() => handleScoreChange(idx, opt.v)}
                                        className={`py-2.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                                            scores9Q[idx] === opt.v 
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-md' 
                                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="font-bold text-lg leading-none">{opt.v}</span>
                                        <span className="opacity-90">{opt.l}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t dark:border-gray-800 shadow-lg -mx-4 rounded-t-2xl z-20">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-gray-500">คะแนนรวม:</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{totalScore}</span>
                            <span className={`block text-xs font-bold ${severityColor}`}>{severityLabel}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            handleSaveRisk({ depressionRisk: true, depressionScore: totalScore, depressionSeverity: severity });
                            setStep('menu');
                        }}
                        className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold shadow-md hover:bg-rose-700 transition-colors"
                    >
                        บันทึกผลการประเมิน 9Q
                    </button>
                </div>
            </div>
        );
    };

    const renderSTOPBANG = () => {
        const questions = [
            "S: นอนกรนเสียงดัง (Snoring)",
            "T: อ่อนเพลีย/ง่วงตอนกลางวัน (Tired)",
            "O: มีคนสังเกตว่าหยุดหายใจขณะหลับ (Observed)",
            "P: มีความดันโลหิตสูง (Pressure)"
        ];
        
        let bangScore = 0;
        // BANG Calculation from Profile
        const bmi = (parseFloat(cvdData.weight) > 0 && parseFloat(cvdData.height) > 0) 
            ? parseFloat(cvdData.weight) / Math.pow(parseFloat(cvdData.height)/100, 2) 
            : 0;
        
        if (bmi > 35) bangScore++;
        if (parseInt(cvdData.age || '0') > 50) bangScore++;
        if (cvdData.gender === 'male') bangScore++;
        // Neck is usually not in profile, assume 0 for auto

        return (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        ตอบคำถามเพื่อประเมินความเสี่ยงภาวะหยุดหายใจขณะหลับ (Obstructive Sleep Apnea)
                    </p>
                </div>
                
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{q}</span>
                            <input 
                                type="checkbox" 
                                onChange={(e) => setSbScore(prev => e.target.checked ? prev + 1 : prev - 1)}
                                className="w-5 h-5 accent-indigo-600" 
                            />
                        </div>
                    ))}
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        <p className="font-bold mb-2">คะแนนอัตโนมัติ (BANG Part): +{bangScore}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li className={bmi > 35 ? 'text-indigo-600 font-bold' : ''}>BMI &gt; 35 kg/m²: {bmi > 35 ? 'ใช่ (+1)' : 'ไม่'}</li>
                            <li className={parseInt(cvdData.age) > 50 ? 'text-indigo-600 font-bold' : ''}>อายุ &gt; 50 ปี: {parseInt(cvdData.age) > 50 ? 'ใช่ (+1)' : 'ไม่'}</li>
                            <li className={cvdData.gender === 'male' ? 'text-indigo-600 font-bold' : ''}>เพศชาย: {cvdData.gender === 'male' ? 'ใช่ (+1)' : 'ไม่'}</li>
                        </ul>
                    </div>
                </div>

                <div className="text-center font-bold text-lg text-indigo-700 dark:text-indigo-300 py-2">
                    รวมคะแนน: {sbScore + bangScore} / 8
                </div>
                
                <button 
                    onClick={() => {
                        const total = sbScore + bangScore;
                        handleSaveRisk({ sleepApneaRisk: total >= 3 ? 'high' : 'low' });
                        setStep('menu');
                    }}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                    บันทึกผล
                </button>
            </div>
        );
    };

    return (
        <div className="pb-24 animate-fade-in space-y-6">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-0 z-30">
                <button onClick={() => step === 'menu' ? setActiveView('menu') : setStep('menu')} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ClipboardCheckIcon className="w-6 h-6 text-teal-500" />
                    ประเมินความเสี่ยง
                </h1>
            </div>

            <div className="px-1">
                {step === 'menu' && renderMenu()}
                {step === 'cvd' && renderCVD()}
                {step === '2q' && render2Q()}
                {step === '9q' && render9Q()}
                {step === 'stopbang' && renderSTOPBANG()}
            </div>
        </div>
    );
};

export default HealthRiskAssessment;
