
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { PLANNER_ACTIVITY_LEVELS, CARB_PERCENTAGES, CUISINE_TYPES, DIETARY_PREFERENCES, HEALTH_CONDITIONS, LIFESTYLE_GOALS, XP_VALUES } from '../constants';
import { generateMealPlan } from '../services/geminiService';
import { PlannerResults, MealPlan, PlannerHistoryEntry, MealPlanDay } from '../types';
import { ArrowLeftIcon, SparklesIcon, UserCircleIcon, ScaleIcon, FireIcon, HeartIcon, ChartBarIcon, TrophyIcon, ExclamationTriangleIcon, ClipboardListIcon, TrashIcon, BookOpenIcon, WaterDropIcon, BoltIcon, MoonIcon, NoSymbolIcon, BeakerIcon, StethoscopeIcon } from './icons';
import { AppContext } from '../context/AppContext';

const DayCard: React.FC<{ dayData: MealPlanDay }> = ({ dayData }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 mb-4 animate-slide-up">
            <div className="bg-teal-600 px-4 py-2 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">{dayData.day}</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">Holistic Plan</span>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Nutrition Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <BeakerIcon className="w-5 h-5 text-teal-500" />
                        <h4 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide">โภชนาการ (Nutrition)</h4>
                    </div>
                    <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-sm">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-1">
                            <span className="text-gray-500 dark:text-gray-400 font-bold">เช้า</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[70%]">{dayData.breakfast?.menu}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-1">
                            <span className="text-gray-500 dark:text-gray-400 font-bold">กลางวัน</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[70%]">{dayData.lunch?.menu}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400 font-bold">เย็น</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[70%]">{dayData.dinner?.menu}</span>
                        </div>
                    </div>
                    {/* Specific Tips */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800">
                            <p className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase mb-1">เป้าหมายผักผลไม้</p>
                            <p className="text-xs text-green-800 dark:text-green-200 leading-tight">{dayData.fruitVegGoal || '-'}</p>
                        </div>
                        <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-800">
                            <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase mb-1">ลดหวานมันเค็ม</p>
                            <p className="text-xs text-orange-800 dark:text-orange-200 leading-tight">{dayData.nutritionTip || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Lifestyle Section */}
                <div className="space-y-3">
                    {/* Activity */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-1">
                            <BoltIcon className="w-4 h-4 text-yellow-600" />
                            <h4 className="font-bold text-yellow-700 dark:text-yellow-300 text-xs uppercase">กิจกรรมทางกาย</h4>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{dayData.activity?.name || 'พักผ่อน'}</p>
                            <span className="text-xs bg-white dark:bg-black/20 px-2 py-1 rounded font-mono text-yellow-800 dark:text-yellow-200">
                                {dayData.activity?.durationMinutes || 0} นาที ({dayData.activity?.intensity || '-'})
                            </span>
                        </div>
                    </div>

                    {/* Wellness & Avoidance */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-1 mb-1">
                                <MoonIcon className="w-3 h-3 text-indigo-500" />
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">พักผ่อน & จิตใจ</span>
                            </div>
                            <p className="text-[10px] text-indigo-800 dark:text-indigo-200 leading-tight line-clamp-3">
                                {dayData.wellness?.sleep || dayData.wellness?.stress || '-'}
                            </p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
                            <div className="flex items-center gap-1 mb-1">
                                <NoSymbolIcon className="w-3 h-3 text-red-500" />
                                <span className="text-[9px] font-bold text-red-600 dark:text-red-300 uppercase">ลด ละ เลิก</span>
                            </div>
                            <p className="text-[10px] text-red-800 dark:text-red-200 leading-tight line-clamp-3">
                                {dayData.avoidance || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PersonalizedPlanner: React.FC = () => {
    const { 
        userProfile, 
        setPlannerHistory, 
        savePlannerEntry, 
        currentUser, 
        foodHistory, 
        gainXP, 
        plannerHistory, 
        clinicalHistory,
        goals, // Get user goals
        sleepHistory, // Get sleep data
        moodHistory, // Get mood data
        activityHistory // Get activity data
    } = useContext(AppContext);
    
    // Auto-populate from profile
    const [formData, setFormData] = useState({
        gender: 'male',
        age: '',
        weight: '',
        height: '',
        waist: '',
        hip: '',
        activityLevel: PLANNER_ACTIVITY_LEVELS[2].value,
        carbPercentage: 20,
        cuisine: CUISINE_TYPES[0],
        diet: DIETARY_PREFERENCES[0],
        healthCondition: HEALTH_CONDITIONS[0],
        lifestyleGoal: LIFESTYLE_GOALS[0]
    });

    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                gender: userProfile.gender || 'male',
                age: userProfile.age ? String(userProfile.age) : '',
                weight: userProfile.weight ? String(userProfile.weight) : '',
                height: userProfile.height ? String(userProfile.height) : '',
                waist: userProfile.waist ? String(userProfile.waist) : '',
                hip: userProfile.hip ? String(userProfile.hip) : '',
                activityLevel: userProfile.activityLevel || PLANNER_ACTIVITY_LEVELS[2].value,
                healthCondition: userProfile.healthCondition || HEALTH_CONDITIONS[0]
            }));
        }
    }, [userProfile]);

    const [results, setResults] = useState<PlannerResults | null>(null);
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [viewingHistoryDate, setViewingHistoryDate] = useState<string | null>(null);

    // Super Admin Check
    const isSuperAdmin = currentUser?.organization === 'all';

    // --- CHECK WEEKLY LIMIT (1 time per 7 days) ---
    const canCreatePlan = useMemo(() => {
        if (isSuperAdmin) return true;
        if (plannerHistory.length === 0) return true;
        
        const lastPlanDate = new Date(plannerHistory[0].date);
        const today = new Date();
        
        const diffTime = Math.abs(today.getTime() - lastPlanDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        return diffDays >= 7;
    }, [plannerHistory, isSuperAdmin]);

    // Calculate Preview Stats on the fly
    const previewStats = useMemo(() => {
        const weightN = parseFloat(formData.weight);
        const heightN = parseFloat(formData.height);
        const ageN = parseInt(formData.age);
        
        if (!weightN || !heightN || !ageN) return null;

        const heightM = heightN / 100;
        const bmi = weightN / (heightM * heightM);
        
        let bmiCategory = '';
        if (bmi < 18.5) bmiCategory = 'น้ำหนักน้อยกว่าเกณฑ์';
        else if (bmi < 23) bmiCategory = 'สมส่วน';
        else if (bmi < 25) bmiCategory = 'น้ำหนักเกิน';
        else if (bmi < 30) bmiCategory = 'โรคอ้วนระดับที่ 1';
        else bmiCategory = 'โรคอ้วนระดับที่ 2';
        
        let bmr = (formData.gender === 'male') 
            ? (10 * weightN + 6.25 * heightN - 5 * ageN + 5) 
            : (10 * weightN + 6.25 * heightN - 5 * ageN - 161);
        
        const tdee = bmr * Number(formData.activityLevel);

        // Get Latest Clinical Data (Independent Search)
        const sortedClinical = [...(clinicalHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const latestSystolic = sortedClinical.find(c => c.systolic > 0)?.systolic;
        const latestDiastolic = sortedClinical.find(c => c.diastolic > 0)?.diastolic;
        const latestFbs = sortedClinical.find(c => c.fbs > 0)?.fbs;
        const latestHba1c = sortedClinical.find(c => c.hba1c > 0)?.hba1c;
        const latestVisceral = sortedClinical.find(c => c.visceral_fat > 0)?.visceral_fat;
        const latestMuscle = sortedClinical.find(c => c.muscle_mass > 0)?.muscle_mass;
        const latestBmrLog = sortedClinical.find(c => c.bmr > 0)?.bmr;

        return {
            bmi: bmi.toFixed(1),
            bmiCategory,
            tdee: Math.round(tdee).toLocaleString(),
            bmr: Math.round(latestBmrLog || bmr).toLocaleString(),
            condition: formData.healthCondition,
            waist: formData.waist || '-',
            hip: formData.hip || '-',
            bp: latestSystolic && latestDiastolic ? `${latestSystolic}/${latestDiastolic}` : '-',
            fbs: latestFbs ? `${latestFbs}` : '-',
            hba1c: latestHba1c ? `${latestHba1c}` : '-',
            visceral: latestVisceral ? `${latestVisceral}` : '-',
            muscle: latestMuscle ? `${latestMuscle}` : '-'
        };
    }, [formData, clinicalHistory]);
    
    const handleCalculateAndPlan = async () => {
        if (currentUser?.role === 'guest') return;
        if (!canCreatePlan) {
            alert(`สามารถสร้างแผนได้สัปดาห์ละ 1 ครั้ง กรุณาลองใหม่ในภายหลัง`);
            return;
        }

        setShowResults(true); setLoading(true); setError(null); setViewingHistoryDate(null);
        
        const weightN = parseFloat(formData.weight);
        const heightN = parseFloat(formData.height);
        const ageN = parseInt(formData.age);
        const heightM = heightN / 100;
        const bmi = weightN / (heightM * heightM);
        const whr = parseFloat(formData.waist) / parseFloat(formData.hip);
        let bmr = (formData.gender === 'male') ? (10 * weightN + 6.25 * heightN - 5 * ageN + 5) : (10 * weightN + 6.25 * heightN - 5 * ageN - 161);
        const tdee = bmr * Number(formData.activityLevel);

        const calculated: PlannerResults = { bmi, whr, whrRisk: 'Normal', bmr, tdee, proteinGoal: weightN * 1.5, carbGoal: (tdee * formData.carbPercentage / 100) / 4, fatGoal: 50 };
        setResults(calculated);

        // --- PREPARE CONTEXT FOR AI ---
        const activeGoals = (goals || []).filter(g => g.status === 'active').map(g => ({ type: g.type, targetValue: g.targetValue }));
        
        // Calculate recent averages (Last 7 entries)
        const recentSleep = sleepHistory.slice(0, 7);
        const avgSleep = recentSleep.length > 0 ? (recentSleep.reduce((a, b) => a + b.duration, 0) / recentSleep.length).toFixed(1) : null;
        
        const recentMood = moodHistory.slice(0, 7);
        const avgStress = recentMood.length > 0 ? Math.round(recentMood.reduce((a, b) => a + b.stressLevel, 0) / recentMood.length) : null;

        const recentActivity = activityHistory.slice(0, 7);
        const activityStatus = recentActivity.length > 3 ? 'Active' : 'Sedentary';

        const context = {
            avgSleep,
            avgStress,
            activityStatus
        };

        try {
            const plan = await generateMealPlan(
                calculated, 
                formData.cuisine, 
                formData.diet, 
                formData.healthCondition, 
                formData.lifestyleGoal, 
                activeGoals, // Pass user goals
                context,     // Pass behavioral context
                userProfile.aiSystemInstruction
            );
            setMealPlan(plan);
            const entry: PlannerHistoryEntry = { id: new Date().toISOString(), date: new Date().toISOString(), cuisine: formData.cuisine, diet: formData.diet, tdee, plan };
            savePlannerEntry(entry);
            gainXP(XP_VALUES.PLANNER, 'PLANNER');
        } catch (e: any) {
            console.error("Planner Error:", e);
            setError(e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = (entry: PlannerHistoryEntry) => {
        setResults({ tdee: entry.tdee } as PlannerResults); // Mock minimal results needed for display
        setMealPlan(entry.plan);
        setViewingHistoryDate(entry.date);
        setShowResults(true);
    };

    const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("คุณต้องการลบแผนนี้ออกจากประวัติใช่หรือไม่?")) {
            setPlannerHistory(prev => prev.filter(item => item.id !== id));
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="w-full pb-10">
            {!showResults ? (
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'create' 
                                ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <SparklesIcon className="w-4 h-4" /> สร้างแผนใหม่
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'history' 
                                ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <ClipboardListIcon className="w-4 h-4" /> ประวัติ ({plannerHistory.length})
                        </button>
                    </div>

                    {activeTab === 'create' ? (
                        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg space-y-6 animate-fade-in">
                            <div className="text-center">
                                <SparklesIcon className="w-12 h-12 text-teal-500 mx-auto mb-2" />
                                <h2 className="text-2xl font-bold dark:text-white">Healthy Lifestyle Planner</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    AI จะออกแบบแผนสุขภาพองค์รวม (อาหาร, ออกกำลังกาย, การนอน, ลดความเสี่ยง) ที่ "เหมาะสมกับคุณที่สุด"
                                </p>
                            </div>

                            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-100 dark:border-teal-800 flex items-center gap-4">
                                <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
                                    <UserCircleIcon className="w-8 h-8 text-teal-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-500 uppercase">ออกแบบสำหรับ</p>
                                    <p className="font-bold text-gray-800 dark:text-white text-lg truncate">{currentUser?.displayName}</p>
                                </div>
                            </div>

                            {/* Full Health Metrics Dashboard */}
                            {previewStats && (
                                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ChartBarIcon className="w-4 h-4" /> ข้อมูลสุขภาพปัจจุบัน
                                    </h4>
                                    
                                    {/* Main Metrics - Expanded Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600 flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">BMI</span>
                                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{previewStats.bmi}</span>
                                            <span className="text-[9px] text-gray-500">{previewStats.bmiCategory}</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-orange-100 dark:border-gray-600 flex flex-col items-center">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">TDEE</span>
                                            <span className="text-xl font-black text-orange-500">{previewStats.tdee}</span>
                                            <span className="text-[9px] text-gray-500">BMR: {previewStats.bmr}</span>
                                        </div>
                                        {/* Proportions merged into main grid for wider view */}
                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-purple-100 dark:border-gray-600 flex flex-col items-center justify-center">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">สัดส่วน (ซม.)</span>
                                            <div className="flex gap-3 text-xs">
                                                <span>เอว <b>{previewStats.waist}</b></span>
                                                <span className="text-gray-300">|</span>
                                                <span>สะโพก <b>{previewStats.hip}</b></span>
                                            </div>
                                        </div>
                                        {/* Condition merged */}
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800 flex flex-col items-center justify-center text-center">
                                            <span className="text-[10px] text-red-400 font-bold uppercase mb-1">โรคประจำตัว</span>
                                            <span className="text-xs font-bold text-red-700 dark:text-red-300 line-clamp-2 leading-tight">{previewStats.condition}</span>
                                        </div>
                                    </div>

                                    {/* Detailed Clinical Grid - Expanded Grid */}
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">ความดัน (BP)</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.bp}</span>
                                            <span className="text-[8px] text-gray-400 block">mmHg</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">น้ำตาล (FBS)</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.fbs}</span>
                                            <span className="text-[8px] text-gray-400 block">mg/dL</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">น้ำตาลสะสม</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.hba1c}</span>
                                            <span className="text-[8px] text-gray-400 block">HbA1c (%)</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">ไขมันช่องท้อง</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.visceral}</span>
                                            <span className="text-[8px] text-gray-400 block">Level</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">มวลกล้ามเนื้อ</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.muscle}</span>
                                            <span className="text-[8px] text-gray-400 block">kg</span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">รอบเอว</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white block mt-1">{previewStats.waist}</span>
                                            <span className="text-[8px] text-gray-400 block">cm</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Goal Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                    เป้าหมายของแผน (Plan Goal)
                                </label>
                                <select
                                    name="lifestyleGoal"
                                    value={formData.lifestyleGoal}
                                    onChange={(e) => setFormData({...formData, lifestyleGoal: e.target.value})}
                                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-700 dark:text-white font-medium"
                                >
                                    {LIFESTYLE_GOALS.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleCalculateAndPlan} 
                                disabled={!canCreatePlan}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg transform transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 ${
                                    canCreatePlan 
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <span>สร้างแผนสุขภาพองค์รวม</span>
                                <span className="text-[10px] font-normal opacity-90">
                                    {canCreatePlan 
                                        ? '(Generate Personalized Plan)' 
                                        : '(จำกัด 1 ครั้ง/สัปดาห์ - รอสัปดาห์ถัดไป)'}
                                </span>
                            </button>
                            
                            {!canCreatePlan && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg text-center border border-yellow-200 dark:border-yellow-800">
                                    <strong>Note:</strong> สามารถสร้างแผนได้สัปดาห์ละ 1 ครั้ง เพื่อให้คุณมีเวลาปฏิบัติตามแผนอย่างเต็มที่
                                </div>
                            )}
                        </div>
                    ) : (
                        // History Tab
                        <div className="space-y-4 animate-fade-in">
                            {plannerHistory.length === 0 ? (
                                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 font-bold">ยังไม่มีประวัติแผนสุขภาพ</p>
                                    <button onClick={() => setActiveTab('create')} className="text-teal-500 text-sm font-bold mt-2 hover:underline">สร้างแผนแรกของคุณ</button>
                                </div>
                            ) : (
                                plannerHistory.map(entry => (
                                    <div 
                                        key={entry.id} 
                                        onClick={() => handleViewHistory(entry)}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 font-bold text-xs flex-col">
                                                <span className="text-lg">📅</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{formatDate(entry.date)}</p>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">เป้าหมาย: {Math.round(entry.tdee)} kcal</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{entry.cuisine}</span>
                                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{entry.diet}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteHistory(e, entry.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setShowResults(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                            <ArrowLeftIcon className="w-5 h-5"/> ย้อนกลับ
                        </button>
                        {viewingHistoryDate && (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                แผนเมื่อ: {formatDate(viewingHistoryDate)}
                            </span>
                        )}
                    </div>
                    
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                            <div className="flex flex-col items-center gap-2">
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                                <h3 className="font-bold text-red-600 dark:text-red-400">เกิดข้อผิดพลาด</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                                <button onClick={handleCalculateAndPlan} className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">ลองใหม่อีกครั้ง</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                            <div className="w-16 h-16 border-4 border-t-teal-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI กำลังทำงาน...</h3>
                            <p className="text-gray-500 mt-2">กำลังคำนวณและออกแบบแผนสุขภาพองค์รวมสำหรับคุณ</p>
                        </div>
                    ) : mealPlan && (
                        <div className="animate-fade-in">
                            <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">แผนสุขภาพ 7 วันของคุณ</h3>
                                <p className="text-sm text-gray-500">เป้าหมายพลังงาน: ~{Math.round(results?.tdee || 0)} kcal/วัน</p>
                                <p className="text-xs text-teal-600 font-bold mt-1">Goal: {formData.lifestyleGoal}</p>
                            </div>
                            
                            {/* Render Meal Plan Cards */}
                            {mealPlan.map((dayData, index) => (
                                <DayCard key={index} dayData={dayData} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PersonalizedPlanner;
