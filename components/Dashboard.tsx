
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView, PillarScore } from '../types';
import { ScaleIcon, FireIcon, CameraIcon, ShareIcon, WaterDropIcon, BeakerIcon, BoltIcon, ChartBarIcon, BookOpenIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, UserCircleIcon, UserGroupIcon, PrinterIcon, HeartIcon } from './icons';
import { PILLAR_LABELS, LEVEL_THRESHOLDS } from '../constants';
import GamificationCard from './GamificationCard';

const getHealthStatus = (score: number) => {
    if (score >= 80) return { level: 'สุขภาพดีเยี่ยม', sub: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' };
    if (score >= 70) return { level: 'สุขภาพดี', sub: 'Good', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-300' };
    if (score >= 60) return { level: 'ความเสี่ยงปานกลาง', sub: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' };
    if (score >= 50) return { level: 'เริ่มมีความเสี่ยง', sub: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' };
    return { level: 'ความเสี่ยงสูง', sub: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' };
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
                <h2 className="text-base font-bold flex items-center gap-2"><ClipboardCheckIcon className="w-5 h-5" /> รายงานสุขภาพ</h2>
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
                            <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-gray-600 text-[10px]"><span className="font-bold text-slate-500">BMI:</span> <span className="font-semibold">{currentBmi.toFixed(1)}</span></div>
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

const Dashboard: React.FC = () => {
  const { setActiveView, bmiHistory, waterHistory, waterGoal, activityHistory, userProfile, currentUser, sleepHistory, moodHistory } = useContext(AppContext);
  const isToday = (d: Date) => { const t = new Date(); return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear(); };
  const waterToday = useMemo(() => waterHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.amount, 0), [waterHistory]);
  const activityToday = useMemo(() => activityHistory.filter(e => isToday(new Date(e.date))).reduce((s, e) => s + e.caloriesBurned, 0), [activityHistory]);
  const sleepToday = useMemo(() => sleepHistory.find(e => isToday(new Date(e.date))), [sleepHistory]);
  const moodToday = useMemo(() => moodHistory.find(e => isToday(new Date(e.date))), [moodHistory]);

  return (
    <div className="space-y-4 animate-fade-in relative pb-10">
        <GamificationCard />
        <HealthSummaryCard 
            userProfile={userProfile} 
            bmiHistory={bmiHistory} 
            waterScore={Math.min(100, (waterToday / waterGoal) * 100)}
            activityScore={Math.min(100, (activityToday / 300) * 100)}
            sleepScore={sleepToday ? (sleepToday.quality * 20) : 0}
            moodScore={moodToday ? (11 - moodToday.stressLevel) * 10 : 0}
        />
        <div className="flex justify-center gap-3">
            <button onClick={() => setActiveView('assessment')} className="flex items-center gap-2 bg-teal-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm text-[11px] uppercase tracking-wider">ประเมินใหม่อีกครั้ง</button>
        </div>
    </div>
  );
};

export default Dashboard;
