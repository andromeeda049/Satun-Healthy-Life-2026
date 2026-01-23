
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getHealthCoachingTip } from '../services/geminiService';
import { SparklesIcon, PhoneIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon } from './icons';
import { SPECIALIST_TEAM } from '../constants';
import { SpecialistId } from '../types';

const AICoach: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistId>('general');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [consultCount, setConsultCount] = useState(0);
  
  const { bmiHistory, tdeeHistory, latestFoodAnalysis, currentUser, waterHistory, userProfile, openSOS } = useContext(AppContext);

  const isGuest = currentUser?.role === 'guest';
  const isSuperAdmin = currentUser?.organization === 'all';
  const DAILY_LIMIT = 1;

  const waterIntakeToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return waterHistory
        .filter(entry => new Date(entry.date).toLocaleDateString('en-CA') === today)
        .reduce((sum, entry) => sum + entry.amount, 0);
  }, [waterHistory]);

  useEffect(() => {
      if (currentUser && !isGuest) {
          const todayStr = new Date().toDateString();
          const key = `coach_usage_${currentUser.username}_${todayStr}`;
          const currentUsage = parseInt(localStorage.getItem(key) || '0');
          setConsultCount(currentUsage);
      }
  }, [currentUser, isGuest]);

  const handleGetTip = async () => {
    if (isGuest) return;
    if (!isSuperAdmin && consultCount >= DAILY_LIMIT) return;

    setLoading(true);
    setError(null);
    setTip(null);
    try {
      const tipResult = await getHealthCoachingTip({
        bmi: bmiHistory[0],
        tdee: tdeeHistory[0],
        food: latestFoodAnalysis,
        waterIntake: waterIntakeToday,
        userProfile: userProfile,
        specialistId: selectedSpecialist,
        focusTopic: selectedTopic
      });
      setTip(tipResult);
      if (!isSuperAdmin) {
        const todayStr = new Date().toDateString();
        const key = `coach_usage_${currentUser?.username}_${todayStr}`;
        const newCount = consultCount + 1;
        localStorage.setItem(key, newCount.toString());
        setConsultCount(newCount);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, string> = {
      amber: isSelected ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-200' : 'border-gray-100 hover:border-amber-200',
      emerald: isSelected ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-200' : 'border-gray-100 hover:border-emerald-200',
      orange: isSelected ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-200' : 'border-gray-100 hover:border-orange-200',
      purple: isSelected ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-200' : 'border-gray-100 hover:border-purple-200',
      indigo: isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-100 hover:border-indigo-200',
      rose: isSelected ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-200' : 'border-gray-100 hover:border-rose-200'
    };
    return colorMap[color] || (isSelected ? 'bg-teal-50 border-teal-500' : 'border-gray-100');
  };

  const isLimitReached = !isSuperAdmin && consultCount >= DAILY_LIMIT;
  const currentSpecialist = SPECIALIST_TEAM.find(s => s.id === selectedSpecialist);

  const handleSpecialistChange = (id: SpecialistId) => {
      setSelectedSpecialist(id);
      setSelectedTopic(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-lg w-full relative animate-fade-in">
      <button 
        onClick={openSOS}
        className="fixed bottom-24 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-[0_4px_14px_rgba(220,38,38,0.5)] transition-all hover:scale-110 active:scale-95 animate-pulse border-2 border-white dark:border-gray-800 flex items-center justify-center gap-1"
        title="SOS"
      >
        <PhoneIcon className="w-5 h-5" />
        <span className="text-[10px] font-bold mr-1">SOS</span>
      </button>

      <div className="text-center mb-4">
        <SparklesIcon className="w-12 h-12 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-2">ทีมผู้เชี่ยวชาญ AI</h2>
        <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest font-black">Hybrid Health Coach</p>
      </div>

      <div className="mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPECIALIST_TEAM.map((specialist) => {
                  const isSelected = selectedSpecialist === specialist.id;
                  // @ts-ignore
                  const imageUrl = specialist.image;
                  const colorClasses = getColorClasses(specialist.color || 'teal', isSelected);
                  
                  return (
                      <button 
                        key={specialist.id} 
                        onClick={() => handleSpecialistChange(specialist.id as SpecialistId)} 
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all transform ${isSelected ? 'scale-105 shadow-md ' + colorClasses : 'hover:scale-105 ' + colorClasses}`}
                      >
                          <div className={`w-10 h-10 rounded-full overflow-hidden mb-1.5 border-2 ${isSelected ? 'border-white shadow-sm' : 'border-transparent opacity-80'}`}>
                              {imageUrl ? (
                                  <img src={imageUrl} alt={specialist.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl">{specialist.icon}</div>
                              )}
                          </div>
                          <span className={`text-[9px] font-bold text-center leading-tight ${isSelected ? 'opacity-100 text-gray-800 dark:text-white' : 'text-gray-500'}`}>{specialist.name}</span>
                      </button>
                  );
              })}
          </div>
      </div>

      {currentSpecialist && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 animate-fade-in relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl transform translate-x-8 -translate-y-8 bg-${currentSpecialist.color}-500`}></div>

              <div className="flex items-center gap-3 mb-2 relative z-10">
                  <div className={`p-0.5 rounded-full bg-white dark:bg-gray-800 shadow-md w-14 h-14 flex-shrink-0 border-2 border-${currentSpecialist.color}-100`}>
                      {/* @ts-ignore */}
                      {currentSpecialist.image ? (
                          // @ts-ignore
                          <img src={currentSpecialist.image} alt={currentSpecialist.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">{currentSpecialist.icon}</div>
                      )}
                  </div>
                  <div>
                      <h3 className="text-base font-bold text-gray-800 dark:text-white">{currentSpecialist.name}</h3>
                      <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-0.5 uppercase tracking-wide">{currentSpecialist.role}</p>
                      
                      <div className="inline-flex items-center gap-1 bg-white/80 dark:bg-black/20 px-1.5 py-0.5 rounded text-[9px] text-gray-600 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-600 shadow-sm backdrop-blur-sm">
                          <UserCircleIcon className="w-2.5 h-2.5" />
                          <span>{ (currentSpecialist as any).personality}</span>
                      </div>
                  </div>
              </div>
              
              <div className="relative z-10">
                  <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                      <p>{(currentSpecialist as any).description}</p>
                  </div>

                  <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">หัวข้อปรึกษา (Optional):</p>
                      <div className="flex flex-wrap gap-1.5">
                          <button 
                              onClick={() => setSelectedTopic(null)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border shadow-sm active:scale-95 ${!selectedTopic ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900' : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}
                          >
                              ทั่วไป
                          </button>
                          {(currentSpecialist as any).topics?.map((topic: string) => (
                              <button
                                  key={topic}
                                  onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border shadow-sm active:scale-95 ${
                                      selectedTopic === topic 
                                      ? 'bg-teal-600 text-white border-teal-600' 
                                      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                                  }`}
                              >
                                  {topic}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      <button 
        onClick={handleGetTip} 
        disabled={loading || isGuest || isLimitReached} 
        className={`w-full font-black py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 text-sm ${ (!isLimitReached) ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed border' }`}
      >
        {loading 
            ? 'กำลังวิเคราะห์...' 
            : isLimitReached 
                ? 'ครบโควตา 1 ครั้ง/วัน แล้ว' 
                : (
                    <>
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        <span>ปรึกษา {currentSpecialist?.name} {selectedTopic ? `(${selectedTopic})` : ''}</span>
                        {!isSuperAdmin && <span className="text-[10px] font-normal opacity-70 ml-1">({consultCount}/{DAILY_LIMIT})</span>}
                    </>
                )
        }
      </button>

      {tip && (
        <div className="mt-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-gray-700/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-inner animate-fade-in relative">
          <div className="flex items-center gap-2 mb-2">
              {/* @ts-ignore */}
              {currentSpecialist?.image && <img src={currentSpecialist.image} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />}
              <div>
                  <h4 className="font-black text-indigo-800 dark:text-indigo-300 text-xs">{currentSpecialist?.name} ตอบกลับ:</h4>
              </div>
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium whitespace-pre-line bg-white/60 dark:bg-black/20 p-3 rounded-lg">
              {tip}
          </div>
          <div className="mt-3 pt-1 border-t border-slate-200 dark:border-gray-700">
              <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 italic text-center">
                  *คำแนะนำเบื้องต้นจาก AI ไม่ใช่การวินิจฉัยทางการแพทย์
              </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoach;
