
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { LEVEL_THRESHOLDS, ACHIEVEMENTS } from '../constants';
import { StarIcon, TrophyIcon, ClipboardListIcon, XIcon } from './icons';

const GamificationCard: React.FC = () => {
    const { userProfile, currentUser, setActiveView } = useContext(AppContext);
    const [showAllBadges, setShowAllBadges] = useState(false);
    
    if (!currentUser || currentUser.role === 'guest') return null;

    const currentLevel = userProfile.level || 1;
    const currentXP = userProfile.xp || 0;
    const earnedBadges = userProfile.badges || [];

    const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const prevLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    
    const levelProgress = Math.min(100, Math.max(0, ((currentXP - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100));
    const xpNeeded = nextLevelThreshold - currentXP;

    // Get last 3 badges
    const recentBadges = useMemo(() => {
        return earnedBadges
            .slice(-3)
            .map(id => ACHIEVEMENTS.find(a => a.id === id))
            .filter(Boolean);
    }, [earnedBadges]);

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden animate-fade-in">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span className="text-3xl">👑</span> 
                        {currentUser.displayName}
                    </h2>
                    <p className="text-indigo-200 text-sm font-medium">ผู้เชี่ยวชาญสุขภาพ • Level {currentLevel}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-300" />
                        {currentXP.toLocaleString()} HP
                    </div>
                    <button 
                        onClick={() => setActiveView('hpHistory')}
                        className="text-[10px] bg-black/20 hover:bg-black/30 px-2 py-1 rounded flex items-center gap-1 transition-colors font-semibold"
                    >
                        <ClipboardListIcon className="w-3 h-3" />
                        ประวัติ HP
                    </button>
                </div>
            </div>

            <div className="mt-6 relative z-10">
                <div className="flex justify-between text-xs font-medium text-indigo-200 mb-1">
                    <span>Level {currentLevel}</span>
                    <span>{xpNeeded > 0 ? `อีก ${xpNeeded} HP เพื่อ Level ${currentLevel + 1}` : 'Max Level'}</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3">
                    <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${levelProgress}%` }}
                    ></div>
                </div>
            </div>

            {/* Badges Section */}
            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">เหรียญล่าสุด</p>
                    <button 
                        onClick={() => setShowAllBadges(true)}
                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full text-white transition-colors"
                    >
                        ดูเหรียญทั้งหมด &gt;
                    </button>
                </div>
                
                <div className="flex gap-3">
                    {recentBadges.length > 0 ? (
                        recentBadges.map((badge, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1" title={badge?.name}>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl border border-white/20">
                                    {badge?.icon}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-indigo-300 italic">ยังไม่มีเหรียญรางวัล</p>
                    )}
                    <div className="ml-auto flex items-center">
                        <TrophyIcon className="w-8 h-8 text-yellow-400 opacity-50" />
                    </div>
                </div>
            </div>

            {/* All Badges Modal */}
            {showAllBadges && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowAllBadges(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 relative animate-bounce-in max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                                เหรียญรางวัลทั้งหมด
                            </h3>
                            <button onClick={() => setShowAllBadges(false)} className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
                                <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto pr-2 pb-4">
                            <div className="grid grid-cols-3 gap-4">
                                {ACHIEVEMENTS.map(achievement => {
                                    const isUnlocked = earnedBadges.includes(achievement.id);
                                    return (
                                        <div key={achievement.id} className={`flex flex-col items-center text-center p-2 rounded-xl border-2 transition-all ${isUnlocked ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700 grayscale opacity-60'}`}>
                                            <div className="text-4xl mb-2 bg-white dark:bg-gray-700 rounded-full w-14 h-14 flex items-center justify-center shadow-sm">
                                                {achievement.icon}
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white mb-1">{achievement.name}</p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">{achievement.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="text-center pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500">สะสม {earnedBadges.length} / {ACHIEVEMENTS.length} เหรียญ</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationCard;
