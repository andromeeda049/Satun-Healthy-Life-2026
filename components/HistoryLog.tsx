
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeftIcon, ScaleIcon, FireIcon, ChartBarIcon, ClipboardListIcon, HeartIcon, BoltIcon, BeakerIcon } from './icons';

const HistoryLog: React.FC = () => {
  const context = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('weight');

  // Early return if context is not ready (prevents crash on initial load)
  if (!context) return <div className="p-8 text-center text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>;

  const { bmiHistory, tdeeHistory, clinicalHistory, setActiveView } = context;

  // Safe Arrays with memoization to ensure they are always arrays
  const safeClinical = useMemo(() => Array.isArray(clinicalHistory) ? clinicalHistory : [], [clinicalHistory]);
  const safeBmi = useMemo(() => Array.isArray(bmiHistory) ? bmiHistory : [], [bmiHistory]);
  const safeTdee = useMemo(() => Array.isArray(tdeeHistory) ? tdeeHistory : [], [tdeeHistory]);

  // Safe formatting function
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('th-TH', { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    } catch(e) { return '-'; }
  };

  // Tabs definition
  const tabs = [
      { id: 'weight', label: 'น้ำหนัก (Weight)', icon: <ScaleIcon className="w-4 h-4" /> },
      { id: 'bmi', label: 'ดัชนีมวลกาย (BMI)', icon: <ChartBarIcon className="w-4 h-4" /> },
      { id: 'bp', label: 'ความดัน (BP)', icon: <HeartIcon className="w-4 h-4" /> },
      { id: 'fbs', label: 'น้ำตาล (FBS)', icon: <BeakerIcon className="w-4 h-4" /> },
      { id: 'hba1c', label: 'น้ำตาลสะสม (HbA1c)', icon: <BeakerIcon className="w-4 h-4" /> },
      { id: 'waist', label: 'รอบเอว (Waist)', icon: <ClipboardListIcon className="w-4 h-4" /> },
      { id: 'visceral', label: 'ไขมันช่องท้อง (V.Fat)', icon: <FireIcon className="w-4 h-4" /> },
      { id: 'muscle', label: 'มวลกล้ามเนื้อ (Muscle)', icon: <BoltIcon className="w-4 h-4" /> },
      { id: 'tdee', label: 'พลังงาน (TDEE/BMR)', icon: <FireIcon className="w-4 h-4" /> },
  ];

  // Helper for sorting to avoid repetition and potential errors
  const getSortedData = (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return [...data].sort((a, b) => {
          const dateA = new Date(a?.date || 0).getTime();
          const dateB = new Date(b?.date || 0).getTime();
          return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      });
  };

  const renderContent = () => {
      // Empty State Component
      const EmptyState = ({ label }: { label: string }) => (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-3">
                <ClipboardListIcon className="w-8 h-8 opacity-50" />
              </div>
              <p>ยังไม่มีประวัติ {label}</p>
          </div>
      );

      // Log Row Component
      const LogRow = ({ date, value, subValue, unit }: any) => (
          <div className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
              <div><span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(date)}</span></div>
              <div className="text-right">
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{value}</span> 
                  {unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
                  {subValue && <div className="text-[10px] text-gray-400">{subValue}</div>}
              </div>
          </div>
      );

      try {
          switch(activeTab) {
              case 'weight': {
                  // Filter ensuring object and property exist
                  const data = getSortedData(safeClinical.filter(c => c && c.weight));
                  if(data.length === 0) return <EmptyState label="น้ำหนัก" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.weight} unit="kg" />);
              }
              case 'bmi': {
                  const data = getSortedData(safeBmi.filter(c => c && c.value));
                  if(data.length === 0) return <EmptyState label="BMI" />;
                  return data.map((item, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div><span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(item.date)}</span></div>
                          <div className="flex flex-col items-end">
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{Number(item.value).toFixed(2)}</span>
                              <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{item.category || '-'}</span>
                          </div>
                      </div>
                  ));
              }
              case 'bp': {
                  const data = getSortedData(safeClinical.filter(c => c && (c.systolic || c.diastolic)));
                  if(data.length === 0) return <EmptyState label="ความดันโลหิต" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={`${item.systolic}/${item.diastolic}`} unit="mmHg" />);
              }
              case 'fbs': {
                  const data = getSortedData(safeClinical.filter(c => c && c.fbs));
                  if(data.length === 0) return <EmptyState label="น้ำตาล (FBS)" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.fbs} unit="mg/dL" />);
              }
              case 'hba1c': {
                  const data = getSortedData(safeClinical.filter(c => c && c.hba1c));
                  if(data.length === 0) return <EmptyState label="น้ำตาลสะสม" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.hba1c} unit="%" />);
              }
              case 'waist': {
                  const data = getSortedData(safeClinical.filter(c => c && c.waist));
                  if(data.length === 0) return <EmptyState label="รอบเอว" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.waist} unit="cm" />);
              }
              case 'visceral': {
                  const data = getSortedData(safeClinical.filter(c => c && c.visceral_fat));
                  if(data.length === 0) return <EmptyState label="ไขมันช่องท้อง" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.visceral_fat} unit="Level" />);
              }
              case 'muscle': {
                  const data = getSortedData(safeClinical.filter(c => c && c.muscle_mass));
                  if(data.length === 0) return <EmptyState label="มวลกล้ามเนื้อ" />;
                  return data.map((item, idx) => <LogRow key={idx} date={item.date} value={item.muscle_mass} unit="kg" />);
              }
              case 'tdee': {
                  const data = getSortedData(safeTdee.filter(c => c && c.value));
                  if(data.length === 0) return <EmptyState label="พลังงาน (TDEE)" />;
                  return data.map((item, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div><span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(item.date)}</span></div>
                          <div className="flex flex-col items-end">
                              <div className="text-sm font-bold text-orange-500">TDEE: {Math.round(item.value)}</div>
                              {item.bmr && <div className="text-xs text-gray-500">BMR: {Math.round(item.bmr)}</div>}
                          </div>
                      </div>
                  ));
              }
              default: return <div className="p-8 text-center text-gray-400">เลือกหัวข้อเพื่อดูข้อมูล</div>;
          }
      } catch (e) {
          console.error("History Render Error:", e);
          return <div className="p-4 text-center text-red-500 text-xs">เกิดข้อผิดพลาดในการแสดงผลข้อมูล (Data Error)</div>;
      }
  };

  return (
    <div className="animate-fade-in pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-0 z-20">
        <button 
            onClick={() => setActiveView('dashboard')} 
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-colors"
        >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <ClipboardListIcon className="w-6 h-6 text-teal-500" />
                ประวัติการบันทึก
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">ข้อมูลย้อนหลังทั้งหมด</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto no-scrollbar mx-1 sticky top-20 z-10 shadow-sm">
          {tabs.map(tabItem => (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id)}
                className={`flex-1 min-w-[110px] py-2.5 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0 ${
                    activeTab === tabItem.id 
                    ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-md transform scale-105' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                  {tabItem.icon}
                  <span className="whitespace-nowrap">{tabItem.label}</span>
              </button>
          ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[300px] mx-1">
          {renderContent()}
      </div>
    </div>
  );
};

export default HistoryLog;
