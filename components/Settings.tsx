
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { SunIcon, MoonIcon, BellIcon, LineIcon, SparklesIcon, ClipboardDocumentCheckIcon, SquaresIcon, UserGroupIcon, TrashIcon, ExclamationTriangleIcon, EyeIcon, LockIcon } from './icons';
import { sendTestNotification, systemFactoryReset } from '../services/googleSheetService';
import PDPAModal from './PDPAModal';
import PinLock from './PinLock';

const Settings: React.FC = () => {
    const { scriptUrl, setScriptUrl, theme, setTheme, currentUser, userProfile, setUserProfile, logout, resetData, simulateUserMode, userPin, setPin } = useContext(AppContext);
    
    const [currentScriptUrl, setCurrentScriptUrl] = useState(scriptUrl);
    const [saved, setSaved] = useState<'none' | 'sheets' | 'notifications' | 'ai'>('none');
    const [showPDPA, setShowPDPA] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isFactoryResetting, setIsFactoryResetting] = useState(false);
    
    // PIN Setup State
    const [showPinSetup, setShowPinSetup] = useState(false);
    
    const [aiInstruction, setAiInstruction] = useState(userProfile.aiSystemInstruction || '');

    useEffect(() => {
        setCurrentScriptUrl(scriptUrl);
        setAiInstruction(userProfile.aiSystemInstruction || '');
    }, [scriptUrl, userProfile]);

    // ... existing handlers ...
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

    const handlePinToggle = () => {
        if (userPin) {
            // Remove PIN
            if (window.confirm("คุณต้องการยกเลิกรหัสผ่าน (PIN) ใช่หรือไม่?")) {
                setPin(null); 
            }
        } else {
            // Setup PIN
            setShowPinSetup(true);
        }
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

    const handleResetData = async () => {
        if (window.confirm("⚠️ ยืนยันการรีเซ็ตข้อมูล?\n\nประวัติสุขภาพทั้งหมดและแต้มสะสมจะหายไป แต่บัญชีของคุณจะยังอยู่\n\nกด 'ตกลง' เพื่อเริ่มใหม่ (Start Over)")) {
            setIsResetting(true);
            await resetData();
            setIsResetting(false);
        }
    };

    const handleFactoryReset = async () => {
        const confirm1 = window.confirm("⛔️ DANGER: คุณกำลังจะล้างข้อมูลทั้งระบบ!\n\nประวัติสุขภาพของผู้ใช้ 'ทุกคน' จะถูกลบถาวร\n(User Accounts จะไม่ถูกลบ แต่ XP/Level จะถูกรีเซ็ต)\n\nคุณแน่ใจหรือไม่?");
        if (!confirm1) return;
        
        const confirm2 = window.confirm("‼️ ยืนยันครั้งสุดท้าย: การกระทำนี้ไม่สามารถกู้คืนได้\n\nกด 'ตกลง' เพื่อล้างข้อมูลทั้งระบบ (Factory Reset)");
        if (!confirm2) return;

        if (currentUser && scriptUrl) {
            setIsFactoryResetting(true);
            const success = await systemFactoryReset(scriptUrl, currentUser);
            setIsFactoryResetting(false);
            if (success) {
                alert("✅ System Factory Reset Completed.\nระบบถูกรีเซ็ตเรียบร้อยแล้ว");
                window.location.reload();
            } else {
                alert("❌ Failed to reset system.");
            }
        }
    };

    const isRemindersOn = !!userProfile.receiveDailyReminders;
    const isAdmin = currentUser?.role === 'admin';
    const isSuperAdmin = isAdmin && currentUser?.organization === 'all';
    const hasPin = !!userPin && userPin.length === 4;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
             {showPinSetup && (
                 <PinLock 
                    isSetupMode={true} 
                    onUnlock={() => setShowPinSetup(false)} 
                    onCancelSetup={() => setShowPinSetup(false)}
                 />
             )}

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

            {/* Database Configuration Section - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full border-t-4 border-teal-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <SquaresIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">System Admin Zone</h2>
                            <p className="text-xs text-slate-500 dark:text-gray-400">Database & Critical Actions</p>
                        </div>
                    </div>
                    
                    {/* User Simulation Mode */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <EyeIcon className="w-6 h-6 text-indigo-600" />
                            <h3 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">User View Simulation</h3>
                        </div>
                        <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mb-4">
                            จำลองหน้าจอการใช้งานในมุมมองของผู้ใช้ทั่วไป (User Role) เพื่อตรวจสอบความถูกต้องของฟีเจอร์
                        </p>
                        <button 
                            onClick={simulateUserMode}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                            👁️ ทดลองใช้งานในฐานะ User
                        </button>
                    </div>

                    <form onSubmit={handleSheetsSave} className="space-y-3 mb-6">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Database URL</label>
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

                    {/* Factory Reset Section */}
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3 mb-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                            <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">Emergency Zone</h3>
                        </div>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">
                            การกดปุ่มด้านล่างจะลบข้อมูลประวัติสุขภาพของผู้ใช้ "ทุกคน" ในระบบ (History Logs) และรีเซ็ตค่าประสบการณ์ (XP/Level) ทั้งหมด
                        </p>
                        <button 
                            onClick={handleFactoryReset}
                            disabled={isFactoryResetting}
                            className="w-full py-3 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isFactoryResetting ? 'WIPING SYSTEM...' : '⚠️ FACTORY RESET SYSTEM (ล้างข้อมูลทั้งระบบ)'}
                        </button>
                    </div>
                </div>
            )}

            {currentUser?.role !== 'guest' && (
                <>
                    {/* Security & Notification Management */}
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-[#06C755]">
                        <div className="flex items-center gap-3 mb-6">
                            <LockIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">ความปลอดภัยและการแจ้งเตือน</h2>
                        </div>

                        <div className="space-y-4">
                            {/* PIN Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">ล็อกแอปด้วยรหัสผ่าน (PIN Lock)</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {hasPin ? <span className="text-green-600 font-bold">เปิดใช้งานอยู่ (Active)</span> : "เพิ่มความปลอดภัยก่อนเข้าใช้งาน"}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={hasPin} onChange={handlePinToggle} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                </label>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">การแจ้งเตือนรายวัน</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">เตือนให้บันทึกสุขภาพประจำวัน</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isRemindersOn} onChange={toggleNotifications} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                                </label>
                            </div>

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

                    {/* DANGER ZONE - RESET DATA (Individual) */}
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 md:p-8 rounded-2xl shadow-md w-full border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-4 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                                    <TrashIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-red-700 dark:text-red-400">Danger Zone</h2>
                                    <p className="text-red-500/80 text-[10px] uppercase font-bold tracking-wider">Reset Account Progress</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleResetData}
                                disabled={isResetting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isResetting ? 'Resetting...' : 'Reset My Data'}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* AI System Persona - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-md w-full border-l-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-6 h-6 text-purple-600" />
                        <h2 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">AI System Persona (Super Admin)</h2>
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
