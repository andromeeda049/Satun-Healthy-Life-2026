
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView, PillarScore } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon, WaterDropIcon, BeakerIcon, BoltIcon, ChartBarIcon, BookOpenIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, UserCircleIcon, UserGroupIcon, PrinterIcon, HeartIcon, MoonIcon, FaceSmileIcon } from './icons';
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

const PersonalHealthGrid: React.FC<{
    userProfile: any;
    bmiHistory: any[];
    tdeeHistory: any[];
    caloriesConsumed: number;
    caloriesBurned: number;
    stepsToday: number;
}> = ({ userProfile, bmiHistory, tdeeHistory, caloriesConsumed, caloriesBurned, stepsToday }) => {
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

    return (
        <div className="space-y-4 mb-6">
            {/* Row 1: Key Body Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile.waist || '-'}</span>
                        </div>
                        <div className="w-[1px] bg-slate-200 dark:bg-gray-600"></div>
                        <div>
                            <span className="text-[9px] text-slate-400 block">สะโพก</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{userProfile.hip || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Condition Card */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-900/30 rounded-full">
                        <HeartIcon className="w-5 h-5 text-rose-500" />
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
    emptyMessage?: string
}> = ({ title, data, renderItem, icon, emptyMessage = "ยังไม่มีประวัติการบันทึก" }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
        <div className="p-3 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700 flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">{icon}</span>
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
        </div>
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
      waterGoal, 
      userProfile, 
      currentUser 
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState<'body' | 'food' | 'activity' | 'rest'>('body');

  const isToday = (d: Date) => { const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); };
  
  // Calculate Today's Stats
  const waterToday = useMemo(() => waterHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.amount, 0), [waterHistory]);
  
  const activityToday = useMemo(() => activityHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.caloriesBurned, 0), [activityHistory]);
  
  // Parse Steps from Activity Name (Regex look for digits followed by "ก้าว" or "steps")
  const stepsToday = useMemo(() => {
      return activityHistory.filter(e => isToday(new Date(e.date))).reduce((sum, e) => {
          // Look for numbers before "ก้าว" or "Steps" e.g., "เดิน 5,000 ก้าว"
          const match = e.name.match(/(\d{1,3}(,\d{3})*|\d+)\s*(ก้าว|steps)/i);
          if (match) {
              const numStr = match[1].replace(/,/g, ''); // Remove commas
              return sum + parseInt(numStr, 10);
          }
          return sum;
      }, 0);
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

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
        <GamificationCard />
        
        {/* New Personal Health Stats Grid */}
        <PersonalHealthGrid 
            userProfile={userProfile}
            bmiHistory={bmiHistory}
            tdeeHistory={tdeeHistory}
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

        {/* --- Health Data Logs Section --- */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-teal-500" />
                    บันทึกข้อมูลล่าสุด
                </h3>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('body')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'body' ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    ร่างกาย (Body)
                </button>
                <button onClick={() => setActiveTab('food')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'food' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    โภชนาการ (Food)
                </button>
                <button onClick={() => setActiveTab('activity')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'activity' ? 'bg-white dark:bg-gray-700 text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    กิจกรรม (Active)
                </button>
                <button onClick={() => setActiveTab('rest')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'rest' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    พักผ่อน (Rest)
                </button>
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

                {activeTab === 'activity' && (
                    <HistoryList 
                        title="กิจกรรมการเคลื่อนไหว" 
                        icon={<BoltIcon className="w-4 h-4 text-yellow-500" />}
                        data={activityHistory}
                        renderItem={(item) => (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-lg">🏃</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{item.caloriesBurned} kcal</span>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'rest' && (
                    <div className="space-y-4">
                        <HistoryList 
                            title="บันทึกการนอนหลับ" 
                            icon={<MoonIcon className="w-4 h-4 text-indigo-500" />}
                            data={sleepHistory}
                            renderItem={(item) => (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.duration.toFixed(1)} ชั่วโมง</p>
                                        <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[...Array(item.quality)].map((_, i) => <span key={i} className="text-xs text-yellow-400">★</span>)}
                                    </div>
                                </div>
                            )}
                        />
                        <HistoryList 
                            title="บันทึกอารมณ์" 
                            icon={<FaceSmileIcon className="w-4 h-4 text-rose-500" />}
                            data={moodHistory}
                            renderItem={(item) => (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{item.moodEmoji}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">ความเครียด {item.stressLevel}/10</p>
                                            <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => setActiveView('assessment')} className="flex items-center gap-2 bg-teal-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-600 transition-all text-xs uppercase tracking-wider transform hover:-translate-y-1">
                <ClipboardCheckIcon className="w-4 h-4" />
                ทำแบบประเมินสุขภาพใหม่
            </button>
        </div>
    </div>
  );
};

export default Dashboard;
