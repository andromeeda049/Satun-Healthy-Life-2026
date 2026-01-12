
import React, { useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeftIcon, WaterDropIcon, BeakerIcon, BoltIcon, MoonIcon, FaceSmileIcon, HeartIcon, TrophyIcon, ClipboardListIcon, StarIcon, UserGroupIcon } from './icons';
import { XP_VALUES, LEVEL_THRESHOLDS } from '../constants';

interface HPLogItem {
    id: string;
    date: Date;
    action: string;
    detail?: string;
    hp: number;
    icon: React.ReactNode;
    color: string;
}

const XPHistory: React.FC = () => {
    const { 
        setActiveView, 
        userProfile,
        setUserProfile,
        currentUser,
        waterHistory,
        foodHistory,
        calorieHistory,
        activityHistory,
        sleepHistory,
        moodHistory,
        habitHistory,
        socialHistory,
        quizHistory,
        plannerHistory
    } = useContext(AppContext);

    const historyLogs = useMemo(() => {
        const logs: HPLogItem[] = [];

        waterHistory.forEach(h => logs.push({
            id: `water-${h.id}`, date: new Date(h.date), action: 'ดื่มน้ำ', detail: `${h.amount} มล.`,
            hp: XP_VALUES.WATER, icon: <WaterDropIcon className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600'
        }));

        foodHistory.forEach(h => logs.push({
            id: `food-${h.id}`, date: new Date(h.date), action: 'วิเคราะห์อาหาร AI', detail: h.analysis.description,
            hp: XP_VALUES.FOOD, icon: <BeakerIcon className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600'
        }));

        calorieHistory.forEach(h => logs.push({
            id: `cal-${h.id}`, date: new Date(h.date), action: 'บันทึกโภชนาการ', detail: h.name,
            hp: XP_VALUES.CALORIE, icon: <BeakerIcon className="w-4 h-4" />, color: 'bg-orange-100 text-orange-600'
        }));

        activityHistory.forEach(h => logs.push({
            id: `act-${h.id}`, date: new Date(h.date), action: 'ขยับร่างกาย', detail: h.name,
            hp: XP_VALUES.EXERCISE, icon: <BoltIcon className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-600'
        }));

        sleepHistory.forEach(h => logs.push({
            id: `sleep-${h.id}`, date: new Date(h.date), action: 'บันทึกการนอน', detail: `${h.duration.toFixed(1)} ชม.`,
            hp: XP_VALUES.SLEEP, icon: <MoonIcon className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600'
        }));

        moodHistory.forEach(h => logs.push({
            id: `mood-${h.id}`, date: new Date(h.date), action: 'เช็คอินอารมณ์', detail: `เครียด: ${h.stressLevel}/10`,
            hp: XP_VALUES.MOOD, icon: <FaceSmileIcon className="w-4 h-4" />, color: 'bg-rose-100 text-rose-600'
        }));

        habitHistory.forEach(h => logs.push({
            id: `habit-${h.id}`, date: new Date(h.date), action: 'บันทึกพฤติกรรม', detail: h.isClean ? 'Clean Day' : 'มีความเสี่ยง',
            hp: XP_VALUES.WELLNESS, icon: <HeartIcon className="w-4 h-4" />, color: 'bg-green-100 text-green-600'
        }));

        socialHistory.forEach(h => logs.push({
            id: `social-${h.id}`, date: new Date(h.date), action: 'กิจกรรมสังคม', detail: h.interaction,
            hp: XP_VALUES.WELLNESS, icon: <UserGroupIcon className="w-4 h-4" />, color: 'bg-teal-100 text-teal-600'
        }));

        quizHistory.forEach(h => {
            let xp = XP_VALUES.QUIZ;
            let actionName = 'แบบทดสอบความรู้';
            let color = 'bg-amber-100 text-amber-600';

            if (h.type === 'weekly') {
                xp = XP_VALUES.WEEKLY_QUIZ;
                actionName = 'ควิซประจำสัปดาห์';
                color = 'bg-rose-100 text-rose-600';
            } else if (h.type === 'daily') {
                xp = XP_VALUES.DAILY_QUIZ;
                actionName = 'ควิซประจำวัน';
                color = 'bg-cyan-100 text-cyan-600';
            }

            logs.push({
                id: `quiz-${h.id}`, date: new Date(h.date), action: actionName, detail: `คะแนน ${h.score}%`,
                hp: xp, icon: <StarIcon className="w-4 h-4" />, color: color
            });
        });

        // Added Planner History
        plannerHistory.forEach(h => logs.push({
            id: `plan-${h.id}`, date: new Date(h.date), action: 'สร้างแผนสุขภาพ', detail: `${Math.round(h.tdee)} kcal`,
            hp: XP_VALUES.PLANNER, icon: <ClipboardListIcon className="w-4 h-4" />, color: 'bg-teal-100 text-teal-600'
        }));

        return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [waterHistory, foodHistory, calorieHistory, activityHistory, sleepHistory, moodHistory, habitHistory, socialHistory, quizHistory, plannerHistory]);

    // Calculate actual total from logs
    const calculatedTotalXP = useMemo(() => {
        return historyLogs.reduce((sum, log) => sum + log.hp, 0);
    }, [historyLogs]);

    const groupedHistoryLogs = useMemo(() => {
        return historyLogs.reduce((groups, log) => {
            const dateKey = log.date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
            return groups;
        }, {} as { [key: string]: HPLogItem[] });
    }, [historyLogs]);

    // Auto-sync: If userProfile.xp doesn't match sum of logs, update profile
    useEffect(() => {
        if (currentUser && currentUser.role !== 'guest' && userProfile) {
            if (userProfile.xp !== calculatedTotalXP) {
                // Recalculate Level based on corrected XP
                let newLevel = 1;
                for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
                    if (calculatedTotalXP >= LEVEL_THRESHOLDS[i]) {
                        newLevel = i + 1;
                    }
                }
                
                console.log(`Auto-correcting XP: ${userProfile.xp} -> ${calculatedTotalXP}, Level: ${newLevel}`);
                
                const updatedProfile = { ...userProfile, xp: calculatedTotalXP, level: newLevel };
                setUserProfile(updatedProfile, { 
                    displayName: currentUser.displayName, 
                    profilePicture: currentUser.profilePicture 
                });
            }
        }
    }, [calculatedTotalXP, userProfile, currentUser, setUserProfile]);

    return (
        <div className="w-full space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <button onClick={() => setActiveView('dashboard')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">ประวัติ HP</h2>
                <div className="w-10"></div>
            </div>

            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><TrophyIcon className="w-24 h-24" /></div>
                <div className="relative z-10">
                    <p className="text-yellow-100 font-medium text-sm">แต้มสะสมทั้งหมด (Total HP)</p>
                    {/* Display calculatedTotalXP to ensure it matches the list */}
                    <h1 className="text-4xl font-semibold mt-1">{calculatedTotalXP.toLocaleString()} <span className="text-lg font-medium opacity-80">HP</span></h1>
                    <p className="text-xs text-white/80 mt-2">*สะสมได้จากการบันทึกสุขภาพรายวัน</p>
                </div>
            </div>

            <div className="space-y-6 pb-20">
                {historyLogs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p className="mb-2">📭</p>
                        <p className="font-medium">ยังไม่มีประวัติการได้รับแต้ม</p>
                    </div>
                ) : (
                    // Group by date for display
                    Object.entries(groupedHistoryLogs).map(([dateKey, logs]) => (
                        <div key={dateKey} className="animate-slide-up">
                            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 sticky top-16 bg-gray-50 dark:bg-gray-900 py-2 z-10">{dateKey}</h3>
                            <div className="space-y-3">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${log.color}`}>{log.icon}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{log.action}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{log.detail}</p>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-teal-600 dark:text-teal-400 text-sm">+{log.hp} HP</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default XPHistory;
