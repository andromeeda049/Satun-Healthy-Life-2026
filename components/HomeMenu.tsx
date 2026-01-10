
import React, { useContext, useMemo, useState } from 'react';
import { AppView } from '../types';
import { AppContext } from '../context/AppContext';
import { 
    CameraIcon, SparklesIcon, ClipboardListIcon, 
    SquaresIcon, UserCircleIcon, WaterDropIcon, 
    BeakerIcon, BoltIcon, HeartIcon, TrophyIcon, XIcon, MedalIcon, StarIcon, ChartBarIcon,
    LineIcon, UserGroupIcon
} from './icons';
import ProactiveInsight from './ProactiveInsight';
import { getWeekNumber } from '../constants';

const HomeMenu: React.FC = () => {
  const { setActiveView, currentUser, userProfile, waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, isDataSynced, foodHistory, quizHistory, myGroups, leaveGroup } = useContext(AppContext);
  const [showProfileAlert, setShowProfileAlert] = useState(() => sessionStorage.getItem('dismiss_profile_alert') !== 'true');

  const isProfileIncomplete = useMemo(() => {
      if (!userProfile) return true;
      const { age, weight, height } = userProfile;
      return !age || age === "" || age === "0" || !weight || weight === "" || weight === "0" || !height || height === "" || height === "0";
  }, [userProfile]);

  const handleDismissAlert = () => {
      setShowProfileAlert(false);
      sessionStorage.setItem('dismiss_profile_alert', 'true');
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
      if(window.confirm(`ต้องการออกจากกลุ่ม "${groupName}" ใช่หรือไม่?`)) {
          await leaveGroup(groupId);
      }
  };

  const dailyProgress = useMemo(() => {
      const today = new Date();
      const weekNum = getWeekNumber(today);
      const isTodayFn = (dStr: string) => {
          const d = new Date(dStr);
          return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      };
      
      const missions = [
          { id: 'water', completed: waterHistory.some(h => isTodayFn(h.date)) },
          { id: 'food', completed: calorieHistory.some(h => isTodayFn(h.date)) || foodHistory.some(h => isTodayFn(h.date)) },
          { id: 'move', completed: activityHistory.some(h => isTodayFn(h.date)) },
          { id: 'mind', completed: moodHistory.some(h => isTodayFn(h.date)) || sleepHistory.some(h => isTodayFn(h.date)) },
          { id: 'weekly_quiz', completed: quizHistory.some(q => q.type === 'weekly' && q.weekNumber === weekNum) }
      ];
      
      const completedCount = missions.filter(m => m.completed).length;
      return { completedCount, total: missions.length, progress: (completedCount / missions.length) * 100, missions };
  }, [waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, foodHistory, quizHistory]);

  const QuickActionButton: React.FC<{ 
      view: AppView; label: string; subLabel: string; icon: React.ReactNode; colorClass: string; completed?: boolean;
  }> = ({ view, label, subLabel, icon, colorClass, completed }) => (
      <button
          onClick={() => setActiveView(view)}
          className={`group relative flex flex-col items-center justify-center p-3.5 rounded-2xl shadow-md border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg active:scale-95 ${
              completed ? 'bg-white border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-white border-slate-100 dark:bg-gray-800 dark:border-gray-700'
          }`}
      >
          {completed && (
              <div className="absolute top-2 right-2 text-emerald-500 z-10 animate-bounce-in">
                  <i className="fa-solid fa-circle-check text-base"></i>
              </div>
          )}
          <div className={`w-11 h-11 flex items-center justify-center rounded-xl mb-2 ${colorClass} shadow-sm transform transition-transform group-hover:scale-105`}>
              {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'text-xl text-white' }) : icon}
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-gray-100 text-center leading-tight tracking-tight">{label}</span>
          <span className="text-[9px] text-slate-400 dark:text-gray-500 text-center mt-0.5 font-medium uppercase">{subLabel}</span>
      </button>
  );

  return (
    <div className="animate-fade-in space-y-4 pb-24">
        {isDataSynced && isProfileIncomplete && showProfileAlert && (
            <div className="p-4 rounded-xl border shadow-sm flex items-start gap-3 bg-white border-blue-400 dark:bg-blue-900/20 relative animate-bounce-in">
                <div className="p-2 bg-blue-50 dark:bg-gray-800 rounded-lg text-blue-600 shadow-sm mt-0.5">
                    <UserCircleIcon className="text-lg" />
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => setActiveView('profile')}>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">ข้อมูลสุขภาพยังไม่ครบถ้วน</h4>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">ระบุวันเกิด, น้ำหนัก, ส่วนสูง เพื่อความแม่นยำ</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDismissAlert(); }} className="text-slate-400 hover:text-slate-900 p-1">
                    <XIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        )}

        <ProactiveInsight />

        {/* Welcome Card */}
        <div 
            onClick={() => setActiveView('dashboard')}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group text-white"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:rotate-12 transition-transform duration-500">
                <ChartBarIcon className="text-[80px] text-white" />
            </div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div>
                    <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">สวัสดี,</p>
                    <h2 className="text-xl font-bold text-white truncate max-w-[200px]">{currentUser?.displayName || 'ผู้ใช้งาน'}</h2>
                </div>
                
                <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-lg border border-white/20 group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                    <ChartBarIcon className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-bold text-white">แดชบอร์ดสุขภาพ &gt;</span>
                </div>
            </div>

            <div className="flex justify-between items-end mb-3 relative z-10">
                <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full shadow-sm uppercase">Level {userProfile?.level || 1}</span>
                        <span className="text-[11px] font-medium text-white/90">{userProfile?.xp?.toLocaleString() || 0} HP</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white leading-none">{dailyProgress.completedCount}<span className="text-sm text-indigo-200 mx-0.5 font-normal">/</span>{dailyProgress.total}</div>
                    <p className="text-[9px] font-semibold text-indigo-200 uppercase mt-1">ภารกิจวันนี้</p>
                </div>
            </div>

            <div className="relative z-10">
                <div className="w-full bg-black/20 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-300 to-emerald-400 h-2 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${dailyProgress.progress}%` }}></div>
                </div>
            </div>
        </div>

        {/* Health Groups List */}
        {myGroups && myGroups.length > 0 && (
            <div>
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                    <div className="w-2 h-0.5 bg-teal-500 rounded-full"></div>
                    กลุ่มสุขภาพของคุณ
                </h3>
                <div className="space-y-3">
                    {myGroups.map(group => (
                        <div key={group.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col gap-3 relative overflow-hidden group">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600 dark:text-teal-400">
                                        <UserGroupIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{group.name}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{group.description}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleLeaveGroup(group.id, group.name)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 relative z-10">
                                {group.lineLink ? (
                                    <a href={group.lineLink} target="_blank" rel="noreferrer" className="flex-1 bg-[#06C755] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-sm">
                                        <LineIcon className="w-4 h-4" /> เข้า LINE กลุ่ม
                                    </a>
                                ) : (
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-400 py-2.5 rounded-xl font-bold text-xs text-center">ไม่มีลิงก์ LINE</div>
                                )}
                            </div>
                            
                            {/* Decorative */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-50 dark:bg-teal-900/10 rounded-full blur-2xl group-hover:bg-teal-100 dark:group-hover:bg-teal-900/20 transition-colors"></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Daily Tasks */}
        <div>
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                <div className="w-2 h-0.5 bg-teal-500 rounded-full"></div>
                ภารกิจรายวัน
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <QuickActionButton view="weeklyQuiz" label="ควิซประจำสัปดาห์" subLabel="รับ 30 HP" icon={<StarIcon />} colorClass="bg-gradient-to-tr from-rose-400 to-rose-500" completed={dailyProgress.missions.find(m => m.id === 'weekly_quiz')?.completed}/>
                <QuickActionButton view="calorieTracker" label="บันทึกอาหาร" subLabel="โภชนาการ" icon={<BeakerIcon />} colorClass="bg-gradient-to-tr from-orange-400 to-orange-500" completed={dailyProgress.missions.find(m => m.id === 'food')?.completed}/>
                <QuickActionButton view="water" label="ดื่มน้ำ" subLabel="Hydration" icon={<WaterDropIcon />} colorClass="bg-gradient-to-tr from-blue-400 to-blue-500" completed={dailyProgress.missions.find(m => m.id === 'water')?.completed}/>
                <QuickActionButton view="activityTracker" label="ขยับร่างกาย" subLabel="Exercise" icon={<BoltIcon />} colorClass="bg-gradient-to-tr from-yellow-400 to-yellow-500" completed={dailyProgress.missions.find(m => m.id === 'move')?.completed}/>
                <QuickActionButton view="wellness" label="เช็คอินสุขภาพ" subLabel="จิตใจและการนอน" icon={<HeartIcon />} colorClass="bg-gradient-to-tr from-red-400 to-red-500" completed={dailyProgress.missions.find(m => m.id === 'mind')?.completed}/>
                <QuickActionButton view="food" label="AI Food Lens" subLabel="วิเคราะห์ 6 มิติ" icon={<CameraIcon />} colorClass="bg-gradient-to-tr from-purple-500 to-purple-600" />
            </div>
        </div>

        {/* Community & Services */}
        <div onClick={() => setActiveView('community')} className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-md cursor-pointer transform active:scale-[0.99] transition-all relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 bg-white/10 w-24 h-24 rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-sm transition-transform">
                    <TrophyIcon className="text-xl text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-semibold text-base">ลำดับคนรักสุขภาพ</h3>
                    <p className="text-orange-50 text-[9px] font-medium opacity-80 uppercase tracking-widest mt-0.5">Community Rankings</p>
                </div>
                <div className="ml-auto bg-white text-orange-600 px-3 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm">ดูอันดับ</div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-slate-100 dark:border-gray-700">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">บริการพิเศษ (Services)</h4>
            <div className="space-y-0.5">
                <button onClick={() => setActiveView('planner')} className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 w-full group transition-all">
                    <div className="p-2.5 rounded-lg mr-3 bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                        <ClipboardListIcon className="text-base" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">แผนอาหารและกิจกรรม 7 วัน</span>
                </button>
                <button onClick={() => setActiveView('dashboard')} className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 w-full group transition-all border-t border-slate-50 dark:border-gray-700">
                    <div className="p-2.5 rounded-lg mr-3 bg-sky-50 text-sky-600 group-hover:scale-105 transition-transform">
                        <SquaresIcon className="text-base" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">สรุปรายงานสุขภาพ (Dashboard)</span>
                </button>
                <button onClick={() => setActiveView('rewards')} className="flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 w-full group transition-all border-t border-slate-50 dark:border-gray-700">
                    <div className="p-2.5 rounded-lg mr-3 bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                        <MedalIcon className="text-base" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">แลกรางวัล (Rewards)</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default HomeMenu;
