
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { HealthGoal, ClinicalHistoryEntry, BMIHistoryEntry } from '../types';
import { TargetIcon, ScaleIcon, HeartIcon, BoltIcon, ArrowLeftIcon, XIcon, StarIcon, ChartBarIcon, TrashIcon, FireIcon, ClipboardListIcon, ClipboardCheckIcon, ClockIcon } from './icons';

const GoalProgressCard: React.FC<{
    goal: HealthGoal;
    currentValue: string;
    unit: string;
    onUpdate: () => void;
    onDelete: () => void;
    history: ClinicalHistoryEntry[];
}> = ({ goal, currentValue, unit, onUpdate, onDelete, history }) => {
    
    const [activeTab, setActiveTab] = useState<'status' | 'history'>('status');

    // Calculate Progress Percentage
    const start = parseFloat(goal.startValue);
    const target = parseFloat(goal.targetValue);
    const current = parseFloat(currentValue);
    
    let progress = 0;
    let isAchieved = false;

    // Logic: Is goal to Increase or Decrease?
    if (!isNaN(start) && !isNaN(target) && !isNaN(current)) {
        if (target < start) {
            // Aiming to decrease
            const totalDiff = start - target;
            const currentDiff = start - current;
            progress = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
            if (current <= target) isAchieved = true;
        } else {
            // Aiming to increase
            const totalDiff = target - start;
            const currentDiff = current - start;
            progress = Math.max(0, Math.min(100, (currentDiff / totalDiff) * 100));
            if (current >= target) isAchieved = true;
        }
    }

    const typeIcons: Record<string, React.ReactNode> = {
        weight: <ScaleIcon className="w-5 h-5 text-blue-500" />,
        bp: <HeartIcon className="w-5 h-5 text-red-500" />,
        fbs: <BoltIcon className="w-5 h-5 text-yellow-500" />,
        waist: <ChartBarIcon className="w-5 h-5 text-purple-500" />,
        hba1c: <HeartIcon className="w-5 h-5 text-rose-500" />,
        visceral_fat: <FireIcon className="w-5 h-5 text-orange-500" />,
        muscle_mass: <BoltIcon className="w-5 h-5 text-indigo-500" />,
        bmr: <FireIcon className="w-5 h-5 text-green-500" />
    };

    const typeLabels: Record<string, string> = {
        weight: 'ลดน้ำหนัก (Weight)',
        bp: 'ควบคุมความดัน (BP)',
        fbs: 'ควบคุมน้ำตาล (FBS)',
        waist: 'ลดรอบเอว (Waist)',
        hba1c: 'น้ำตาลสะสม (HbA1c)',
        visceral_fat: 'ไขมันในช่องท้อง (Visceral Fat)',
        muscle_mass: 'เพิ่มมวลกล้ามเนื้อ (Muscle)',
        bmr: 'อัตราเผาผลาญ (BMR)'
    };

    const getHistoryValue = (entry: ClinicalHistoryEntry) => {
        if (goal.type === 'weight') return entry.weight;
        if (goal.type === 'bp') return `${entry.systolic}/${entry.diastolic}`;
        if (goal.type === 'fbs') return entry.fbs;
        if (goal.type === 'waist') return entry.waist;
        if (goal.type === 'hba1c') return entry.hba1c;
        if (goal.type === 'visceral_fat') return entry.visceral_fat;
        if (goal.type === 'muscle_mass') return entry.muscle_mass;
        if (goal.type === 'bmr') return entry.bmr;
        return '-';
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group transition-all hover:shadow-md">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        {typeIcons[goal.type] || <TargetIcon className="w-5 h-5 text-teal-500" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm">{typeLabels[goal.type] || 'เป้าหมายอื่นๆ'}</h3>
                        <p className="text-[10px] text-gray-400">เริ่ม: {new Date(goal.startDate).toLocaleDateString('th-TH')}</p>
                    </div>
                </div>
                <button 
                    onClick={onDelete} 
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-1.5 rounded-full"
                    title="ลบเป้าหมาย"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            {/* In-Card Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-4 relative z-10">
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'status' 
                        ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    <TargetIcon className="w-3 h-3" /> สถานะ
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'history' 
                        ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-400 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                >
                    <ClockIcon className="w-3 h-3" /> ประวัติ ({history.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="relative z-10 min-h-[120px]">
                {activeTab === 'status' ? (
                    <div className="animate-fade-in">
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ปัจจุบัน</p>
                                <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                                    {currentValue} <span className="text-xs font-bold text-gray-400">{unit}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">เป้าหมาย</p>
                                <p className="text-lg font-bold text-teal-600 dark:text-teal-400 leading-none">
                                    {goal.targetValue} <span className="text-xs">{unit}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isAchieved ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <button 
                            onClick={onUpdate}
                            className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800 flex items-center justify-center gap-2"
                        >
                            <ClipboardCheckIcon className="w-4 h-4" /> อัปเดตผลล่าสุด
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {history.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {history.map((h) => (
                                    <div key={h.id} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(h.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(h.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">
                                                {getHistoryValue(h)} <span className="text-[10px] font-normal text-gray-400">{unit}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                <ClipboardListIcon className="w-8 h-8 opacity-30 mb-2" />
                                <p className="text-xs">ยังไม่มีประวัติการบันทึก</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-5 transform rotate-12 scale-150 pointer-events-none">
                {typeIcons[goal.type]}
            </div>
        </div>
    );
};

const AddGoalModal: React.FC<{ onClose: () => void; onSave: (goal: HealthGoal) => void }> = ({ onClose, onSave }) => {
    const [type, setType] = useState<'weight' | 'waist' | 'bp' | 'fbs' | 'hba1c' | 'visceral_fat' | 'muscle_mass' | 'bmr'>('weight');
    const [startValue, setStartValue] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startValue || !targetValue) return alert("กรุณากรอกข้อมูลให้ครบ");
        
        const newGoal: HealthGoal = {
            id: Date.now().toString(),
            type,
            startValue,
            targetValue,
            startDate: new Date().toISOString(),
            deadline: deadline || undefined,
            status: 'active'
        };
        onSave(newGoal);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-bounce-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">ตั้งเป้าหมายใหม่</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">เลือกด้านสุขภาพ</label>
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm"
                        >
                            <option value="weight">ลดน้ำหนัก (Weight)</option>
                            <option value="waist">ลดรอบเอว (Waist)</option>
                            <option value="bp">ควบคุมความดัน (BP)</option>
                            <option value="fbs">ควบคุมน้ำตาล (FBS)</option>
                            <option value="hba1c">น้ำตาลสะสม (HbA1c)</option>
                            <option value="visceral_fat">ไขมันในช่องท้อง (Visceral Fat)</option>
                            <option value="muscle_mass">มวลกล้ามเนื้อ (Muscle Mass)</option>
                            <option value="bmr">อัตราเผาผลาญ (BMR)</option>
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ค่าเริ่มต้น (Start)</label>
                            <input 
                                type="text" 
                                value={startValue} 
                                onChange={(e) => setStartValue(e.target.value)} 
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm"
                                placeholder={type === 'bp' ? '140/90' : '0'}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เป้าหมาย (Target)</label>
                            <input 
                                type="text" 
                                value={targetValue} 
                                onChange={(e) => setTargetValue(e.target.value)} 
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-bold text-teal-600"
                                placeholder={type === 'bp' ? '120/80' : '0'}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">สิ้นสุดภายใน (Optional)</label>
                        <input 
                            type="date" 
                            value={deadline} 
                            onChange={(e) => setDeadline(e.target.value)} 
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm"
                        />
                    </div>

                    <button type="submit" className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md hover:bg-teal-700 transition-all mt-2">
                        บันทึกเป้าหมาย
                    </button>
                </form>
            </div>
        </div>
    );
};

const UpdateProgressModal: React.FC<{ 
    goal: HealthGoal; 
    onClose: () => void; 
    onSave: (val: string, extra?: any) => void; 
}> = ({ goal, onClose, onSave }) => {
    const [value, setValue] = useState('');
    const [sys, setSys] = useState('');
    const [dia, setDia] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (goal.type === 'bp') {
            if (!sys || !dia) return alert("ระบุค่าทั้งตัวบนและตัวล่าง");
            onSave(`${sys}/${dia}`, { systolic: parseInt(sys), diastolic: parseInt(dia) });
        } else {
            if (!value) return alert("ระบุค่าปัจจุบัน");
            onSave(value);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-bounce-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">อัปเดตผลลัพธ์</h3>
                <p className="text-sm text-gray-500 mb-4">บันทึกค่าปัจจุบันเพื่อติดตามความก้าวหน้า</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {goal.type === 'bp' ? (
                        <div className="flex gap-2 items-center">
                            <input type="number" value={sys} onChange={e => setSys(e.target.value)} placeholder="SYS" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-center font-bold" />
                            <span className="text-gray-400">/</span>
                            <input type="number" value={dia} onChange={e => setDia(e.target.value)} placeholder="DIA" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border rounded-xl text-center font-bold" />
                        </div>
                    ) : (
                        <input 
                            type="number" 
                            value={value} 
                            onChange={e => setValue(e.target.value)} 
                            placeholder="ระบุค่าที่วัดได้..." 
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xl font-bold text-center" 
                        />
                    )}
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all">
                        บันทึกผล
                    </button>
                </form>
            </div>
        </div>
    );
};

const HealthGoals: React.FC = () => {
    const { goals, saveGoal, deleteGoal, bmiHistory, setBmiHistory, clinicalHistory, saveClinicalEntry, setActiveView, userProfile, setUserProfile, currentUser } = useContext(AppContext);
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [updatingGoal, setUpdatingGoal] = useState<HealthGoal | null>(null);

    // Filter History for specific Goal Type
    const getFilteredHistory = (goalType: string) => {
        return [...clinicalHistory]
            .filter(h => {
                if (goalType === 'weight') return h.weight;
                if (goalType === 'bp') return h.systolic || h.diastolic;
                if (goalType === 'fbs') return h.fbs;
                if (goalType === 'waist') return h.waist;
                if (goalType === 'hba1c') return h.hba1c;
                if (goalType === 'visceral_fat') return h.visceral_fat;
                if (goalType === 'muscle_mass') return h.muscle_mass;
                if (goalType === 'bmr') return h.bmr;
                return false;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Helper to get latest value
    const getLatestValue = (goal: HealthGoal): string => {
        const sortedHistory = getFilteredHistory(goal.type);
        const entry = sortedHistory[0];

        if (goal.type === 'weight') {
            return entry?.weight ? String(entry.weight) : goal.startValue;
        } else if (goal.type === 'bp') {
            return entry?.systolic ? `${entry.systolic}/${entry.diastolic}` : goal.startValue;
        } else if (goal.type === 'fbs') {
            return entry?.fbs ? String(entry.fbs) : goal.startValue;
        } else if (goal.type === 'waist') {
            return entry?.waist ? String(entry.waist) : (userProfile.waist || goal.startValue);
        } else if (goal.type === 'hba1c') {
            return entry?.hba1c ? String(entry.hba1c) : goal.startValue;
        } else if (goal.type === 'visceral_fat') {
            return entry?.visceral_fat ? String(entry.visceral_fat) : goal.startValue;
        } else if (goal.type === 'muscle_mass') {
            return entry?.muscle_mass ? String(entry.muscle_mass) : goal.startValue;
        } else if (goal.type === 'bmr') {
            return entry?.bmr ? String(entry.bmr) : goal.startValue;
        }
        return goal.startValue;
    };

    const getUnit = (type: string) => {
        if (type === 'weight' || type === 'muscle_mass') return 'kg';
        if (type === 'waist') return 'cm';
        if (type === 'bp') return 'mmHg';
        if (type === 'fbs') return 'mg/dL';
        if (type === 'hba1c') return '%';
        if (type === 'visceral_fat') return 'Level';
        if (type === 'bmr') return 'kcal';
        return '';
    };

    const handleSaveProgress = (val: string, extra?: any) => {
        if (!updatingGoal) return;

        const numVal = parseFloat(val);
        const entry: ClinicalHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString()
        };

        if (updatingGoal.type === 'weight') {
            entry.weight = numVal;
            // Also update BMI History
            const h = parseFloat(userProfile.height || '0') / 100;
            const bmi = h > 0 ? numVal / (h * h) : 0;
            const newEntry: BMIHistoryEntry = { value: bmi, category: 'Updated', date: new Date().toISOString() }; 
            setBmiHistory(prev => [newEntry, ...prev]);
            
            if (currentUser) {
                setUserProfile({ ...userProfile, weight: val }, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
            }
        } else if (updatingGoal.type === 'bp' && extra) {
            entry.systolic = extra.systolic;
            entry.diastolic = extra.diastolic;
        } else if (updatingGoal.type === 'fbs') {
            entry.fbs = numVal;
        } else if (updatingGoal.type === 'waist') {
            entry.waist = numVal;
            if (currentUser) {
                setUserProfile({ ...userProfile, waist: val }, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
            }
        } else if (updatingGoal.type === 'hba1c') {
            entry.hba1c = numVal;
        } else if (updatingGoal.type === 'visceral_fat') {
            entry.visceral_fat = numVal;
        } else if (updatingGoal.type === 'muscle_mass') {
            entry.muscle_mass = numVal;
        } else if (updatingGoal.type === 'bmr') {
            entry.bmr = numVal;
        }

        saveClinicalEntry(entry);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('menu')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">เป้าหมายสุขภาพ (Goals)</h1>
            </div>

            <div className="space-y-6 animate-slide-up">
                <div className="bg-gradient-to-r from-teal-500 to-green-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold flex items-center gap-2"><StarIcon className="w-5 h-5" /> My Health Journey</h2>
                        <p className="text-teal-100 text-sm mt-1">ตั้งเป้าหมายและบันทึกความก้าวหน้าเพื่อสุขภาพที่ดีขึ้น</p>
                        <button 
                            onClick={() => setIsAddOpen(true)}
                            className="mt-4 bg-white text-teal-600 px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
                        >
                            + ตั้งเป้าหมายใหม่
                        </button>
                    </div>
                    <div className="absolute right-0 bottom-0 p-4 opacity-20">
                        <TargetIcon className="w-24 h-24" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {goals.length > 0 ? (
                        goals.map(goal => (
                            <GoalProgressCard 
                                key={goal.id} 
                                goal={goal} 
                                currentValue={getLatestValue(goal)}
                                unit={getUnit(goal.type)}
                                history={getFilteredHistory(goal.type)}
                                onUpdate={() => setUpdatingGoal(goal)}
                                onDelete={() => { if(confirm('ต้องการลบเป้าหมายนี้?')) deleteGoal(goal.id); }}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <TargetIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">ยังไม่มีเป้าหมายที่ตั้งไว้</p>
                        </div>
                    )}
                </div>
            </div>

            {isAddOpen && <AddGoalModal onClose={() => setIsAddOpen(false)} onSave={saveGoal} />}
            {updatingGoal && <UpdateProgressModal goal={updatingGoal} onClose={() => setUpdatingGoal(null)} onSave={handleSaveProgress} />}
        </div>
    );
};

export default HealthGoals;
