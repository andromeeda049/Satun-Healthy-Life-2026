
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, LineIcon, SparklesIcon, ClipboardDocumentCheckIcon, SquaresIcon, UserGroupIcon } from './icons';
import { sendTestNotification } from '../services/googleSheetService';
import PDPAModal from './PDPAModal';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, theme, setTheme, currentUser, userProfile, setUserProfile, logout } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'notifications' | 'ai'>('none');
    const [showPDPA, setShowPDPA] = useState(false);
    
    const [aiInstruction, setAiInstruction] = useState(userProfile.aiSystemInstruction || '');

    useEffect(() => {
        setCurrentScriptUrl(scriptUrl);
        setAiInstruction(userProfile.aiSystemInstruction || '');
    }, [scriptUrl, userProfile]);

    const handleSheetsSave = (e: React.FormEvent) => {
        e.preventDefault();
        setScriptUrl(currentScriptUrl);
        setSaved('sheets');
        setTimeout(() => setSaved('none'), 3000);
    };

    const handleAISave = () => {
        if (!currentUser) return;
        const updatedProfile = { ...userProfile, aiSystemInstruction: aiInstruction };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });
        setSaved('ai');
        setTimeout(() => setSaved('none'), 2000);
    };

    const toggleNotifications = () => {
        if (!currentUser) return;
        const newValue = !userProfile.receiveDailyReminders;
        const updatedProfile = { ...userProfile, receiveDailyReminders: newValue };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });
        setSaved('notifications');
        setTimeout(() => setSaved('none'), 2000);
    };

    const handleRevokePDPA = () => {
        if (window.confirm("คุณต้องการยกเลิกความยินยอมใช่หรือไม่? \n\nระบบจะลงชื่อออกอัตโนมัติ เพื่อคุ้มครองข้อมูลของคุณตามนโยบาย PDPA")) {
            if (!currentUser) return;
            const updatedProfile = { ...userProfile, pdpaAccepted: false, pdpaAcceptedDate: '' };
            setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
            setShowPDPA(false);
            setTimeout(() => logout(), 500);
        }
    };

    const isRemindersOn = !!userProfile.receiveDailyReminders;
    // Allow all admins to see DB connection settings
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="space-y-8 animate-fade-in pb-10">
             <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center uppercase tracking-tight">Appearance</h2>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-xl border-2 transition-all ${
                            theme === 'light' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <SunIcon className="w-8 h-8 text-amber-500 mb-2" />
                        <span className="text-xs font-bold uppercase">Light</span>
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center w-32 h-24 p-4 rounded-xl border-2 transition-all ${
                            theme === 'dark' ? 'border-teal-500 bg-slate-800' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <MoonIcon className="w-8 h-8 text-indigo-400 mb-2" />
                        <span className="text-xs font-bold uppercase">Dark</span>
                    </button>
                </div>
            </div>

            {/* Database Configuration Section - ADMIN ONLY */}
            {isAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border-t-4 border-teal-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <SquaresIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Database Connection</h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Google Apps Script Web App URL</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSheetsSave} className="space-y-3">
                        <input 
                            type="url" 
                            value={currentScriptUrl} 
                            onChange={(e) => setCurrentScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm font-mono text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        />
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                                    saved === 'sheets' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-500 hover:text-white'
                                }`}
                            >
                                {saved === 'sheets' ? 'บันทึกเรียบร้อย' : 'บันทึก URL ใหม่'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {currentUser?.role !== 'guest' && (
                <>
                    {/* Notification Management */}
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-[#06C755]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <BellIcon className={`w-6 h-6 ${isRemindersOn ? 'text-[#06C755]' : 'text-slate-300'}`} />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">การแจ้งเตือน & กลุ่ม</h2>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isRemindersOn} onChange={toggleNotifications} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            {/* LINE Group Section */}
                            <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                            <LineIcon className="w-6 h-6 text-[#06C755]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">เข้าร่วมกลุ่ม LINE Group</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                เพื่อรับการแจ้งเตือนข่าวสาร และเข้าร่วมกลุ่มจัดอันดับคนรักสุขภาพ
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-dashed border-green-300 dark:border-green-700 flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">รหัสเข้าร่วมกลุ่ม (Access Code):</span>
                                        <span className="font-mono font-black text-lg text-teal-600 tracking-wider">SHL2026</span>
                                    </div>
                                    
                                    <a 
                                        href="https://line.me/ti/g/rjw7XHyTFm" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] hover:bg-[#05b54d] text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                                    >
                                        <UserGroupIcon className="w-4 h-4" />
                                        คลิกเพื่อเข้าร่วมกลุ่ม LINE
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-indigo-500">
                        <div className="flex items-center gap-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Privacy & PDPA</h2>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Manage your data consent</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowPDPA(true)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300"
                            >
                                Review
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-600" />
                        <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">AI System Persona</h2>
                    </div>
                    <textarea 
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="Define AI Behavior..."
                        className="w-full p-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:border-purple-400 outline-none transition-colors min-h-[100px]"
                    />
                    <div className="flex justify-end mt-3">
                        <button 
                            onClick={handleAISave}
                            className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                        >
                            {saved === 'ai' ? 'SAVED' : 'SAVE AI RULES'}
                        </button>
                    </div>
                </div>
            )}

            {showPDPA && (
                <PDPAModal 
                    onAccept={() => setShowPDPA(false)}
                    onRevoke={handleRevokePDPA}
                    isSettingsMode={true}
                    onClose={() => setShowPDPA(false)}
                />
            )}
        </div>
    );
};

export default Settings;
