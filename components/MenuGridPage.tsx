
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView } from '../types';
import { 
    ScaleIcon, FireIcon, ClipboardListIcon, 
    BookOpenIcon, StarIcon, TrophyIcon, 
    UserCircleIcon, CogIcon, InformationCircleIcon,
    ChartBarIcon, ClipboardCheckIcon, MedalIcon,
    SquaresIcon, UserGroupIcon, HeartIcon, LogoutIcon,
    SearchIcon, ChevronDownIcon, CameraIcon, LockIcon
} from './icons';

interface MenuItem {
    id: AppView;
    label: string;
    icon: React.ReactNode;
    color: string;
    category: string;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'dashboard', label: 'แดชบอร์ดสุขภาพ', icon: <SquaresIcon className="w-6 h-6 text-indigo-500" />, color: 'bg-white', category: 'main' },
    { id: 'community', label: 'ลำดับคนรักสุขภาพ', icon: <UserGroupIcon className="w-6 h-6 text-orange-500" />, color: 'bg-white', category: 'main' },
    { id: 'rewards', label: 'แลกรางวัลสุขภาพ', icon: <MedalIcon className="w-6 h-6 text-amber-500" />, color: 'bg-white', category: 'main' },
    { id: 'planner', label: 'แผนอาหาร 7 วัน', icon: <ClipboardListIcon className="w-6 h-6 text-emerald-500" />, color: 'bg-white', category: 'main' },
    { id: 'literacy', label: 'คลังความรู้', icon: <BookOpenIcon className="w-6 h-6 text-teal-500" />, color: 'bg-white', category: 'main' },
    { id: 'weeklyQuiz', label: 'ควิซประจำสัปดาห์', icon: <StarIcon className="w-6 h-6 text-rose-500" />, color: 'bg-white', category: 'main' },
    { id: 'assessment', label: 'ประเมินความเสี่ยง', icon: <ClipboardCheckIcon className="w-6 h-6 text-purple-500" />, color: 'bg-white', category: 'main' },
    { id: 'quiz', label: 'วัดความรู้ HL', icon: <ClipboardCheckIcon className="w-6 h-6 text-gray-500" />, color: 'bg-white', category: 'main' },
    { id: 'evaluation', label: 'แบบประเมินผล', icon: <HeartIcon className="w-6 h-6 text-pink-500" />, color: 'bg-white', category: 'main' }, // Added evaluation
];

const MenuGridPage: React.FC = () => {
    const { setActiveView, currentUser, logout, userProfile, theme, setTheme } = useContext(AppContext);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const navigate = (id: AppView) => {
        setActiveView(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="animate-fade-in pb-20 space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center px-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">เมนู</h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('settings')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                        <CogIcon className="w-6 h-6" />
                    </button>
                    <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                        <SearchIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <button 
                onClick={() => navigate('profile')}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {currentUser?.profilePicture && (currentUser.profilePicture.startsWith('data') || currentUser.profilePicture.startsWith('http')) ? (
                            <img src={currentUser.profilePicture} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <UserCircleIcon className="w-8 h-8" />
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md">
                            <ChevronDownIcon className="w-2.5 h-2.5 text-gray-400" />
                        </div>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-800 dark:text-white">{currentUser?.displayName || 'ผู้ใช้งาน'}</h3>
                        <p className="text-xs text-gray-400">ดูโปรไฟล์ของคุณ</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full">
                        <UserCircleIcon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </button>

            {/* Admin Zone Button (Conditional) */}
            {currentUser?.role === 'admin' && (
                <button
                    onClick={() => navigate('adminDashboard')}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden border border-gray-700"
                >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <LockIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-base">Admin Zone</h3>
                            <p className="text-xs text-gray-300">ระบบจัดการข้อมูลและงานวิจัย</p>
                        </div>
                    </div>
                    <div className="relative z-10 bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">เข้าใช้งาน &gt;</div>
                </button>
            )}

            {/* Shortcuts row */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white pl-1">ทางลัดของคุณ</h3>
                <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                    <button onClick={() => navigate('bmi')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shadow-sm border border-red-100/50">
                            <ScaleIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">BMI</span>
                    </button>
                    <button onClick={() => navigate('tdee')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-xl flex items-center justify-center shadow-sm border border-sky-100/50">
                            <FireIcon className="w-8 h-8 text-sky-500" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">TDEE</span>
                    </button>
                    <button onClick={() => navigate('food')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center shadow-sm border border-purple-100/50">
                            <CameraIcon className="w-8 h-8 text-purple-500" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">สแกนอาหาร</span>
                    </button>
                    <button onClick={() => navigate('hpHistory')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center shadow-sm border border-yellow-100/50">
                            <ChartBarIcon className="w-8 h-8 text-yellow-500" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">ประวัติ HP</span>
                    </button>
                    {userProfile.level && userProfile.level >= 5 && (
                         <button onClick={() => navigate('rewards')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shadow-sm border border-amber-100/50">
                                <MedalIcon className="w-8 h-8 text-amber-500" />
                            </div>
                            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">รางวัล</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Feature Grid */}
            <div className="grid grid-cols-2 gap-2 px-1">
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.id)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-start gap-2 hover:bg-gray-50 transition-colors active:scale-95"
                    >
                        {item.icon}
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 text-left line-clamp-1 leading-tight">{item.label}</span>
                    </button>
                ))}
                <button className="col-span-2 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-gray-700 dark:text-gray-300 text-sm">
                    ดูเพิ่มเติม
                </button>
            </div>

            {/* Collapsible Sections (Bottom) */}
            <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-4">
                {/* Help & Support */}
                <div className="border-b border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                        className="w-full py-4 flex items-center justify-between text-gray-800 dark:text-white group"
                    >
                        <div className="flex items-center gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-bold text-base">ความช่วยเหลือและฝ่ายสนับสนุน</span>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isHelpOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isHelpOpen && (
                        <div className="pb-4 pl-9 space-y-4 animate-fade-in-down">
                            <button onClick={() => navigate('about')} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>เกี่ยวกับแอปและคู่มือการใช้งาน</span>
                            </button>
                            <button className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>กล่องข้อความสนับสนุน</span>
                            </button>
                            <button onClick={() => navigate('gamificationRules')} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>กติกาแต้มสุขภาพและเลเวล</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings & Privacy */}
                <div className="border-b border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="w-full py-4 flex items-center justify-between text-gray-800 dark:text-white"
                    >
                        <div className="flex items-center gap-3">
                            <CogIcon className="w-6 h-6 text-gray-400" />
                            <span className="font-bold text-base">การตั้งค่าและความเป็นส่วนตัว</span>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSettingsOpen && (
                        <div className="pb-4 pl-9 space-y-4 animate-fade-in-down">
                            <button onClick={() => navigate('settings')} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>ตั้งค่าแอปพลิเคชัน</span>
                            </button>
                            <button onClick={() => navigate('profile')} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>โปรไฟล์และข้อมูลหน่วยงาน</span>
                            </button>
                            <button 
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500"
                            >
                                <span>{theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button 
                    onClick={logout}
                    className="w-full py-5 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl mt-6 text-red-600 font-bold active:scale-[0.98] transition-transform"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span>ออกจากระบบ</span>
                </button>
            </div>

            <div className="text-center">
                <p className="text-[11px] text-gray-400 font-bold tracking-tighter uppercase">
                    Satun Healthy Life v1.4.0 • แพลตฟอร์มสุขภาพดิจิทัล
                </p>
            </div>
        </div>
    );
};

export default MenuGridPage;
