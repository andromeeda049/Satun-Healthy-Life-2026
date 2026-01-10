
import React, { useState, useMemo, useContext } from 'react';
import { ACTIVITY_LEVELS } from '../constants';
import { AppContext } from '../context/AppContext';
import { TDEEHistoryEntry } from '../types';
import { TrashIcon, ShareIcon } from './icons';

const calculateBmr = (weight: number, height: number, age: number, gender: 'male' | 'female'): number => {
    return gender === 'male' ? (10 * weight + 6.25 * height - 5 * age + 5) : (10 * weight + 6.25 * height - 5 * age - 161);
};

const TDEECalculator: React.FC = () => {
  const { tdeeHistory: history, setTdeeHistory: setHistory, userProfile, clearTdeeHistory } = useContext(AppContext);
  
  const [age, setAge] = useState<string>(userProfile.age || '');
  const [gender, setGender] = useState<'male' | 'female'>(userProfile.gender || 'male');
  const [height, setHeight] = useState<string>(userProfile.height || '');
  const [weight, setWeight] = useState<string>(userProfile.weight || '');
  const [activityLevel, setActivityLevel] = useState<number>(userProfile.activityLevel || ACTIVITY_LEVELS[2].value);
  const [tdee, setTdee] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);

  const calculateTdee = () => {
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    if (ageNum > 0 && heightNum > 0 && weightNum > 0) {
      const bmrValue = calculateBmr(weightNum, heightNum, ageNum, gender);
      const tdeeValue = bmrValue * activityLevel;
      setBmr(bmrValue);
      setTdee(tdeeValue);
      const newEntry: TDEEHistoryEntry = { value: tdeeValue, bmr: bmrValue, date: new Date().toISOString() };
      setHistory(prevHistory => [newEntry, ...prevHistory].slice(0, 10));
    }
  };
  
  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center uppercase tracking-tight">TDEE Calculator</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">อายุ (ปี)</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-base focus:border-sky-500 outline-none"/></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">เพศ</label><select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-sm focus:border-sky-500 outline-none"><option value="male">ชาย</option><option value="female">หญิง</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ส่วนสูง (ซม.)</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-base focus:border-sky-500 outline-none"/></div>
            <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">น้ำหนัก (กก.)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-base focus:border-sky-500 outline-none"/></div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ระดับกิจกรรม</label>
            <select value={activityLevel} onChange={(e) => setActivityLevel(parseFloat(e.target.value))} className="w-full px-3 py-2.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 rounded-xl font-semibold text-xs focus:border-sky-500 outline-none">
              {ACTIVITY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </div>
          <button onClick={calculateTdee} className="w-full bg-sky-500 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-sky-600 transition-all active:scale-95 uppercase text-xs">Calculate TDEE</button>
        </div>

        {tdee !== null && (
          <div className="mt-6 bg-slate-50 dark:bg-gray-900/50 p-6 rounded-xl border border-slate-100 dark:border-gray-800 animate-bounce-in">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">BMR</p><p className="text-xl font-bold text-slate-800 dark:text-white">{Math.round(bmr!).toLocaleString()}</p></div>
              <div className="border-l border-slate-200 dark:border-gray-700"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">TDEE</p><p className="text-xl font-bold text-sky-600 dark:text-sky-400">{Math.round(tdee).toLocaleString()}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TDEECalculator;
