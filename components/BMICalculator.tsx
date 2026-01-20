import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { BMIHistoryEntry } from '../types';
import { TrashIcon, ShareIcon, UserCircleIcon } from './icons';

const getBmiCategory = (bmi: number): { category: string; color: string; widthPercent: number } => {
    if (bmi < 18.5) return { category: 'น้ำหนักน้อยกว่าเกณฑ์', color: 'text-blue-600', widthPercent: 15 };
    if (bmi < 23) return { category: 'สมส่วน (สุขภาพดี)', color: 'text-green-600', widthPercent: 40 };
    if (bmi < 25) return { category: 'น้ำหนักเกิน (ท้วม)', color: 'text-yellow-600', widthPercent: 60 };
    if (bmi < 30) return { category: 'โรคอ้วนระดับที่ 1', color: 'text-orange-600', widthPercent: 80 };
    return { category: 'โรคอ้วนระดับที่ 2', color: 'text-red-600', widthPercent: 100 };
};

const BMICalculator: React.FC = () => {
  const { bmiHistory: history, setBmiHistory: setHistory, userProfile, clearBmiHistory } = useContext(AppContext);

  const [height, setHeight] = useState<string>(userProfile.height || '');
  const [weight, setWeight] = useState<string>(userProfile.weight || '');
  const [bmi, setBmi] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const calculateBmi = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const bmiValue = w / (heightInMeters * heightInMeters);
      setBmi(bmiValue);
      const { category } = getBmiCategory(bmiValue);
      const newEntry: BMIHistoryEntry = { value: bmiValue, category: category, date: new Date().toISOString() };
      setHistory(prevHistory => [newEntry, ...prevHistory].slice(0, 10));
    }
  };
  
  const result = useMemo(() => {
    if (bmi === null) return null;
    const { category, color, widthPercent } = getBmiCategory(bmi);
    
    // Ideal Weight Calculation (Based on BMI 18.5 - 22.9 for Asians)
    const h = parseFloat(height) / 100;
    const minWeight = (18.5 * h * h).toFixed(1);
    const maxWeight = (22.9 * h * h).toFixed(1);

    return { value: bmi.toFixed(2), category, color, widthPercent, minWeight, maxWeight };
  }, [bmi, height]);

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCircleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">BMI Calculator</h2>
            <p className="text-xs text-gray-500">คำนวณดัชนีมวลกายและน้ำหนักที่เหมาะสม</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">ส่วนสูง (ซม.)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-lg focus:border-red-500 outline-none transition-all"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">น้ำหนัก (กก.)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-lg focus:border-red-500 outline-none transition-all"/>
          </div>
        </div>
        <button onClick={calculateBmi} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-red-600 transition-all active:scale-95 text-xs uppercase tracking-wider">คำนวณผลลัพธ์</button>
        
        {result && (
          <div className="mt-8 animate-bounce-in">
            <div className="text-center bg-slate-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ค่า BMI ของคุณ</p>
                    <p className={`text-6xl font-black my-2 ${result.color}`}>{result.value}</p>
                    <div className={`inline-block px-4 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-800 shadow-sm ${result.color} uppercase tracking-tight`}>
                        {result.category}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-gray-700">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">น้ำหนักที่เหมาะสมของคุณ</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">
                            {result.minWeight} - {result.maxWeight} <span className="text-sm font-normal text-gray-500">กก.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual Gauge */}
            <div className="mt-4">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex relative">
                    <div className="h-full bg-blue-400 w-[18.5%]" title="ผอม"></div>
                    <div className="h-full bg-green-500 w-[14.5%]" title="สมส่วน"></div>
                    <div className="h-full bg-yellow-400 w-[7%]" title="ท้วม"></div>
                    <div className="h-full bg-orange-500 w-[15%]" title="อ้วน 1"></div>
                    <div className="h-full bg-red-600 w-[45%]" title="อ้วน 2"></div>
                    
                    {/* Marker */}
                    <div 
                        className="absolute top-0 w-1 h-full bg-black dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out" 
                        style={{ left: `${Math.min(100, Math.max(0, (parseFloat(result.value) / 40) * 100))}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-bold uppercase">
                    <span>0</span>
                    <span>18.5</span>
                    <span>23</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40+</span>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">ประวัติการคำนวณ</h3>
                <button onClick={() => setShowConfirmDialog(true)} className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors uppercase tracking-wider">
                    <TrashIcon className="w-4 h-4" /> ล้างประวัติ
                </button>
            </div>
            <div className="space-y-3">
                {history.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-gray-700/50 rounded-xl border border-slate-100 dark:border-gray-700">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">{entry.value.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="text-xs font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm text-slate-600 dark:text-slate-300">{entry.category}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowConfirmDialog(false)}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 transform animate-bounce-in" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrashIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">ล้างประวัติทั้งหมด?</h3>
                <div className="mt-8 flex gap-3">
                    <button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                    <button onClick={() => { clearBmiHistory(); setShowConfirmDialog(false); }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors">ลบรายการ</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;