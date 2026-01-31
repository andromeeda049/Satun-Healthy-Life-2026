
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView } from '../types';
import { ScaleIcon, FireIcon, WaterDropIcon, BeakerIcon, BoltIcon, ChartBarIcon, HeartIcon, StethoscopeIcon, XIcon, BrainIcon, MoonIcon, ClipboardListIcon, TargetIcon } from './icons';
import GamificationCard from './GamificationCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// --- Medical Summary Modal ---
const MedicalSummaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, clinicalHistory, bmiHistory, currentUser } = useContext(AppContext);

    // Helpers
    const getLatestClinical = (keys: string[]) => {
        if (!clinicalHistory) return null;
        // Safe Sort Newest First
        const sorted = [...(clinicalHistory || [])].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });

        for (const entry of sorted) {
            const hasData = keys.every(k => {
                // @ts-ignore
                const val = entry[k];
                return val !== undefined && val !== '' && val !== 0 && val !== null;
            });
            if (hasData) return entry;
        }
        return null;
    };

    const latestBPLog = getLatestClinical(['systolic', 'diastolic']);
    const latestFBSLog = getLatestClinical(['fbs']);
    const latestWeightLog = getLatestClinical(['weight']);
    
    const latestBMI = (bmiHistory && bmiHistory.length > 0) ? bmiHistory[0] : null;

    const cvdRisk = userProfile?.riskAssessment?.cvdRiskLevel || 'unknown';
    const riskMap: Record<string, { label: string; color: string; bg: string }> = {
        low: { label: 'เสี่ยงต่ำ (<10%)', color: 'text-green-600', bg: 'bg-green-100' },
        moderate: { label: 'เสี่ยงปานกลาง (10-20%)', color: 'text-yellow-700', bg: 'bg-yellow-100' },
        high: { label: 'เสี่ยงสูง (20-30%)', color: 'text-orange-700', bg: 'bg-orange-100' },
        very_high: { label: 'เสี่ยงสูงมาก (>30%)', color: 'text-red-700', bg: 'bg-red-100' },
        unknown: { label: 'รอการประเมิน', color: 'text-gray-500', bg: 'bg-gray-100' }
    };
    const cvdConfig = riskMap[cvdRisk] || riskMap['unknown'];

    const depressionRisk = userProfile?.riskAssessment?.depressionRisk;
    const depressionSeverity = userProfile?.riskAssessment?.depressionSeverity;
    const sleepRisk = userProfile?.riskAssessment?.sleepApneaRisk;

    const formatDateSafe = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? '' : d.toLocaleDateString('th-TH');
        } catch (e) { return ''; }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative border-t-8 border-teal-600">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-gray-800 transition-colors z-10">
                    <XIcon className="w-5 h-5" />
                </button>

                <div className="p-6 overflow-y-auto">
                    {/* Header: Patient Info */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-white dark:border-gray-600 shadow-md">
                             {userProfile?.profilePicture && (userProfile.profilePicture.startsWith('http') || userProfile.profilePicture.startsWith('data')) ? (
                                <img src={userProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">{userProfile?.profilePicture || '👤'}</div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser?.displayName}</h2>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 font-medium">
                                    อายุ: {userProfile?.age || '-'} ปี
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 font-medium">
                                    เพศ: {userProfile?.gender === 'male' ? 'ชาย' : 'หญิง'}
                                </span>
                            </div>
                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-bold flex items-center gap-1">
                                <StethoscopeIcon className="w-3 h-3" /> Satun Healthy Life Passport
                            </p>
                        </div>
                    </div>

                    {/* Section 1: Conditions */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">โรคประจำตัว (Conditions)</h3>
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold text-sm">
                            {userProfile?.healthCondition || 'ไม่มีโรคประจำตัว'}
                        </div>
                    </div>

                    {/* Section 2: Vital Signs Grid */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">สัญญาณชีพล่าสุด (Last Vitals)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">ความดัน (BP)</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">
                                    {latestBPLog ? `${latestBPLog.systolic}/${latestBPLog.diastolic}` : '-/-'}
                                </p>
                                <p className="text-[9px] text-gray-400 text-right">{latestBPLog ? formatDateSafe(latestBPLog.date) : ''}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">น้ำตาล (FBS)</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">
                                    {latestFBSLog ? latestFBSLog.fbs : '-'} <span className="text-xs font-normal text-gray-500">mg/dL</span>
                                </p>
                                <p className="text-[9px] text-gray-400 text-right">{latestFBSLog ? formatDateSafe(latestFBSLog.date) : ''}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">น้ำหนัก (Weight)</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">
                                    {latestWeightLog ? latestWeightLog.weight : (userProfile?.weight || '-')} <span className="text-xs font-normal text-gray-500">kg</span>
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">ดัชนีมวลกาย (BMI)</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">
                                    {latestBMI?.value ? Number(latestBMI.value).toFixed(1) : '-'}
                                </p>
                                <p className="text-[9px] text-gray-400 text-right truncate">{latestBMI ? latestBMI.category : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Risk Assessment */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ประเมินความเสี่ยง (Risk Assessment)</h3>
                        <div className="space-y-2">
                            <div className={`p-3 rounded-xl border flex justify-between items-center ${cvdConfig.bg} border-transparent`}>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-800">Thai CV Risk</span>
                                <span className={`text-sm font-black ${cvdConfig.color}`}>{cvdConfig.label}</span>
                            </div>
                            <div className="flex gap-2">
                                <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-center items-center text-center ${depressionRisk ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">สุขภาพจิต (2Q/9Q)</span>
                                    <span className={`text-sm font-bold ${depressionRisk ? 'text-orange-600' : 'text-green-600'}`}>
                                        {depressionRisk ? (depressionSeverity ? `เสี่ยง (${depressionSeverity})` : 'มีความเสี่ยง') : 'ปกติ'}
                                    </span>
                                </div>
                                <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-center items-center text-center ${sleepRisk === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">การนอน (STOP-BANG)</span>
                                    <span className={`text-sm font-bold ${sleepRisk === 'high' ? 'text-orange-600' : 'text-blue-600'}`}>
                                        {sleepRisk === 'high' ? 'เสี่ยงสูง' : 'เสี่ยงต่ำ'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-[10px] text-gray-400 mb-3">ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })} {new Date().toLocaleTimeString('th-TH', { timeStyle: 'short' })}</p>
                    <button onClick={onClose} className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">
                        ปิดหน้าต่าง (Close)
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... Helper Functions ...
const getBmiCategory = (bmi: number): string => {
    if (bmi < 18.5) return 'น้ำหนักน้อยกว่าเกณฑ์';
    if (bmi < 23) return 'สมส่วน';
    if (bmi < 25) return 'น้ำหนักเกิน';
    if (bmi < 30) return 'โรคอ้วนระดับที่ 1';
    return 'โรคอ้วนระดับที่ 2';
};

const extractSteps = (name: string): number => {
    const match = name.match(/(\d{1,3}(,\d{3})*|\d+)\s*(ก้าว|steps)/i);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return 0;
};

const calculateMetrics = (profile: any) => {
    if (!profile) return { bmi: 0, bmiCategory: 'รอข้อมูล', bmr: 0, tdee: 0 };
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

// ... Interactive Recharts Component ...
const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {payload[0].value} <span className="text-[10px] font-normal text-gray-500">{unit}</span>
                </p>
                {payload[0].payload.subValue && (
                    <p className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                        {payload[0].payload.subValue}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const HealthTrendChart: React.FC<{
    data: any[];
    dataKey: string;
    dateKey: string;
    colorHex: string;
    unit: string;
    targetValue?: number;
}> = ({ data, dataKey, dateKey, colorHex, unit, targetValue }) => {
    
    const chartData = useMemo(() => {
        // Safe mapping with strict Number conversion
        const mappedData = data.map(item => ({
            ...item,
            value: item[dataKey] !== undefined && item[dataKey] !== '' ? Number(item[dataKey]) : NaN,
            dateObj: new Date(item[dateKey]),
            displayDate: new Date(item[dateKey]).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
        }));

        // Filter valid
        const validData = mappedData.filter(item => 
            !isNaN(item.value) && 
            item.value > 0 && 
            !isNaN(item.dateObj.getTime())
        );

        // Sort oldest to newest
        validData.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // Slice last 14 points for better readability on mobile
        return validData.slice(-14);
    }, [data, dataKey, dateKey]);

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4 text-center">
                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ChartBarIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูล {unit}</p>
                <p className="text-xs text-gray-400">เริ่มบันทึกข้อมูลเพื่อดูแนวโน้มสุขภาพ</p>
            </div>
        );
    }

    // Calculate domain padding
    const minVal = Math.min(...chartData.map(d => d.value), targetValue || Infinity);
    const maxVal = Math.max(...chartData.map(d => d.value), targetValue || -Infinity);
    const domainPadding = (maxVal - minVal) * 0.2; // 20% padding

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-4">
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colorHex} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={colorHex} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="displayDate" 
                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                            axisLine={false}
                            tickLine={false}
                            domain={[
                                Math.max(0, Math.floor(minVal - domainPadding)), 
                                Math.ceil(maxVal + domainPadding)
                            ]}
                        />
                        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: colorHex, strokeWidth: 1, strokeDasharray: '3 3' }} />
                        
                        {targetValue && (
                            <ReferenceLine 
                                y={targetValue} 
                                stroke="#9ca3af" 
                                strokeDasharray="3 3"
                                label={{ 
                                    value: `Target: ${targetValue}`, 
                                    position: 'right', 
                                    fill: '#9ca3af', 
                                    fontSize: 10 
                                }} 
                            />
                        )}

                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={colorHex} 
                            strokeWidth={3}
                            fill={`url(#color-${dataKey})`} 
                            activeDot={{ r: 6, strokeWidth: 0, fill: colorHex }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    แนวโน้ม {unit} (ล่าสุด)
                </p>
            </div>
        </div>
    );
};

const PersonalHealthGrid: React.FC<{
    userProfile: any;
    bmiHistory: any[];
    tdeeHistory: any[];
    clinicalHistory: any[];
    caloriesConsumed: number;
    caloriesBurned: number;
    stepsToday: number;
    setActiveView: (v: AppView) => void;
    onOpenMedicalCard: () => void;
}> = ({ userProfile, bmiHistory, tdeeHistory, clinicalHistory, caloriesConsumed, caloriesBurned, stepsToday, setActiveView, onOpenMedicalCard }) => {
    // ... existing logic ...
    const latestBmi = bmiHistory && bmiHistory.length > 0 ? bmiHistory[0] : null;
    const latestTdee = tdeeHistory && tdeeHistory.length > 0 ? tdeeHistory[0] : null;
    
    const { bmi, bmiCategory, bmr, tdee } = calculateMetrics(userProfile);

    const displayBMI = bmi > 0 ? bmi.toFixed(1) : (latestBmi ? Number(latestBmi.value).toFixed(1) : '-');
    const displayCategory = bmi > 0 ? bmiCategory : (latestBmi ? latestBmi.category : 'รอการคำนวณ');
    
    const displayTDEE = tdee > 0 ? Math.round(tdee).toLocaleString() : (latestTdee ? Math.round(latestTdee.value).toLocaleString() : '-');
    const displayBMR = bmr > 0 ? Math.round(bmr).toLocaleString() : (latestTdee ? Math.round(latestTdee.bmr).toLocaleString() : '-');
    
    const tdeeNum = tdee > 0 ? tdee : (latestTdee ? latestTdee.value : 2000);
    const calorieBalance = (tdeeNum + caloriesBurned) - caloriesConsumed;
    const isDeficit = calorieBalance >= 0;

    const sortedClinical = [...(clinicalHistory || [])].sort((a, b) => {
        return (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0);
    });

    const latestSystolic = sortedClinical.find(c => c.systolic > 0)?.systolic;
    const latestDiastolic = sortedClinical.find(c => c.diastolic > 0)?.diastolic;
    const latestFbs = sortedClinical.find(c => c.fbs > 0)?.fbs;
    
    const displayBP = latestSystolic && latestDiastolic ? `${latestSystolic}/${latestDiastolic}` : '-/-';
    const displayFBS = latestFbs ? `${latestFbs}` : '-';

    const cvdRisk = userProfile?.riskAssessment?.cvdRiskLevel || 'unknown';
    
    const getRiskConfig = (level: string) => {
        switch(level) {
            case 'low': return { label: 'เสี่ยงต่ำ', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
            case 'moderate': return { label: 'เสี่ยงปานกลาง', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
            case 'high': return { label: 'เสี่ยงสูง', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
            case 'very_high': return { label: 'เสี่ยงสูงมาก', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
            default: return { label: 'ยังไม่ประเมิน', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' };
        }
    };

    const depressionRisk = userProfile?.riskAssessment?.depressionRisk;
    const depressionSeverity = userProfile?.riskAssessment?.depressionSeverity;
    const sleepRisk = userProfile?.riskAssessment?.sleepApneaRisk;

    const getMentalConfig = () => {
        if (depressionRisk === undefined) return { label: 'ยังไม่ประเมิน', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' };
        if (!depressionRisk) return { label: 'ปกติ', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        
        if (!depressionSeverity || depressionSeverity === 'normal') return { label: 'เสี่ยงซึมเศร้า', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
        
        const map: any = {
            'mild': 'ซึมเศร้า (น้อย)',
            'moderate': 'ซึมเศร้า (ปานกลาง)',
            'severe': 'ซึมเศร้า (รุนแรง)'
        };
        
        return { 
            label: map[depressionSeverity] || 'เสี่ยงซึมเศร้า', 
            color: depressionSeverity === 'severe' ? 'text-red-600' : 'text-orange-600', 
            bg: depressionSeverity === 'severe' ? 'bg-red-50' : 'bg-orange-50',
            border: depressionSeverity === 'severe' ? 'border-red-200' : 'border-orange-200'
        };
    };

    const getSleepConfig = () => {
        if (!sleepRisk) return { label: 'ยังไม่ประเมิน', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' };
        if (sleepRisk === 'low') return { label: 'ความเสี่ยงต่ำ', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        return { label: 'เสี่ยงสูง (OSA)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    };

    const riskConfig = getRiskConfig(cvdRisk);
    const mentalConfig = getMentalConfig();
    const sleepConfig = getSleepConfig();

    return (
        <div className="space-y-4 mb-6">
            {/* Quick Actions for Medical/Risk */}
            <div className="grid grid-cols-2 gap-3">
                {/* 1. New Medical Summary Button (Medical Card) - MOVED TO FIRST */}
                <button 
                    onClick={onOpenMedicalCard}
                    className="p-3 rounded-2xl shadow-sm border border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800 flex items-center justify-between cursor-pointer transition-transform active:scale-95"
                >
                    <div className="text-left">
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wide">Medical Card</p>
                        <h3 className="text-base font-black text-teal-700 dark:text-teal-300">บัตรสุขภาพ</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm bg-white text-teal-600">
                        <StethoscopeIcon className="w-4 h-4" />
                    </div>
                </button>

                {/* 2. Health Risk Assessment Banner (Thai CVD Risk) - MOVED TO SECOND */}
                <div 
                    onClick={() => setActiveView('riskAssessment')}
                    className={`p-3 rounded-2xl shadow-sm border flex items-center justify-between cursor-pointer transition-transform active:scale-95 ${riskConfig.bg} ${riskConfig.border} dark:bg-gray-800`}
                >
                    <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Thai CVD Risk</p>
                        <h3 className={`text-base font-black ${riskConfig.color}`}>{riskConfig.label}</h3>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm bg-white ${riskConfig.color}`}>
                        <HeartIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Risk Assessment Row 2: Mental & Sleep */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                 <div 
                    onClick={() => setActiveView('riskAssessment')}
                    className={`p-3 rounded-2xl shadow-sm border flex items-center justify-between cursor-pointer transition-transform active:scale-95 ${mentalConfig.bg} ${mentalConfig.border} dark:bg-gray-800 dark:border-gray-700`}
                >
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide truncate">สุขภาพจิต (2Q/9Q)</p>
                        <h3 className={`text-sm font-black ${mentalConfig.color} truncate`}>{mentalConfig.label}</h3>
                    </div>
                    <BrainIcon className={`w-5 h-5 ${mentalConfig.color}`} />
                 </div>
                 
                 <div 
                    onClick={() => setActiveView('riskAssessment')}
                    className={`p-3 rounded-2xl shadow-sm border flex items-center justify-between cursor-pointer transition-transform active:scale-95 ${sleepConfig.bg} ${sleepConfig.border} dark:bg-gray-800 dark:border-gray-700`}
                >
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide truncate">การนอน (STOP-BANG)</p>
                        <h3 className={`text-sm font-black ${sleepConfig.color} truncate`}>{sleepConfig.label}</h3>
                    </div>
                    <MoonIcon className={`w-5 h-5 ${sleepConfig.color}`} />
                 </div>
            </div>

            {/* Row 1: Key Body Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* ... existing metric cards ... */}
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
                    <p className="text-[9px] text-slate-500">BMR: {displayBMR}</p>
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
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile?.waist || '-'}</span>
                        </div>
                        <div className="w-[1px] bg-slate-200 dark:bg-gray-600"></div>
                        <div>
                            <span className="text-[9px] text-slate-400 block">สะโพก</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile?.hip || '-'}</span>
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

                {/* Condition Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-teal-50 dark:bg-teal-900/30 rounded-full">
                        <StethoscopeIcon className="w-5 h-5 text-teal-500" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">โรคประจำตัว</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-tight mt-1">
                        {userProfile?.healthCondition || 'ไม่มี'}
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

const Dashboard: React.FC = () => {
    const { 
        userProfile, bmiHistory, tdeeHistory, clinicalHistory, 
        calorieHistory, activityHistory, setActiveView, goals
    } = useContext(AppContext);

    const [showMedicalCard, setShowMedicalCard] = useState(false);
    const [activeChartTab, setActiveChartTab] = useState('weight');

    // Calculate Daily Stats
    const today = new Date().toDateString();
    
    const caloriesConsumed = useMemo(() => 
        calorieHistory
            .filter(c => new Date(c.date).toDateString() === today)
            .reduce((sum, c) => sum + c.calories, 0)
    , [calorieHistory, today]);

    const caloriesBurned = useMemo(() => 
        activityHistory
            .filter(a => new Date(a.date).toDateString() === today)
            .reduce((sum, a) => sum + a.caloriesBurned, 0)
    , [activityHistory, today]);

    const stepsToday = useMemo(() => {
        let steps = 0;
        activityHistory
            .filter(a => new Date(a.date).toDateString() === today)
            .forEach(a => {
                const s = extractSteps(a.name);
                if (s > 0) steps += s;
            });
        return steps;
    }, [activityHistory, today]);

    // Determine target value for active chart
    const targetValue = useMemo(() => {
        // 1. BMI: Use Standard (23 for Asians)
        if (activeChartTab === 'bmi') return 23;

        // 2. Map Tab ID to Goal Type
        let searchType = activeChartTab;
        if (activeChartTab === 'systolic') searchType = 'bp';

        // 3. Find Goal
        const goal = goals.find(g => g.type === searchType && g.status === 'active');

        if (goal) {
            // Special handling for BP string "120/80"
            if (searchType === 'bp') {
                const parts = goal.targetValue.split('/');
                return parts.length > 0 ? parseFloat(parts[0]) : undefined;
            }
            return parseFloat(goal.targetValue);
        }
        return undefined;
    }, [goals, activeChartTab]);

    // Chart Tabs Data - Expanded
    const chartTabs = [
        { id: 'weight', label: 'น้ำหนัก', icon: <ScaleIcon className="w-3 h-3" />, colorHex: '#8b5cf6', unit: 'kg' },
        { id: 'bmi', label: 'BMI', icon: <ChartBarIcon className="w-3 h-3" />, colorHex: '#3b82f6', unit: '' },
        { id: 'systolic', label: 'ความดัน (บน)', icon: <HeartIcon className="w-3 h-3" />, colorHex: '#f43f5e', unit: 'mmHg' },
        { id: 'fbs', label: 'น้ำตาล (FBS)', icon: <WaterDropIcon className="w-3 h-3" />, colorHex: '#f59e0b', unit: 'mg/dL' },
        { id: 'hba1c', label: 'น้ำตาลสะสม', icon: <BeakerIcon className="w-3 h-3" />, colorHex: '#ef4444', unit: '%' },
        { id: 'waist', label: 'รอบเอว', icon: <ClipboardListIcon className="w-3 h-3" />, colorHex: '#14b8a6', unit: 'cm' },
        { id: 'visceral_fat', label: 'ไขมันช่องท้อง', icon: <FireIcon className="w-3 h-3" />, colorHex: '#f97316', unit: 'Lv' },
        { id: 'muscle_mass', label: 'มวลกล้ามเนื้อ', icon: <BoltIcon className="w-3 h-3" />, colorHex: '#6366f1', unit: 'kg' },
        { id: 'bmr', label: 'BMR', icon: <FireIcon className="w-3 h-3" />, colorHex: '#22c55e', unit: 'kcal' },
    ];

    const currentTabInfo = chartTabs.find(t => t.id === activeChartTab);

    return (
        <div className="pb-24 animate-fade-in space-y-6">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ภาพรวมสุขภาพของคุณ</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold dark:bg-teal-900 dark:text-teal-300">
                        {new Date().toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>

            <GamificationCard />

            <PersonalHealthGrid 
                userProfile={userProfile}
                bmiHistory={bmiHistory}
                tdeeHistory={tdeeHistory}
                clinicalHistory={clinicalHistory}
                caloriesConsumed={caloriesConsumed}
                caloriesBurned={caloriesBurned}
                stepsToday={stepsToday}
                setActiveView={setActiveView}
                onOpenMedicalCard={() => setShowMedicalCard(true)}
            />

            {/* Charts Section with Tabs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ChartBarIcon className="w-5 h-5 text-indigo-500" /> แนวโน้มสุขภาพ
                    </h3>
                    <button 
                        onClick={() => setActiveView('history')}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                    >
                        <ClipboardListIcon className="w-3.5 h-3.5" />
                        ดูประวัติทั้งหมด
                    </button>
                </div>

                {/* Tabs Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {chartTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChartTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                                activeChartTab === tab.id
                                ? `bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-sm`
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dynamic Chart Area */}
                <div>
                    {activeChartTab === 'bmi' && (
                        <HealthTrendChart 
                            data={bmiHistory} 
                            dataKey="value" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#3b82f6'} 
                            unit="BMI" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'weight' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="weight" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#8b5cf6'} 
                            unit="Weight (kg)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'systolic' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="systolic" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#f43f5e'} 
                            unit="BP (Systolic)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'fbs' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="fbs" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#f59e0b'} 
                            unit="FBS (mg/dL)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'hba1c' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="hba1c" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#ef4444'} 
                            unit="HbA1c (%)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'waist' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="waist" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#14b8a6'} 
                            unit="Waist (cm)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'visceral_fat' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="visceral_fat" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#f97316'} 
                            unit="Visceral Fat (Lv)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'muscle_mass' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="muscle_mass" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#6366f1'} 
                            unit="Muscle (kg)" 
                            targetValue={targetValue}
                        />
                    )}
                    {activeChartTab === 'bmr' && (
                        <HealthTrendChart 
                            data={clinicalHistory} 
                            dataKey="bmr" 
                            dateKey="date" 
                            colorHex={currentTabInfo?.colorHex || '#22c55e'} 
                            unit="BMR (kcal)" 
                            targetValue={targetValue}
                        />
                    )}
                </div>
            </div>

            {showMedicalCard && <MedicalSummaryModal onClose={() => setShowMedicalCard(false)} />}
        </div>
    );
};

export default Dashboard;
