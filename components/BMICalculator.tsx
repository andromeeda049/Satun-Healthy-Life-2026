
import React, { useState, useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { BMIHistoryEntry } from '../types';
import { TrashIcon, ShareIcon } from './icons';

const getBmiCategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'น้ำหนักน้อยกว่าเกณฑ์', color: 'text-blue-600' };
    if (bmi < 23) return { category: 'สมส่วน', color: 'text-green-600' };
    if (bmi < 25) return { category: 'น้ำหนักเกิน', color: 'text-yellow-600' };
    if (bmi < 30) return { category: 'โรคอ้วนระดับที่ 1', color: 'text-orange-600' };
    return { category: 'โรคอ้วนระดับที่ 2', color: 'text-red-600' };
};

const BMICalculator: React.FC = () => {
  const { bmiHistory: history, setBmiHistory: setHistory, userProfile, clearBmiHistory } = useContext(AppContext);

  const [height, setHeight] = useState<string>(userProfile.height || '');
  const [weight, setWeight] = useState<string>(userProfile.weight || '');
  const [bmi, setBmi] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

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
  
  const bmiResult = useMemo(() => {
    if (bmi === null) return null;
    const { category, color } = getBmiCategory(bmi);
    return { value: bmi.toFixed(2), category, color };
  }, [bmi]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center uppercase tracking-tight">BMI Calculator</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">ส่วนสูง (ซม.)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-lg focus:border-red-500 outline-none transition-all"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">น้ำหนัก (กก.)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" className="w-full px-4 py-3 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-lg focus:border-red-500 outline-none transition-all"/>
          </div>
        </div>
        <button onClick={calculateBmi} className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-red-600 transition-all active:scale-95 text-xs uppercase tracking-wider">คำนวณค่า BMI</button>
        
        {bmiResult && (
          <div className="mt-6 text-center bg-slate-50 dark:bg-gray-900/50 p-6 rounded-xl border border-slate-100 dark:border-gray-800 animate-bounce-in">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ดัชนีมวลกาย</p>
            <p className={`text-5xl font-bold my-2 ${bmiResult.color}`}>{bmiResult.value}</p>
            <p className={`text-base font-semibold ${bmiResult.color} uppercase tracking-tight`}>{bmiResult.category}</p>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">ประวัติบันทึก</h3>
                <button onClick={() => setShowConfirmDialog(true)} className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><TrashIcon className="w-3 h-3" /> ล้างประวัติ</button>
            </div>
            <div className="space-y-2">
                {history.map((entry, index) => {
                    const { color } = getBmiCategory(entry.value);
                    return (
                        <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-gray-700/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600">
                            <div><p className={`font-bold text-base ${color}`}>{entry.value.toFixed(2)}</p><p className={`text-[8px] font-bold uppercase tracking-wide ${color}`}>{entry.category}</p></div>
                            <div className="text-right"><p className="text-[9px] font-medium text-slate-400">{new Date(entry.date).toLocaleDateString('th-TH')}</p></div>
                        </div>
                    )
                })}
            </div>
        </div>
      )}
      
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">ยืนยันการลบ?</h3>
                <div className="mt-6 flex gap-3"><button onClick={() => setShowConfirmDialog(false)} className="flex-1 py-2.5 bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-200 font-bold rounded-lg text-xs">ยกเลิก</button><button onClick={() => { clearBmiHistory(); setShowConfirmDialog(false); }} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-lg text-xs shadow-md">ยืนยัน</button></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
