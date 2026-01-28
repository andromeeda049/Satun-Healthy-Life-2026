
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getHealthCoachingTip } from '../services/geminiService';
import { SparklesIcon, PhoneIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon, ChartBarIcon } from './icons';
import { SPECIALIST_TEAM } from '../constants';
import { SpecialistId } from '../types';
import { GoogleGenAI } from "@google/genai";

const AICoach: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistId>('general');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [consultCount, setConsultCount] = useState(0);
  
  // New State for Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [canSummarize, setCanSummarize] = useState(true);
  
  const { 
      bmiHistory, tdeeHistory, latestFoodAnalysis, currentUser, waterHistory, userProfile, openSOS,
      sleepHistory, moodHistory, habitHistory, socialHistory // Added history
  } = useContext(AppContext);

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
          
          // Check Summary Limit (1 per week) & Load Cache
          const lastSummaryDate = localStorage.getItem(`last_coach_summary_${currentUser.username}`);
          const storedSummaryText = localStorage.getItem(`last_coach_summary_text_${currentUser.username}`);
          
          if (storedSummaryText) setAiSummary(storedSummaryText);

          if (lastSummaryDate) {
              const lastDate = new Date(lastSummaryDate);
              const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 7) {
                  setCanSummarize(false);
              }
          }
      }
  }, [currentUser, isGuest]);

  const handleGenerateSummary = async () => {
      if (!canSummarize && !aiSummary) return;
      setIsSummarizing(true);
      try {
          const latestSleep = sleepHistory[0] || { duration: '-', quality: '-' };
          const latestMood = moodHistory[0] || { stressLevel: '-' };
          const latestHabit = habitHistory[0] || { isClean: 'N/A' };
          
          const prompt = `
            Analyze User Health History for Overview:
            - Latest BMI: ${bmiHistory[0]?.value?.toFixed(1) || '-'}
            - Recent Sleep: ${latestSleep.duration} hrs (Quality ${latestSleep.quality}/5)
            - Recent Stress: ${latestMood.stressLevel}/10
            - Risk Habit: ${latestHabit.isClean ? 'Clean' : 'Risk detected'}
            - Today Water: ${waterIntakeToday} ml
            
            Task: Provide a short, encouraging 3-point summary of their current health status in Thai.
            Focus on what they are doing well and one thing to improve.
            Format: Plain text with bullet points (1., 2., 3.). No markdown.
          `;

          const config: any = {};
          if (userProfile?.aiSystemInstruction) {
              config.systemInstruction = userProfile.aiSystemInstruction;
          }

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: prompt,
            config: config
          });
          
          const text = response.text || "ไม่สามารถสรุปข้อมูลได้ในขณะนี้";
          setAiSummary(text);
          
          const now = new Date();
          localStorage.setItem(`last_coach_summary_${currentUser?.username}`, now.toISOString());
          localStorage.setItem(`last_coach_summary_text_${currentUser?.username}`, text);
          setCanSummarize(false);

      } catch (e) {
          console.error("Summary Error", e);
          setAiSummary("ระบบ AI กำลังทำงานหนัก กรุณาลองใหม่ภายหลัง");
      } finally {
          setIsSummarizing(false);
      }
  };

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
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full relative animate-fade-in pb-24">
      <button 
        onClick={openSOS}
        className="fixed bottom-24 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-[0_4px_14px_rgba(220,38,38,0.5)] transition-all hover:scale-110 active:scale-95 animate-pulse border-2 border-white dark:border-gray-800 flex items-center justify-center gap-1"
        title="SOS"
      >
        <PhoneIcon className="w-6 h-6" />
        <span className="text-xs font-bold mr-1">SOS</span>
      </button>

      {/* AI Health Summary Section */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-20"><ChartBarIcon className="w-20 h-20" /></div>
          <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-300" /> สรุปภาพรวมสุขภาพ (AI Summary)</h3>
                  <button 
                      onClick={handleGenerateSummary} 
                      disabled={isSummarizing || !canSummarize} 
                      className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm transition-colors border border-white/30 ${
                          canSummarize ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-400/50 cursor-not-allowed text-white/70'
                      }`}
                  >
                      {isSummarizing ? 'กำลังวิเคราะห์...' : !canSummarize ? 'อัปเดตสัปดาห์หน้า' : 'กดเพื่อวิเคราะห์'}
                  </button>
              </div>
              
              {aiSummary ? (
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 animate-fade-in whitespace-pre-line shadow-inner">
                      <p className="text-sm leading-relaxed font-medium">{aiSummary}</p>
                  </div>
              ) : (
                  <p className="text-sm text-indigo-100 font-medium bg-white/10 p-4 rounded-xl border border-white/10 border-dashed">
                      กดปุ่มเพื่อดูสรุปจุดเด่นและจุดที่ควรปรับปรุง ก่อนเลือกปรึกษาผู้เชี่ยวชาญ
                  </p>
              )}
          </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-2">ทีมผู้เชี่ยวชาญ AI</h2>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-black">เลือกปรึกษาเฉพาะด้าน (Hybrid Health Coach)</p>
      </div>

      <div className="mb-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SPECIALIST_TEAM.map((specialist) => {
                  const isSelected = selectedSpecialist === specialist.id;
                  // @ts-ignore
                  const imageUrl = specialist.image;
                  const colorClasses = getColorClasses(specialist.color || 'teal', isSelected);
                  
                  return (
                      <button 
                        key={specialist.id} 
                        onClick={() => handleSpecialistChange(specialist.id as SpecialistId)} 
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all transform ${isSelected ? 'scale-105 shadow-md ' + colorClasses : 'hover:scale-105 ' + colorClasses}`}
                      >
                          <div className={`w-12 h-12 rounded-full overflow-hidden mb-2 border-2 ${isSelected ? 'border-white shadow-sm' : 'border-transparent opacity-80'}`}>
                              {imageUrl ? (
                                  <img src={imageUrl} alt={specialist.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xl">{specialist.icon}</div>
                              )}
                          </div>
                          <span className={`text-[10px] font-bold text-center leading-tight ${isSelected ? 'opacity-100 text-gray-800 dark:text-white' : 'text-gray-500'}`}>{specialist.name}</span>
                      </button>
                  );
              })}
          </div>
      </div>

      {currentSpecialist && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5 border border-gray-100 dark:border-gray-700 animate-fade-in relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-xl transform translate-x-8 -translate-y-8 bg-${currentSpecialist.color}-500`}></div>

              <div className="flex items-center gap-4 mb-3 relative z-10">
                  <div className={`p-0.5 rounded-full bg-white dark:bg-gray-800 shadow-md w-16 h-16 flex-shrink-0 border-2 border-${currentSpecialist.color}-100`}>
                      {/* @ts-ignore */}
                      {currentSpecialist.image ? (
                          // @ts-ignore
                          <img src={currentSpecialist.image} alt={currentSpecialist.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">{currentSpecialist.icon}</div>
                      )}
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{currentSpecialist.name}</h3>
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-wide">{currentSpecialist.role}</p>
                      
                      <div className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-black/20 px-2 py-1 rounded text-[10px] text-gray-600 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-600 shadow-sm backdrop-blur-sm">
                          <UserCircleIcon className="w-3 h-3" />
                          <span>{ (currentSpecialist as any).personality}</span>
                      </div>
                  </div>
              </div>
              
              <div className="relative z-10">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm">
                      <p>{(currentSpecialist as any).description}</p>
                  </div>

                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">หัวข้อปรึกษา (Optional):</p>
                      <div className="flex flex-wrap gap-2">
                          <button 
                              onClick={() => setSelectedTopic(null)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${!selectedTopic ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900' : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}
                          >
                              ทั่วไป
                          </button>
                          {(currentSpecialist as any).topics?.map((topic: string) => (
                              <button
                                  key={topic}
                                  onClick={() => setSelectedTopic(topic === selectedTopic ? null : topic)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm active:scale-95 ${
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
        className={`w-full font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 text-base ${ (!isLimitReached) ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed border' }`}
      >
        {loading 
            ? 'กำลังวิเคราะห์...' 
            : isLimitReached 
                ? 'ครบโควตา 1 ครั้ง/วัน แล้ว' 
                : (
                    <>
                        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                        <span>ปรึกษา {currentSpecialist?.name} {selectedTopic ? `(${selectedTopic})` : ''}</span>
                        {!isSuperAdmin && <span className="text-xs font-normal opacity-70 ml-1">({consultCount}/{DAILY_LIMIT})</span>}
                    </>
                )
        }
      </button>

      {tip && (
        <div className="mt-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-gray-700/50 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-inner animate-fade-in relative">
          <div className="flex items-center gap-3 mb-2">
              {/* @ts-ignore */}
              {currentSpecialist?.image && <img src={currentSpecialist.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />}
              <div>
                  <h4 className="font-black text-indigo-800 dark:text-indigo-300 text-sm">{currentSpecialist?.name} ตอบกลับ:</h4>
              </div>
          </div>
          <div className="text-base text-gray-800 dark:text-gray-100 leading-relaxed font-medium whitespace-pre-line bg-white/60 dark:bg-black/20 p-4 rounded-lg">
              {tip}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-gray-700">
              <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 italic text-center">
                  *คำแนะนำเบื้องต้นจาก AI ไม่ใช่การวินิจฉัยทางการแพทย์
              </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICoach;
