
import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { TrophyIcon, FireIcon, UserGroupIcon, ChartBarIcon, WaterDropIcon, BeakerIcon, BoltIcon, ExclamationTriangleIcon, StarIcon } from './icons';
import html2canvas from 'html2canvas';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    badges: string | string[];
    organization: string;
    role?: string;
    weeklyXp?: number;
    score?: number; // Generic score for categories
}

interface OrgRanking {
    id: string;
    name: string;
    totalXp: number;
    memberCount: number;
    avgXp: number;
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser, userProfile, organizations } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [trending, setTrending] = useState<LeaderboardUser[]>([]);
    const [categories, setCategories] = useState<{ water: LeaderboardUser[], food: LeaderboardUser[], activity: LeaderboardUser[] }>({ water: [], food: [], activity: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'trending' | 'orgs' | 'water' | 'food' | 'activity'>('users');
    const [loadingMessage, setLoadingMessage] = useState("กำลังโหลดข้อมูล...");
    
    // Debug state
    const [rawDebugData, setRawDebugData] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [apiVersion, setApiVersion] = useState<string>("Unknown");
    
    const shareCardRef = useRef<HTMLDivElement>(null);
    const leaderboardRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        setRawDebugData(null);
        setApiVersion("Unknown");
        const messages = ["กำลังจัดอันดับผู้พิชิต...", "ใครคือที่ 1 ของวันนี้?", "กำลังรวบรวมคะแนนสุขภาพ...", "เฟ้นหาสุดยอดคนรักสุขภาพ..."];
        setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);

        try {
            if (!scriptUrl) throw new Error("ไม่พบ URL ของ Web App กรุณาตั้งค่า");
            const data = await fetchLeaderboard(scriptUrl, currentUser || undefined);
            
            setRawDebugData(data);
            if (data.apiVersion) setApiVersion(data.apiVersion);

            if (!data) throw new Error("ไม่ได้รับข้อมูลจาก Server (Response is null)");

            const filterAdmins = (list: any[]) => {
                if (!Array.isArray(list)) return [];
                return list.filter((u: any) => {
                    const role = String(u.role || '').toLowerCase();
                    const username = String(u.username || '').toLowerCase();
                    const name = String(u.displayName || '').toLowerCase();
                    const org = String(u.organization || '').toLowerCase();
                    return role !== 'admin' && !username.startsWith('admin') && !name.includes('admin') && org !== 'all';
                });
            };

            if (Array.isArray(data.leaderboard)) {
                const sorted = filterAdmins(data.leaderboard).sort((a: any, b: any) => b.xp - a.xp);
                setLeaderboard(sorted);
            }
            if (Array.isArray(data.trending)) {
                setTrending(filterAdmins(data.trending));
            }
            
            if (data.categories) {
                setCategories({
                    water: filterAdmins(data.categories.water || []),
                    food: filterAdmins(data.categories.food || []),
                    activity: filterAdmins(data.categories.activity || [])
                });
            } else {
                console.warn("Categories missing from backend response");
                setCategories({ water: [], food: [], activity: [] });
            }

        } catch (err: any) {
            console.error("Leaderboard Error:", err);
            setError(err.message || "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [scriptUrl]);

    const orgRankings = useMemo(() => {
        const stats: Record<string, { total: number, count: number }> = {};
        leaderboard.forEach(user => {
            const orgId = user.organization || 'other';
            if (!stats[orgId]) stats[orgId] = { total: 0, count: 0 };
            stats[orgId].total += (user.xp || 0);
            stats[orgId].count += 1;
        });
        return Object.keys(stats).map(orgId => {
            const orgInfo = organizations.find(o => o.id === orgId);
            const count = stats[orgId].count;
            const total = stats[orgId].total;
            return {
                id: orgId,
                name: orgInfo ? orgInfo.name : 'ทั่วไป',
                totalXp: total,
                memberCount: count,
                avgXp: count > 0 ? Math.round(total / count) : 0
            };
        }).sort((a, b) => b.avgXp - a.avgXp);
    }, [leaderboard, organizations]);

    // --- Dynamic Self-Highlight Logic ---
    const myStatsInCurrentTab = useMemo(() => {
        if (!currentUser) return null;

        let rank = -1;
        let value = '';
        let unit = '';
        let label = '';

        if (activeTab === 'users') {
            rank = leaderboard.findIndex(u => u.username === currentUser.username);
            const user = leaderboard[rank];
            if (user) { value = user.xp.toLocaleString(); unit = 'HP'; label = 'คะแนนสะสม'; }
        } else if (activeTab === 'trending') {
            rank = trending.findIndex(u => u.username === currentUser.username);
            const user = trending[rank];
            if (user) { value = (user.weeklyXp || 0).toLocaleString(); unit = 'HP'; label = 'สัปดาห์นี้'; }
        } else if (activeTab === 'water') {
            rank = categories.water.findIndex(u => u.username === currentUser.username);
            const user = categories.water[rank];
            if (user) { value = ((user.score || 0) / 1000).toFixed(1); unit = 'ลิตร'; label = 'ปริมาณน้ำ'; }
        } else if (activeTab === 'food') {
            rank = categories.food.findIndex(u => u.username === currentUser.username);
            const user = categories.food[rank];
            if (user) { value = (user.score || 0).toString(); unit = 'รายการ'; label = 'บันทึกอาหาร'; }
        } else if (activeTab === 'activity') {
            rank = categories.activity.findIndex(u => u.username === currentUser.username);
            const user = categories.activity[rank];
            if (user) { value = (user.score || 0).toLocaleString(); unit = 'kcal'; label = 'เผาผลาญ'; }
        } else if (activeTab === 'orgs') {
            // Find my organization rank
            const myOrgId = userProfile.organization;
            rank = orgRankings.findIndex(o => o.id === myOrgId);
            const org = orgRankings[rank];
            if (org) { value = org.avgXp.toLocaleString(); unit = 'คะแนนเฉลี่ย'; label = 'หน่วยงานคุณ'; }
        }

        if (rank === -1) return null;
        return { rank: rank + 1, value, unit, label };
    }, [activeTab, leaderboard, trending, categories, orgRankings, currentUser, userProfile]);

    const captureAndShare = async (element: HTMLElement, filename: string) => {
        try {
            const canvas = await html2canvas(element, { useCORS: true, scale: 2, backgroundColor: '#f8fafc' });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Canvas to Blob failed");
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'ลำดับคนรักสุขภาพ', text: `🏆 อันดับสุขภาพของฉันใน Satun Smart Life!` });
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = filename;
                link.click();
            }
        } catch (err) {
            alert("ไม่สามารถแชร์รูปได้");
        }
    };

    const RankIcon = ({ index }: { index: number }) => {
        if (index === 0) return <div className="w-8 h-8 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-yellow-400/20"><i className="fa-solid fa-medal text-white text-sm"></i></div>;
        if (index === 1) return <div className="w-8 h-8 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-slate-400/20"><i className="fa-solid fa-medal text-white text-sm"></i></div>;
        if (index === 2) return <div className="w-8 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white ring-1 ring-orange-400/20"><i className="fa-solid fa-medal text-white text-sm"></i></div>;
        return <div className="w-8 h-8 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center font-semibold text-slate-400 text-xs">{index + 1}</div>;
    };

    const renderHeader = () => {
        let title = "ลำดับคนรักสุขภาพ";
        let icon = <TrophyIcon className="text-5xl" />;
        let gradient = "from-orange-500 to-red-500";
        let subtitle = "สุขภาพดี เริ่มได้ที่ชุมชนของเรา";

        if (activeTab === 'trending') { 
            title = "มาแรง"; icon = <FireIcon className="text-5xl" />; gradient = "from-rose-500 to-pink-500"; 
        } else if (activeTab === 'orgs') { 
            title = "อันดับหน่วยงาน"; icon = <UserGroupIcon className="text-5xl" />; gradient = "from-teal-500 to-emerald-500"; 
            subtitle = "จัดอันดับตามคะแนนเฉลี่ยต่อสมาชิก";
        } else if (activeTab === 'water') {
            title = "สุดยอดนักดื่มน้ำ"; icon = <WaterDropIcon className="text-5xl" />; gradient = "from-blue-400 to-blue-600";
            subtitle = "ผู้ที่ดื่มน้ำสะสมมากที่สุด (มล.)";
        } else if (activeTab === 'food') {
            title = "นักบันทึกโภชนาการ"; icon = <BeakerIcon className="text-5xl" />; gradient = "from-purple-400 to-purple-600";
            subtitle = "ผู้ที่บันทึกรายการอาหารสม่ำเสมอที่สุด (จำนวนครั้ง)";
        } else if (activeTab === 'activity') {
            title = "จอมพลังขยับกาย"; icon = <BoltIcon className="text-5xl" />; gradient = "from-yellow-400 to-orange-500";
            subtitle = "ผู้ที่เผาผลาญพลังงานสะสมสูงสุด (kcal)";
        }

        return (
            <div className={`text-center mb-6 bg-gradient-to-r ${gradient} p-5 rounded-2xl text-white shadow-md relative overflow-hidden transition-all duration-500`}>
                <div className="absolute top-0 right-0 p-3 opacity-10 transform scale-110">{icon}</div>
                <h2 className="text-xl font-semibold relative z-10 tracking-tight">{title}</h2>
                <p className="text-white/80 text-[10px] relative z-10 font-medium opacity-90">{subtitle}</p>
                
                {myStatsInCurrentTab && (
                    <div className="mt-4 flex flex-col items-center gap-2 relative z-10">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[11px] font-semibold border border-white/20">
                            {myStatsInCurrentTab.label}: #{myStatsInCurrentTab.rank}
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => captureAndShare(leaderboardRef.current!, 'leaderboard.png')} className="bg-white text-orange-600 px-3 py-1 rounded-lg text-[9px] font-bold shadow-sm active:scale-95 transition-all uppercase">แชร์กระดานรวม</button>
                             <button onClick={() => captureAndShare(shareCardRef.current!, 'my-rank.png')} className="bg-black/20 text-white px-3 py-1 rounded-lg text-[9px] font-bold shadow-sm active:scale-95 transition-all border border-white/20 uppercase">แชร์อันดับฉัน</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] relative overflow-hidden pt-10">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-yellow-300/20 to-orange-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

            {/* Main Visual */}
            <div className="relative mb-12 z-10">
                {/* Rotating Ring */}
                <div className="absolute inset-0 -m-8 border-2 border-dashed border-yellow-300/30 rounded-full animate-spin-slow"></div>
                
                {/* Floating Trophy Container */}
                <div className="relative animate-float">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                    <div className="bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-gray-900 p-12 rounded-full shadow-[0_20px_50px_rgba(234,179,8,0.3)] border-[6px] border-white dark:border-gray-700 relative z-10">
                        <TrophyIcon className="w-24 h-24 md:w-32 md:h-32 text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 drop-shadow-2xl" />
                    </div>
                    
                    {/* Floating Stars */}
                    <div className="absolute -top-6 -right-6 animate-bounce" style={{ animationDuration: '2s' }}>
                        <StarIcon className="w-12 h-12 text-yellow-300 drop-shadow-lg transform rotate-12" />
                    </div>
                    <div className="absolute bottom-4 -left-8 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                            <FireIcon className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Text & Status */}
            <div className="relative z-10 text-center space-y-4 max-w-xs mx-auto">
                <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500 dark:from-white dark:to-slate-300 tracking-tight leading-tight">
                    {loadingMessage}
                </h3>
                
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] animate-pulse">
                        Retrieving Rankings...
                    </p>
                    {/* Shimmer Loading Bar */}
                    <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative mt-2">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center pt-16 pb-12 px-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <button onClick={loadData} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-sm">ลองใหม่อีกครั้ง</button>
        </div>
    );

    // Helper to render user row with highlighting
    const renderRankingItem = (user: LeaderboardUser, idx: number, value: string, unit: string, valueColor: string) => {
        const isMe = user.username === currentUser?.username;
        return (
            <div key={user.username} className={`p-3 rounded-xl shadow-sm border transition-all flex items-center gap-3 animate-slide-up ${
                isMe 
                ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-500 z-10 scale-[1.01] shadow-md' 
                : idx === 0 
                    ? 'bg-white dark:bg-gray-800 border-yellow-400 bg-yellow-50/10' 
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700'
            }`}>
                <RankIcon index={idx} />
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                    {user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data') ? <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">{user.profilePicture || '👤'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-[13px] tracking-tight truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                        {user.displayName} {isMe && '(คุณ)'}
                    </h4>
                    <p className="text-[9px] font-medium text-slate-400 uppercase">{user.organization || 'ทั่วไป'}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
                    </div>
                    <p className="text-[8px] font-medium text-slate-400 uppercase">{unit}</p>
                </div>
            </div>
        );
    };

    // Helper to render Org row with highlighting and medals
    const renderOrgItem = (org: OrgRanking, idx: number) => {
        const isMyOrg = org.id === userProfile?.organization;
        return (
            <div key={org.id} className={`p-3.5 rounded-xl shadow-sm border transition-all flex items-center justify-between animate-slide-up ${
                isMyOrg
                ? 'bg-teal-50 border-teal-500 dark:bg-teal-900/20 dark:border-teal-500 z-10 scale-[1.01] shadow-md'
                : idx === 0 
                    ? 'bg-white dark:bg-gray-800 border-teal-400 bg-teal-50/10' 
                    : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700'
            }`}>
                <div className="flex items-center gap-3">
                    {/* Use Medal Icon for Orgs too */}
                    <RankIcon index={idx} />
                    <div>
                        <h4 className={`font-bold text-[13px] ${isMyOrg ? 'text-teal-800 dark:text-teal-200' : 'text-slate-800 dark:text-white'}`}>
                            {org.name} {isMyOrg && '(สังกัดคุณ)'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-medium bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">สมาชิก {org.memberCount} คน</span>
                            <span className="text-[9px] text-indigo-500 font-bold">รวม: {org.totalXp.toLocaleString()} HP</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <ChartBarIcon className="w-3 h-3 text-teal-500" />
                        <p className="text-base font-bold text-teal-600">{org.avgXp.toLocaleString()}</p>
                    </div>
                    <p className="text-[8px] font-medium text-slate-400 uppercase">คะแนนเฉลี่ย</p>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-24">
            {renderHeader()}
            
            {/* Category Tabs */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl mb-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'users' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <TrophyIcon className="w-3 h-3" /> รวม
                    </button>
                    <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'trending' ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <FireIcon className="w-3 h-3" /> มาแรง
                    </button>
                    <button onClick={() => setActiveTab('water')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'water' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <WaterDropIcon className="w-3 h-3" /> ดื่มน้ำ
                    </button>
                    <button onClick={() => setActiveTab('food')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'food' ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <BeakerIcon className="w-3 h-3" /> บันทึก
                    </button>
                    <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'activity' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <BoltIcon className="w-3 h-3" /> ขยับกาย
                    </button>
                    <button onClick={() => setActiveTab('orgs')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'orgs' ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <UserGroupIcon className="w-3 h-3" /> หน่วยงาน
                    </button>
                </div>
            </div>

            <div ref={leaderboardRef} className="space-y-2">
                {activeTab === 'users' && leaderboard.map((user, idx) => renderRankingItem(user, idx, (user.xp || 0).toLocaleString(), 'HP', 'text-indigo-600 dark:text-indigo-400'))}

                {activeTab === 'trending' && trending.map((user, idx) => renderRankingItem(user, idx, (user.weeklyXp || 0).toLocaleString(), 'Weekly HP', 'text-rose-600 dark:text-rose-400'))}
                
                {activeTab === 'water' && categories.water.map((user, idx) => renderRankingItem(user, idx, ((user.score || 0) / 1000).toFixed(1) + ' L', 'ปริมาณรวม', 'text-blue-600 dark:text-blue-400'))}
                
                {activeTab === 'food' && categories.food.map((user, idx) => renderRankingItem(user, idx, (user.score || 0).toString(), 'รายการ', 'text-purple-600 dark:text-purple-400'))}
                
                {activeTab === 'activity' && categories.activity.map((user, idx) => renderRankingItem(user, idx, (user.score || 0).toLocaleString(), 'kcal', 'text-yellow-600 dark:text-yellow-400'))}

                {activeTab === 'orgs' && orgRankings.map((org, idx) => renderOrgItem(org, idx))}
                
                {(
                    (activeTab === 'users' && leaderboard.length === 0) ||
                    (activeTab === 'trending' && trending.length === 0) ||
                    (activeTab === 'water' && categories.water.length === 0) ||
                    (activeTab === 'food' && categories.food.length === 0) ||
                    (activeTab === 'activity' && categories.activity.length === 0) ||
                    (activeTab === 'orgs' && orgRankings.length === 0)
                ) && (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">ยังไม่มีข้อมูลในหมวดหมู่นี้</p>
                        {/* Debug Toggle */}
                        <div className="mt-6">
                            <button onClick={() => setShowDebug(!showDebug)} className="text-[10px] text-gray-300 hover:text-gray-500 underline">
                                {showDebug ? 'Hide Debug' : 'Show Debug Info'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Debug View */}
            {showDebug && (
                <div className="mt-8 p-4 bg-black text-green-400 font-mono text-[10px] rounded-xl overflow-auto max-h-60">
                    <div className="flex justify-between border-b border-green-800 pb-1 mb-2">
                        <h4 className="font-bold uppercase">Raw API Response</h4>
                        <span className={`font-bold ${apiVersion === "v12.0-FINAL" ? "text-green-400" : "text-red-500"}`}>Server Ver: {apiVersion}</span>
                    </div>
                    <pre>{JSON.stringify(rawDebugData, null, 2)}</pre>
                </div>
            )}

            {/* Sticky Stats Footer (Always show if myStats found, except top 3 who see themselves on screen) */}
            {myStatsInCurrentTab && myStatsInCurrentTab.rank > 3 && (
                <div ref={shareCardRef} className="fixed bottom-20 left-4 right-4 bg-indigo-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between border border-indigo-400 z-30 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                            #{myStatsInCurrentTab.rank}
                        </div>
                        <div>
                            <p className="text-[8px] font-semibold uppercase opacity-80">{myStatsInCurrentTab.label}</p>
                            <p className="font-semibold text-xs truncate max-w-[120px]">
                                {activeTab === 'orgs' ? organizations.find(o => o.id === userProfile.organization)?.name : currentUser?.displayName}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-base font-bold">{myStatsInCurrentTab.value}</p>
                        <p className="text-[8px] font-semibold uppercase opacity-80">{myStatsInCurrentTab.unit}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
