
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getHealthCoachingTip } from '../services/geminiService';
import { SparklesIcon, PhoneIcon } from './icons';
import { SPECIALIST_TEAM } from '../constants';
import { SpecialistId } from '../types';

const AICoach: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistId>('general');
  const [canConsult, setCanConsult] = useState(true);
  const { bmiHistory, tdeeHistory, latestFoodAnalysis, currentUser, waterHistory, userProfile, openSOS } = useContext(AppContext);

  const isGuest = currentUser?.role === 'guest';
  const isAdmin = currentUser?.role === 'admin';

  const waterIntakeToday = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return waterHistory
        .filter(entry => new Date(entry.date).toLocaleDateString('en-CA') === today)
        .reduce((sum, entry) => sum + entry.amount, 0);
  }, [waterHistory]);

  useEffect(() => {
      if (currentUser && !isGuest && !isAdmin) {
          const todayStr = new Date().toDateString();
          const lastConsult = localStorage.getItem(`last_coach_consult_${currentUser.username}`);
          if (lastConsult === todayStr) {
              setCanConsult(false);
          }
      }
  }, [currentUser, isGuest, isAdmin]);

  const handleGetTip = async () => {
    if (isGuest) return;
    if (!canConsult && !isAdmin) return;

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
        specialistId: selectedSpecialist
      });
      setTip(tipResult);
      if (!isAdmin) {
        localStorage.setItem(`last_coach_consult_${currentUser?.username}`, new Date().toDateString());
        setCanConsult(false);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, string> = {
      amber: isSelected ? 'text-amber-600 bg-amber-50 border-amber-500 dark:bg-amber-900/30' : 'text-amber-400 border-gray-100 dark:border-gray-700',
      emerald: isSelected ? 'text-emerald-600 bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30' : 'text-emerald-400 border-gray-100 dark:border-gray-700',
      orange: isSelected ? 'text-orange-600 bg-orange-50 border-orange-500 dark:bg-orange-900/30' : 'text-orange-400 border-gray-100 dark:border-gray-700',
      purple: isSelected ? 'text-purple-600 bg-purple-50 border-purple-500 dark:bg-purple-900/30' : 'text-purple-400 border-gray-100 dark:border-gray-700',
      indigo: isSelected ? 'text-indigo-600 bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30' : 'text-indigo-400 border-gray-100 dark:border-gray-700',
      rose: isSelected ? 'text-rose-600 bg-rose-50 border-rose-500 dark:bg-rose-900/30' : 'text-rose-400 border-gray-100 dark:border-gray-700'
    };
    return colorMap[color] || (isSelected ? 'text-teal-600 bg-teal-50 border-teal-500' : 'text-gray-400 border-gray-100');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full relative">
      {/* SOS Button */}
      <button 
        onClick={openSOS}
        className="fixed bottom-24 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-full shadow-[0_4px_14px_rgba(220,38,38,0.5)] transition-all hover:scale-110 active:scale-95 animate-pulse border-2 border-white dark:border-gray-800 flex items-center justify-center gap-2"
        title="SOS ขอความช่วยเหลือ"
      >
        <PhoneIcon className="w-6 h-6" />
        <span className="text-xs font-bold mr-1">SOS</span>
      </button>

      <div className="text-center mb-6">
        <SparklesIcon className="w-16 h-16 mx-auto text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-4">ทีมผู้เชี่ยวชาญ AI</h2>
        <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-black">Hybrid Health Coach</p>
      </div>

      <div className="mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SPECIALIST_TEAM.map((specialist) => {
                  const isSelected = selectedSpecialist === specialist.id;
                  const colorClasses = getColorClasses(specialist.color || 'teal', isSelected);
                  return (
                      <button key={specialist.id} onClick={() => setSelectedSpecialist(specialist.id as SpecialistId)} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all transform ${isSelected ? 'scale-105 shadow-md ' + colorClasses : 'hover:border-gray-200 dark:hover:border-gray-600 ' + colorClasses}`}>
                          <div className={`text-2xl mb-2 ${isSelected ? 'scale-110' : 'opacity-70 grayscale'}`}>{specialist.icon}</div>
                          <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'opacity-100' : 'text-gray-500'}`}>{specialist.name}</span>
                      </button>
                  );
              })}
          </div>
      </div>

      <button onClick={handleGetTip} disabled={loading || isGuest || (!canConsult && !isAdmin)} className={`w-full font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] ${ (canConsult || isAdmin) ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed border' }`}>
        {loading ? 'กำลังวิเคราะห์...' : (!canConsult && !isAdmin) ? 'ครบโควตาปรึกษาวันนี้แล้ว' : `ปรึกษา ${SPECIALIST_TEAM.find(s => s.id === selectedSpecialist)?.name}`}
      </button>

      {tip && (
        <div className="mt-8 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-gray-700/50 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-inner animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-indigo-500" />
              <h4 className="font-black text-indigo-800 dark:text-indigo-300">คำแนะนำเฉพาะบุคคล:</h4>
          </div>
          <div className="text-base text-gray-800 dark:text-gray-100 leading-relaxed font-medium whitespace-pre-line">
              {tip}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-gray-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-gray-400 italic">
                  หมายเหตุ: คำแนะนำนี้เป็นการวิเคราะห์จากข้อมูลที่ผู้ใช้บันทึก และไม่ใช่การวินิจฉัยทางการแพทย์
              </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoach;
