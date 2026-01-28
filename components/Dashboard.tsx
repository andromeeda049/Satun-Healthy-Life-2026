
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView, PillarScore } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon, WaterDropIcon, BeakerIcon, BoltIcon, ChartBarIcon, BookOpenIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, UserCircleIcon, UserGroupIcon, PrinterIcon, HeartIcon, MoonIcon, FaceSmileIcon, NoSymbolIcon, StethoscopeIcon } from './icons';
import { PILLAR_LABELS, LEVEL_THRESHOLDS } from '../constants';
import GamificationCard from './GamificationCard';

const getHealthStatus = (score: number) => {
    if (score >= 80) return { level: 'สุขภาพดีเยี่ยม', sub: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' };
    if (score >= 70) return { level: 'สุขภาพดี', sub: 'Good', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-300' };
    if (score >= 60) return { level: 'ความเสี่ยงปานกลาง', sub: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' };
    if (score >= 50) return { level: 'เริ่มมีความเสี่ยง', sub: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' };
    return { level: 'ความเสี่ยงสูง', sub: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' };
};

const getBmiCategory = (bmi: number): string => {
    if (bmi < 18.5) return 'น้ำหนักน้อยกว่าเกณฑ์';
    if (bmi < 23) return 'สมส่วน';
    if (bmi < 25) return 'น้ำหนักเกิน';
    if (bmi < 30) return 'โรคอ้วนระดับที่ 1';
    return 'โรคอ้วนระดับที่ 2';
};

// Helper to extract steps from string
const extractSteps = (name: string): number => {
    const match = name.match(/(\d{1,3}(,\d{3})*|\d+)\s*(ก้าว|steps)/i);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
};

const calculateMetrics = (profile: any) => {
    const weight = parseFloat(profile.weight || '0');
    const height = parseFloat(profile.height || '0');
    const age = parseFloat(profile.age || '0');
    const gender = profile.gender || 'male';
    const activityLevel = profile.activityLevel || 1.2;

    let bmi = 0;
    let bmr = 0;
    let tdee = 0;
    let bmiCategory = 'รอการคำนวณ';

    if (weight > 0 && height > 0) {
        const hM = height / 100;
        bmi = weight / (hM * hM);
        bmiCategory = getBmiCategory(bmi);
    }

    if (weight > 0 && height > 0 && age > 0) {
        bmr = gender === 'male' 
            ? (10 * weight + 6.25 * height - 5 * age + 5)
            : (10 * weight + 6.25 * height - 5 * age - 161);
        tdee = bmr * activityLevel;
    }

    return { bmi, bmiCategory, bmr, tdee };
};

// --- NCDs Risk Evaluation Logic ---
const evaluateNCDStatus = (bmi: number, sys: number, dia: number, fbs: number) => {
    let status = 'normal';
    const risks = [];

    // 1. Diabetes Risk (FBS)
    if (fbs > 0) {
        if (fbs >= 126) { 
            if(status !== 'sick') status = 'sick'; 
            risks.push('น้ำตาลสูง (เบาหวาน)');
        } else if (fbs >= 100) {
            if(status === 'normal') status = 'risk';
            risks.push('น้ำตาลเริ่มสูง');
        }
    }

    // 2. Hypertension Risk (BP)
    if (sys > 0 && dia > 0) {
        if (sys >= 140 || dia >= 90) {
            if(status !== 'sick') status = 'sick';
            risks.push('ความดันสูง');
        } else if (sys >= 120 || dia >= 80) {
            if(status === 'normal') status = 'risk';
            risks.push('ความดันเริ่มสูง');
        }
    }

    // 3. Obesity Risk (BMI - Asian Criteria)
    if (bmi > 0) {
        if (bmi >= 25) { // Obese
            if(status === 'normal') status = 'risk'; // Obesity alone is usually 'Risk' unless paired with others, but let's flagging as high risk
            risks.push('โรคอ้วน');
        } else if (bmi >= 23) { // Overweight
            if(status === 'normal') status = 'risk';
            risks.push('น้ำหนักเกิน');
        }
    }

    // Return Display Config
    if (status === 'sick') {
        return { 
            label: 'กลุ่มป่วย / สีแดง', 
            desc: risks.join(', ') || 'ค่าสุขภาพเกินเกณฑ์อันตราย',
            color: 'bg-red-500 text-white', 
            icon: '🚨',
            borderColor: 'border-red-200'
        };
    } else if (status === 'risk') {
        return { 
            label: 'กลุ่มเสี่ยง / สีเหลือง-ส้ม', 
            desc: risks.join(', ') || 'ควรปรับพฤติกรรม',
            color: 'bg-orange-500 text-white', 
            icon: '⚠️',
            borderColor: 'border-orange-200'
        };
    } else {
        return { 
            label: 'กลุ่มปกติ / สีเขียว', 
            desc: 'สุขภาพอยู่ในเกณฑ์ดี',
            color: 'bg-green-500 text-white', 
            icon: '✅',
            borderColor: 'border-green-200'
        };
    }
};

// --- CHART COMPONENTS ---

type TimeFrame = 'daily' | 'weekly' | 'monthly';

interface ChartDataPoint {
    label: string;
    value: number;
    subValue?: number; // Optional secondary value (e.g., steps)
}

const HealthTrendChart: React.FC<{
    data: any[];
    dataKey: string; // Key to sum up (e.g., 'calories', 'amount')
    dateKey: string;
    timeFrame: TimeFrame;
    color: string;
    unit: string;
    secondaryDataKey?: string; // Optional key for secondary extraction (e.g. Steps from name)
    secondaryExtractor?: (item: any) => number;
}> = ({ data, dataKey, dateKey, timeFrame, color, unit, secondaryDataKey, secondaryExtractor }) => {
    
    const chartData: ChartDataPoint[] = useMemo(() => {
        const points: ChartDataPoint[] = [];
        const now = new Date();
        const grouped: Record<string, { value: number, subValue: number }> = {};

        // Helper to format keys
        const getGroupKey = (date: Date): string => {
            if (timeFrame === 'daily') return date.toLocaleDateString('th-TH', { weekday: 'short' });
            if (timeFrame === 'weekly') {
                // Simple week grouping (Week -1, Week -2)
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const weekNum = Math.ceil(diffDays / 7);
                return weekNum === 1 ? 'สัปดาห์นี้' : `-${weekNum-1} สัปดาห์`;
            }
            if (timeFrame === 'monthly') return date.toLocaleDateString('th-TH', { month: 'short' });
            return '';
        };

        // Filter range
        let daysLimit = 7;
        if (timeFrame === 'weekly') daysLimit = 28; // 4 weeks
        if (timeFrame === 'monthly') daysLimit = 180; // 6 months

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysLimit);

        // Init Data Points Structure based on Timeframe to ensure order
        if (timeFrame === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('th-TH', { weekday: 'short' });
                grouped[key] = { value: 0, subValue: 0 };
                points.push({ label: key, value: 0 }); // Placeholder order
            }
        }

        // Aggregate Data
        data.forEach(item => {
            const itemDate = new Date(item[dateKey]);
            if (itemDate >= cutoffDate) {
                const key = getGroupKey(itemDate);
                if (!grouped[key]) grouped[key] = { value: 0, subValue: 0 };
                
                // Sum Primary Value
                grouped[key].value += (Number(item[dataKey]) || 0);
                
                // Sum Secondary Value (e.g. Steps)
                if (secondaryExtractor) {
                    grouped[key].subValue += secondaryExtractor(item);
                }
            }
        });

        // Finalize Data Array
        if (timeFrame === 'daily') {
            return points.map(p => ({
                label: p.label,
                value: grouped[p.label]?.value || 0,
                subValue: grouped[p.label]?.subValue || 0
            }));
        } else {
            // For weekly/monthly, sorting might be needed or just Object.entries
            // Let's keep it simple: reverse chrono for keys that exist
            return Object.entries(grouped).map(([label, val]) => ({
                label,
                value: val.value,
                subValue: val.subValue
            })).reverse(); // Show recent first usually, but for chart left-to-right needs chronological
        }
    }, [data, dataKey, dateKey, timeFrame, secondaryDataKey]);

    // Normalize for Chart Height
    const maxValue = Math.max(1, ...chartData.map(d => d.value));

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
            <div className="flex items-end justify-between h-32 gap-2 mt-2">
                {chartData.map((d, i) => {
                    const heightPercent = (d.value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                            {/* Value Label on Hover/Top */}
                            <div className="text-[9px] text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full">
                                {d.value.toLocaleString()}
                            </div>
                            
                            {/* Bar */}
                            <div 
                                className={`w-full max-w-[20px] sm:max-w-[30px] rounded-t-md transition-all duration-500 hover:opacity-80 ${color}`}
                                style={{ height: `${Math.max(5, heightPercent)}%` }}
                            ></div>
                            
                            {/* Axis Label */}
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-2 truncate w-full text-center">
                                {d.label}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="text-center mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    แนวโน้ม {unit} ({timeFrame === 'daily' ? 'รายวัน' : timeFrame === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'})
                </p>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---

const PersonalHealthGrid: React.FC<{
    userProfile: any;
    bmiHistory: any[];
    tdeeHistory: any[];
    clinicalHistory: any[];
    caloriesConsumed: number;
    caloriesBurned: number;
    stepsToday: number;
}> = ({ userProfile, bmiHistory, tdeeHistory, clinicalHistory, caloriesConsumed, caloriesBurned, stepsToday }) => {
    const latestBmi = bmiHistory.length > 0 ? bmiHistory[0] : null;
    const latestTdee = tdeeHistory.length > 0 ? tdeeHistory[0] : null;
    
    // Auto-calculate from profile
    const { bmi, bmiCategory, bmr, tdee } = calculateMetrics(userProfile);

    // Prefer calculated values (live), fallback to history
    const displayBMI = bmi > 0 ? bmi.toFixed(1) : (latestBmi ? latestBmi.value.toFixed(1) : '-');
    const displayCategory = bmi > 0 ? bmiCategory : (latestBmi ? latestBmi.category : 'รอการคำนวณ');
    
    const displayTDEE = tdee > 0 ? Math.round(tdee).toLocaleString() : (latestTdee ? Math.round(latestTdee.value).toLocaleString() : '-');
    const displayBMR = bmr > 0 ? Math.round(bmr).toLocaleString() : (latestTdee ? Math.round(latestTdee.bmr).toLocaleString() : '-');
    
    // Calculate Deficit (Calorie Balance)
    // Goal (TDEE) + ActiveBurn - Intake
    const tdeeNum = tdee > 0 ? tdee : (latestTdee ? latestTdee.value : 2000);
    const calorieBalance = (tdeeNum + caloriesBurned) - caloriesConsumed;
    const isDeficit = calorieBalance >= 0;

    // Latest Clinical Data - IMPROVED FIND LOGIC
    // Sort descending by date
    const sortedClinical = [...clinicalHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Find latest NON-NULL values independently
    const latestSystolic = sortedClinical.find(c => c.systolic > 0)?.systolic;
    const latestDiastolic = sortedClinical.find(c => c.diastolic > 0)?.diastolic;
    const latestFbs = sortedClinical.find(c => c.fbs > 0)?.fbs;
    
    // New Metrics
    const latestHba1c = sortedClinical.find(c => c.hba1c > 0)?.hba1c;
    const latestVisceral = sortedClinical.find(c => c.visceral_fat > 0)?.visceral_fat;
    const latestMuscle = sortedClinical.find(c => c.muscle_mass > 0)?.muscle_mass;
    const latestLoggedBmr = sortedClinical.find(c => c.bmr > 0)?.bmr;

    const displayBP = latestSystolic && latestDiastolic 
        ? `${latestSystolic}/${latestDiastolic}` 
        : '-/-';
    
    const displayFBS = latestFbs 
        ? `${latestFbs}` 
        : '-';

    // Use logged BMR if available, else use calculated BMR
    const finalDisplayBMR = latestLoggedBmr 
        ? Math.round(latestLoggedBmr).toLocaleString() 
        : displayBMR;

    // Evaluate Risk Status
    const riskStatus = evaluateNCDStatus(
        bmi, 
        latestSystolic || 0, 
        latestDiastolic || 0, 
        latestFbs || 0
    );

    return (
        <div className="space-y-4 mb-6">
            {/* Health Group Assessment Banner */}
            <div className={`p-4 rounded-2xl shadow-sm border flex items-center justify-between ${riskStatus.borderColor} bg-white dark:bg-gray-800`}>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md ${riskStatus.color}`}>
                        {riskStatus.icon}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">ประเมินกลุ่มสุขภาพ</p>
                        <h3 className="text-lg font-black text-gray-800 dark:text-white">{riskStatus.label}</h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{riskStatus.desc}</p>
                    </div>
                </div>
            </div>

            {/* Row 1: Key Body Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* BMI Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <ScaleIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{displayBMI}</p>
                    <p className="text-[9px] text-slate-500 truncate max-w-full px-1">{displayCategory}</p>
                </div>

                {/* TDEE/BMR Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/30 rounded-full">
                        <FireIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TDEE</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{displayTDEE}</p>
                    <p className="text-[9px] text-slate-500">BMR: {finalDisplayBMR}</p>
                </div>

                {/* Waist/Hip Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                        <ChartBarIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สัดส่วน (ซม.)</p>
                    <div className="flex gap-3 mt-1">
                        <div>
                            <span className="text-[9px] text-slate-400 block">เอว</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile.waist || '-'}</span>
                        </div>
                        <div className="w-[1px] bg-slate-200 dark:bg-gray-600"></div>
                        <div>
                            <span className="text-[9px] text-slate-400 block">สะโพก</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile.hip || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Blood Pressure (BP) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-pink-50 dark:bg-pink-900/30 rounded-full">
                        <HeartIcon className="w-5 h-5 text-pink-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ความดัน (BP)</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{displayBP}</p>
                    <p className="text-[9px] text-slate-500">mmHg</p>
                </div>

                {/* Blood Sugar (FBS) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded-full">
                        <WaterDropIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">น้ำตาล (FBS)</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{displayFBS}</p>
                    <p className="text-[9px] text-slate-500">mg/dL</p>
                </div>

                {/* HbA1c Card (NEW) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-900/30 rounded-full">
                        <HeartIcon className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">น้ำตาลสะสม</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{latestHba1c || '-'}</p>
                    <p className="text-[9px] text-slate-500">HbA1c (%)</p>
                </div>

                {/* Visceral Fat Card (NEW) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-full">
                        <FireIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ไขมันช่องท้อง</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{latestVisceral || '-'}</p>
                    <p className="text-[9px] text-slate-500">Visceral Fat</p>
                </div>

                {/* Muscle Mass Card (NEW) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                        <BoltIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">มวลกล้ามเนื้อ</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white">{latestMuscle || '-'}</p>
                    <p className="text-[9px] text-slate-500">Muscle (kg)</p>
                </div>

                {/* Condition Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-teal-50 dark:bg-teal-900/30 rounded-full">
                        <StethoscopeIcon className="w-5 h-5 text-teal-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">โรคประจำตัว</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight mt-1">
                        {userProfile.healthCondition || 'ไม่มี'}
                    </p>
                </div>
            </div>

            {/* Row 2: Daily Energy Balance */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BoltIcon className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <BoltIcon className="w-4 h-4 text-yellow-400" /> สรุปพลังงานวันนี้ (Energy Balance)
                    </h3>
                    <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-600">
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">กินไป</p>
                            <p className="text-lg font-bold text-orange-400">{caloriesConsumed.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-500">kcal</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">เผาผลาญ</p>
                            <p className="text-lg font-bold text-yellow-400">{caloriesBurned.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-500">kcal</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">ก้าวเดิน</p>
                            <p className="text-lg font-bold text-sky-400">{stepsToday.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-500">ก้าว</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">ลดได้ (Balance)</p>
                            <p className={`text-lg font-bold ${isDeficit ? 'text-green-400' : 'text-red-400'}`}>
                                {isDeficit ? '-' : '+'}{Math.abs(Math.round(calorieBalance)).toLocaleString()}
                            </p>
                            <p className="text-[8px] text-slate-500">kcal</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HealthSummaryCard: React.FC<{ 
    userProfile: any, bmiHistory: any[], waterScore: number, activityScore: number, sleepScore: number, moodScore: number
}> = ({ userProfile, bmiHistory, waterScore, activityScore, sleepScore, moodScore }) => {
    const pillarScores: PillarScore = userProfile.pillarScores || { nutrition: 5, activity: 5, sleep: 5, stress: 5, substance: 5, social: 5 };
    const indicators = [
        { id: 'nutrition', name: 'โภชนาการ', score: Math.max(pillarScores.nutrition * 10, waterScore), icon: '🥗' },
        { id: 'activity', name: 'กิจกรรม', score: Math.max(pillarScores.activity * 10, activityScore), icon: '💪' }, 
        { id: 'sleep', name: 'การนอน', score: sleepScore > 0 ? sleepScore : pillarScores.sleep * 10, icon: '😴' },
        { id: 'stress', name: 'จิตใจ', score: moodScore > 0 ? moodScore : pillarScores.stress * 10, icon: '🧠' },
        { id: 'risk', name: 'ลดความเสี่ยง', score: pillarScores.substance * 10, icon: '🚫' },
        { id: 'social', name: 'ความสัมพันธ์', score: pillarScores.social * 10, icon: '🤝' },
    ];

    const totalScore = indicators.reduce((sum, sub) => sum + sub.score, 0) / indicators.length;
    const overallStatus = getHealthStatus(totalScore);
    const currentBmi = bmiHistory.length > 0 ? bmiHistory[0].value : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-slate-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 text-white">
                <h2 className="text-base font-bold flex items-center gap-2"><ClipboardCheckIcon className="w-5 h-5" /> รายงานคะแนนสุขภาพ (Wellness Score)</h2>
            </div>

            <div className="p-4 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="35" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200 dark:text-gray-600" />
                            <circle cx="50%" cy="50%" r="35" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                strokeDasharray={2 * Math.PI * 35} strokeDashoffset={(2 * Math.PI * 35) * (1 - totalScore / 100)} 
                                className={`${overallStatus.color.replace('text', 'stroke')} transition-all`} strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-xl font-bold ${overallStatus.color}`}>{totalScore.toFixed(0)}</span></div>
                    </div>
                    <div className="text-center sm:text-left">
                        <h2 className={`text-base font-bold ${overallStatus.color}`}>{overallStatus.level}</h2>
                        <div className="flex gap-2 mt-2">
                            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-gray-600 text-[10px]"><span className="font-bold text-slate-500">ID:</span> <span className="font-semibold">{userProfile.researchId || '-'}</span></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {indicators.map((ind) => {
                        const status = getHealthStatus(ind.score);
                        return (
                            <div key={ind.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-50 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{ind.icon}</span>
                                    <div>
                                        <p className="font-semibold text-slate-700 dark:text-gray-200 text-[11px]">{ind.name}</p>
                                        <div className="w-16 h-1 bg-slate-100 dark:bg-gray-600 rounded-full mt-0.5 overflow-hidden">
                                            <div className={`h-full ${status.color.replace('text', 'bg')}`} style={{ width: `${ind.score}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold ${status.color}`}>{ind.score.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const HistoryList: React.FC<{ 
    title: string, 
    data: any[], 
    renderItem: (item: any) => React.ReactNode, 
    icon: React.ReactNode,
    emptyMessage?: string,
    extraContent?: React.ReactNode // Slot for charts
}> = ({ title, data, renderItem, icon, emptyMessage = "ยังไม่มีประวัติการบันทึก", extraContent }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
        <div className="p-3 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
            </div>
        </div>
        
        {/* Render Chart or Extra Content if available */}
        {extraContent}

        <div className="p-2">
            {data.length > 0 ? (
                <div className="space-y-2">
                    {data.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-xs text-gray-400 py-4">{emptyMessage}</p>
            )}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
  const { 
      setActiveView, 
      bmiHistory, 
      tdeeHistory,
      waterHistory, 
      foodHistory,
      calorieHistory,
      activityHistory, 
      sleepHistory, 
      moodHistory, 
      habitHistory, 
      socialHistory, 
      waterGoal, 
      userProfile, 
      currentUser,
      clinicalHistory // Added clinicalHistory
  } = useContext(AppContext);

  // Expanded Tab State to include all requested categories
  const [activeTab, setActiveTab] = useState<'body' | 'food' | 'water' | 'activity' | 'sleep' | 'mood' | 'habit' | 'social'>('body');
  const [chartTimeFrame, setChartTimeFrame] = useState<TimeFrame>('daily');

  const isToday = (d: Date) => { const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); };
  
  // Calculate Today's Stats
  const waterToday = useMemo(() => waterHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.amount, 0), [waterHistory]);
  
  const activityToday = useMemo(() => activityHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.caloriesBurned, 0), [activityHistory]);
  
  // Parse Steps from Activity Name
  const stepsToday = useMemo(() => {
      return activityHistory.filter(e => isToday(new Date(e.date))).reduce((sum, e) => sum + extractSteps(e.name), 0);
  }, [activityHistory]);

  const caloriesConsumedToday = useMemo(() => calorieHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.calories, 0), [calorieHistory]);

  const sleepToday = useMemo(() => sleepHistory.find(e => isToday(new Date(e.date))), [sleepHistory]);
  const moodToday = useMemo(() => moodHistory.find(e => isToday(new Date(e.date))), [moodHistory]);

  // Combine food and calorie logs for display
  const combinedFoodLog = useMemo(() => {
      const foods = foodHistory.map(f => ({ 
          date: f.date, 
          name: f.analysis.description, 
          calories: f.analysis.calories,
          type: 'AI Scan'
      }));
      const cals = calorieHistory.map(c => ({
          date: c.date,
          name: c.name,
          calories: c.calories,
          type: 'Manual'
      }));
      return [...foods, ...cals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [foodHistory, calorieHistory]);

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('th-TH', { 
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
      });
  };

  const TabButton: React.FC<{ id: typeof activeTab, label: string, colorClass: string }> = ({ id, label, colorClass }) => (
      <button 
        onClick={() => { setActiveTab(id); setChartTimeFrame('daily'); }} // Reset chart on tab change
        className={`flex-shrink-0 py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === id 
            ? `${colorClass} text-white shadow-sm` 
            : 'bg-white dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400'
        }`}
      >
          {label}
      </button>
  );

  const TimeFrameSelector = () => (
      <div className="flex justify-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg mx-2 my-2 border border-gray-100 dark:border-gray-600">
          {(['daily', 'weekly', 'monthly'] as const).map(tf => (
              <button 
                key={tf}
                onClick={() => setChartTimeFrame(tf)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    chartTimeFrame === tf 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                  {tf === 'daily' ? 'รายวัน' : tf === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
              </button>
          ))}
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
        <GamificationCard />
        
        {/* New Personal Health Stats Grid */}
        <PersonalHealthGrid 
            userProfile={userProfile}
            bmiHistory={bmiHistory}
            tdeeHistory={tdeeHistory}
            clinicalHistory={clinicalHistory} // Pass clinical history
            caloriesConsumed={caloriesConsumedToday}
            caloriesBurned={activityToday}
            stepsToday={stepsToday}
        />

        <HealthSummaryCard 
            userProfile={userProfile} 
            bmiHistory={bmiHistory} 
            waterScore={Math.min(100, (waterToday / waterGoal) * 100)}
            activityScore={Math.min(100, (activityToday / 300) * 100)}
            sleepScore={sleepToday ? (sleepToday.quality * 20) : 0}
            moodScore={moodToday ? (11 - moodToday.stressLevel) * 10 : 0}
        />

        <div className="flex justify-center gap-3">
            <button onClick={() => setActiveView('assessment')} className="flex items-center gap-2 bg-teal-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-600 transition-all text-xs uppercase tracking-wider transform hover:-translate-y-1 w-full sm:w-auto justify-center">
                <ClipboardCheckIcon className="w-4 h-4" />
                ทำแบบประเมินสุขภาพใหม่
            </button>
        </div>

        {/* --- Health Data Logs Section --- */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-teal-500" />
                    บันทึกข้อมูลล่าสุด
                </h3>
            </div>

            {/* Scrollable Tabs */}
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar mb-2">
                <TabButton id="body" label="ร่างกาย" colorClass="bg-blue-500" />
                <TabButton id="food" label="โภชนาการ" colorClass="bg-orange-500" />
                <TabButton id="water" label="น้ำดื่ม" colorClass="bg-sky-500" />
                <TabButton id="activity" label="กิจกรรม" colorClass="bg-yellow-500" />
                <TabButton id="sleep" label="การนอน" colorClass="bg-indigo-600" />
                <TabButton id="mood" label="อารมณ์" colorClass="bg-rose-500" />
                <TabButton id="habit" label="ความเสี่ยง" colorClass="bg-red-500" />
                <TabButton id="social" label="สังคม" colorClass="bg-teal-600" />
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
                {activeTab === 'body' && (
                    <div className="space-y-4">
                        <HistoryList 
                            title="ดัชนีมวลกาย (BMI)" 
                            icon={<ScaleIcon className="w-4 h-4 text-blue-500" />}
                            data={bmiHistory}
                            renderItem={(item) => (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.value.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">{item.category}</span>
                                </div>
                            )}
                        />
                        <HistoryList 
                            title="การเผาผลาญ (TDEE)" 
                            icon={<FireIcon className="w-4 h-4 text-orange-500" />}
                            data={tdeeHistory}
                            renderItem={(item) => (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{Math.round(item.value).toLocaleString()} kcal</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">BMR: {Math.round(item.bmr)}</span>
                                </div>
                            )}
                        />
                    </div>
                )}

                {activeTab === 'food' && (
                    <HistoryList 
                        title="รายการอาหารล่าสุด" 
                        icon={<BeakerIcon className="w-4 h-4 text-orange-500" />}
                        data={combinedFoodLog}
                        extraContent={
                            <div>
                                <TimeFrameSelector />
                                <HealthTrendChart 
                                    data={combinedFoodLog} 
                                    dataKey="calories" 
                                    dateKey="date"
                                    timeFrame={chartTimeFrame} 
                                    color="bg-orange-400"
                                    unit="Kcal"
                                />
                            </div>
                        }
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-lg">🍽️</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)} • {item.type}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{item.calories} kcal</span>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'water' && (
                    <HistoryList 
                        title="ประวัติการดื่มน้ำ" 
                        icon={<WaterDropIcon className="w-4 h-4 text-sky-500" />}
                        data={waterHistory}
                        extraContent={
                            <div>
                                <TimeFrameSelector />
                                <HealthTrendChart 
                                    data={waterHistory} 
                                    dataKey="amount" 
                                    dateKey="date"
                                    timeFrame={chartTimeFrame} 
                                    color="bg-sky-400"
                                    unit="ml"
                                />
                            </div>
                        }
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-lg">💧</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.amount} มล.</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'activity' && (
                    <HistoryList 
                        title="กิจกรรมการเคลื่อนไหว" 
                        icon={<BoltIcon className="w-4 h-4 text-yellow-500" />}
                        data={activityHistory}
                        extraContent={
                            <div>
                                <TimeFrameSelector />
                                <HealthTrendChart 
                                    data={activityHistory} 
                                    dataKey="caloriesBurned" 
                                    dateKey="date"
                                    timeFrame={chartTimeFrame} 
                                    color="bg-yellow-400"
                                    unit="Kcal"
                                    secondaryDataKey="name"
                                    secondaryExtractor={(item) => extractSteps(item.name)}
                                />
                            </div>
                        }
                        renderItem={(item) => {
                            const steps = extractSteps(item.name);
                            return (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-lg">🏃</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                                {steps > 0 && <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold">{steps.toLocaleString()} ก้าว</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{item.caloriesBurned} kcal</span>
                                </div>
                            );
                        }}
                    />
                )}

                {activeTab === 'sleep' && (
                    <HistoryList 
                        title="บันทึกการนอนหลับ" 
                        icon={<MoonIcon className="w-4 h-4 text-indigo-500" />}
                        data={sleepHistory}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg">😴</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.duration.toFixed(1)} ชั่วโมง</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[...Array(item.quality)].map((_, i) => <span key={i} className="text-xs text-yellow-400">★</span>)}
                                </div>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'mood' && (
                    <HistoryList 
                        title="บันทึกอารมณ์" 
                        icon={<FaceSmileIcon className="w-4 h-4 text-rose-500" />}
                        data={moodHistory}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{item.moodEmoji}</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">ความเครียด {item.stressLevel}/10</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'habit' && (
                    <HistoryList 
                        title="พฤติกรรมเสี่ยง" 
                        icon={<NoSymbolIcon className="w-4 h-4 text-red-500" />}
                        data={habitHistory}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${item.isClean ? 'bg-green-100' : 'bg-red-100'}`}>
                                        {item.isClean ? '🌿' : '🚬'}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${item.isClean ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.isClean ? 'Clean Day (ลดละเลิก)' : `มีความเสี่ยง (${item.type})`}
                                        </p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                                {!item.isClean && <span className="text-xs font-bold text-red-500">{item.amount} ครั้ง/หน่วย</span>}
                            </div>
                        )}
                    />
                )}

                {activeTab === 'social' && (
                    <HistoryList 
                        title="กิจกรรมทางสังคม" 
                        icon={<UserGroupIcon className="w-4 h-4 text-teal-500" />}
                        data={socialHistory}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-lg">🤝</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.interaction}</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${item.feeling === 'energized' ? 'bg-green-100 text-green-700' : item.feeling === 'drained' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {item.feeling}
                                </span>
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
