
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { AppView } from '../types';
import { 
    ScaleIcon, FireIcon, ClipboardListIcon, 
    BookOpenIcon, StarIcon, TrophyIcon, 
    UserCircleIcon, CogIcon, InformationCircleIcon,
    ChartBarIcon, ClipboardCheckIcon, MedalIcon,
    SquaresIcon, UserGroupIcon, HeartIcon, LogoutIcon,
    SearchIcon, ChevronDownIcon, CameraIcon, LockIcon,
    XIcon, SparklesIcon, ChatBubbleLeftEllipsisIcon, TargetIcon
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
    { id: 'community', label: 'กลุ่มของฉัน', icon: <UserGroupIcon className="w-6 h-6 text-orange-500" />, color: 'bg-white', category: 'main' },
    { id: 'goals', label: 'เป้าหมายสุขภาพ', icon: <TargetIcon className="w-6 h-6 text-red-500" />, color: 'bg-white', category: 'main' },
    { id: 'rewards', label: 'แลกรางวัลสุขภาพ', icon: <MedalIcon className="w-6 h-6 text-amber-500" />, color: 'bg-white', category: 'main' },
    { id: 'planner', label: 'แผนอาหาร 7 วัน', icon: <ClipboardListIcon className="w-6 h-6 text-emerald-500" />, color: 'bg-white', category: 'main' },
    { id: 'literacy', label: 'คลังความรู้', icon: <BookOpenIcon className="w-6 h-6 text-teal-500" />, color: 'bg-white', category: 'main' },
    { id: 'weeklyQuiz', label: 'ควิซประจำสัปดาห์', icon: <StarIcon className="w-6 h-6 text-rose-500" />, color: 'bg-white', category: 'main' },
    { id: 'assessment', label: 'ประเมินความเสี่ยง', icon: <ClipboardCheckIcon className="w-6 h-6 text-purple-500" />, color: 'bg-white', category: 'main' },
    { id: 'quiz', label: 'วัดความรู้ HL', icon: <ClipboardCheckIcon className="w-6 h-6 text-gray-500" />, color: 'bg-white', category: 'main' },
    { id: 'evaluation', label: 'แบบประเมินผล', icon: <HeartIcon className="w-6 h-6 text-pink-500" />, color: 'bg-white', category: 'main' },
    { id: 'feedback', label: 'เสนอแนะ/แจ้งปัญหา', icon: <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-violet-500" />, color: 'bg-white', category: 'main' },
];

interface ChangelogVersion {
    version: string;
    date: string;
    features: { title: string; desc: string }[];
}

const CHANGELOG_HISTORY: ChangelogVersion[] = [
    {
        version: "1.6.0",
        date: "New Feature",
        features: [
            { title: "Health Goals", desc: "ตั้งเป้าหมายสุขภาพ (น้ำหนัก, ความดัน, น้ำตาล) และติดตามผลลัพธ์แบบกราฟ" },
            { title: "Feedback System", desc: "ช่องทางรับฟังความคิดเห็นและแจ้งปัญหาการใช้งาน" }
        ]
    },
    {
        version: "1.5.0",
        date: "Previous Update",
        features: [
            { title: "อัปเดตคลังความรู้ (Nutrition Literacy)", desc: "เพิ่ม 11 เสาหลักเวชศาสตร์วิถีชีวิต และแนวทางดูแลโรค NCDs" },
            { title: "ปรับโฉมดีไซน์ใหม่ (UI Redesign)", desc: "ใช้กราฟิกไอคอนและ Gradients ที่สวยงาม อ่านง่ายขึ้น" },
            { title: "ระบบกลุ่มสุขภาพ (Community Groups)", desc: "ปรับปรุงการจัดการสมาชิกและการดูอันดับภายในกลุ่ม" }
        ]
    }
];

const MenuGridPage: React.FC = () => {
    const { setActiveView, currentUser, logout, userProfile, theme, setTheme } = useContext(AppContext);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    const navigate = (id: AppView) => {
        setActiveView(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderProfilePicture = (pic: string | undefined) => {
        if (!pic) return <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><UserCircleIcon className="w-8 h-8" /></div>;
        
        const isImage = pic.startsWith('data:image/') || pic.startsWith('http');
        if (isImage) {
            return <img src={pic} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />;
        }
        return (
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                <span className="text-2xl">{pic}</span>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-20 space-y-6">
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

            <button 
                onClick={() => navigate('profile')}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {renderProfilePicture(currentUser?.profilePicture)}
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

            {currentUser?.role === 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate('adminDashboard')}
                        className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 text-white p-4 rounded-xl shadow-lg flex flex-col justify-between group active:scale-[0.98] transition-all relative overflow-hidden border border-gray-700 h-28"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex justify-between w-full">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <LockIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative z-10 text-left">
                            <h3 className="font-bold text-sm">Admin Dashboard</h3>
                            <p className="text-[10px] text-gray-300">วิเคราะห์ข้อมูลรวม</p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('groupManagement')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg flex flex-col justify-between group active:scale-[0.98] transition-all relative overflow-hidden border border-indigo-500 h-28"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10 flex justify-between w-full">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <UserGroupIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="relative z-10 text-left">
                            <h3 className="font-bold text-sm">จัดการกลุ่ม</h3>
                            <p className="text-[10px] text-indigo-200">สร้าง/ดูแลกลุ่ม</p>
                        </div>
                    </button>
                </div>
            )}

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
                    <button onClick={() => navigate('goals')} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center shadow-sm border border-green-100/50">
                            <TargetIcon className="w-8 h-8 text-green-500" />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">เป้าหมาย</span>
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
            </div>

            {/* Help & Settings Section */}
            <div className="space-y-1 border-t border-gray-100 dark:border-gray-700 pt-4">
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
                            <button onClick={() => setShowChangelog(true)} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>บันทึกการเปลี่ยนแปลง (Changelog)</span>
                            </button>
                            <button onClick={() => navigate('gamificationRules')} className="flex items-center gap-3 w-full text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500">
                                <span>กติกาแต้มสุขภาพและเลเวล</span>
                            </button>
                        </div>
                    )}
                </div>

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
                    Satun Healthy Life v1.6.0 • แพลตฟอร์มสุขภาพดิจิทัล
                </p>
            </div>

            {/* Changelog Modal */}
            {showChangelog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowChangelog(false)}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-bounce-in border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                    <SparklesIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">What's New</h3>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">บันทึกการเปลี่ยนแปลง</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChangelog(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto pr-2 -mr-2 space-y-6 flex-1">
                            {CHANGELOG_HISTORY.map((log, index) => (
                                <div key={log.version} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 pb-6">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${index === 0 ? 'bg-indigo-500 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className={`text-sm font-bold ${index === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>v{log.version}</h4>
                                        {index === 0 && <span className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">Latest</span>}
                                        <span className="text-[10px] text-gray-400 ml-auto">{log.date}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {log.features.map((feature, fIdx) => (
                                            <div key={fIdx} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                <div className="flex items-start gap-2">
                                                    <div className="text-green-500 mt-0.5 text-xs"><i className="fa-solid fa-circle-check"></i></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">{feature.title}</p>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
                            <button onClick={() => setShowChangelog(false)} className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm">
                                รับทราบ (Got it!)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuGridPage;
