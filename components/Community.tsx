
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
    groupXp?: number; // Added groupXp
    score?: number;
}

interface OrgRanking {
    id: string;
    name: string;
    totalXp: number;
    memberCount: number;
    avgXp: number;
}

interface GlobalLeaderboardData {
    leaderboard: LeaderboardUser[];
    trending: LeaderboardUser[];
    categories: { water: LeaderboardUser[], food: LeaderboardUser[], activity: LeaderboardUser[] };
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser, userProfile, organizations, myGroups } = useContext(AppContext);
    
    // Split Data States to prevent reload
    const [globalData, setGlobalData] = useState<GlobalLeaderboardData | null>(null);
    const [groupData, setGroupData] = useState<LeaderboardUser[]>([]);
    
    const [loadingGlobal, setLoadingGlobal] = useState(true);
    const [loadingGroup, setLoadingGroup] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // UI States: Default to 'myGroup' if user has groups, else 'users'
    const [activeTab, setActiveTab] = useState<'users' | 'trending' | 'myGroup' | 'orgs' | 'water' | 'food' | 'activity'>(() => {
        return (myGroups && myGroups.length > 0) ? 'myGroup' : 'users';
    });
    
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("กำลังจัดอันดับผู้พิชิต...");
    
    // Debug
    const [showDebug, setShowDebug] = useState(false);
    
    const shareCardRef = useRef<HTMLDivElement>(null);
    const leaderboardRef = useRef<HTMLDivElement>(null);

    // 1. Initial Load (Global Data) - Run ONCE
    useEffect(() => {
        const loadGlobalData = async () => {
            if (!scriptUrl) return;
            setLoadingGlobal(true);
            setError(null);
            
            try {
                // Determine initial group selection if available
                if (myGroups && myGroups.length > 0) {
                    setSelectedGroupId(myGroups[0].id);
                }

                const data = await fetchLeaderboard(scriptUrl, currentUser || undefined); // No groupId = Global
                if (!data) throw new Error("ไม่ได้รับข้อมูลจาก Server");

                const filterAdmins = (list: any[]) => {
                    if (!Array.isArray(list)) return [];
                    return list.filter((u: any) => {
                        const role = String(u.role || '').toLowerCase();
                        const username = String(u.username || '').toLowerCase();
                        const name = String(u.displayName || '').toLowerCase();
                        const org = String(u.organization || '').toLowerCase();
                        
                        // กรอง Admin และ User เฉพาะที่ระบุ
                        return role !== 'admin' && 
                               !username.startsWith('admin') && 
                               !name.includes('admin') && 
                               org !== 'all' &&
                               username !== 'line_1765868496729';
                    });
                };

                setGlobalData({
                    leaderboard: Array.isArray(data.leaderboard) ? filterAdmins(data.leaderboard).sort((a: any, b: any) => b.xp - a.xp) : [],
                    trending: Array.isArray(data.trending) ? filterAdmins(data.trending) : [],
                    categories: {
                        water: filterAdmins(data.categories?.water || []),
                        food: filterAdmins(data.categories?.food || []),
                        activity: filterAdmins(data.categories?.activity || [])
                    }
                });

            } catch (err: any) {
                console.error("Leaderboard Error:", err);
                setError(err.message || "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
            } finally {
                setLoadingGlobal(false);
            }
        };

        loadGlobalData();
    }, [scriptUrl]); // Dependency on scriptUrl only (essentially mount)

    // 2. Group Load - Run when selectedGroupId changes
    useEffect(() => {
        const loadGroupData = async () => {
            if (!scriptUrl || !selectedGroupId) return;
            
            // Only fetch if we are actually viewing the group tab (optimization)
            if (activeTab !== 'myGroup') return;

            setLoadingGroup(true);
            try {
                // Pass groupId to Backend for SERVER-SIDE filtering
                const data = await fetchLeaderboard(scriptUrl, currentUser || undefined, selectedGroupId);
                
                const filterAdmins = (list: any[]) => {
                    if (!Array.isArray(list)) return [];
                    return list.filter((u: any) => {
                        const role = String(u.role || '').toLowerCase();
                        const username = String(u.username || '').toLowerCase();
                        // กรอง Admin และ User เฉพาะที่ระบุ
                        return role !== 'admin' && 
                               !username.startsWith('admin') &&
                               username !== 'line_1765868496729'; 
                    });
                };

                if (data && Array.isArray(data.leaderboard)) {
                    // Backend calculates groupXp and sorts by it
                    setGroupData(filterAdmins(data.leaderboard));
                } else {
                    setGroupData([]);
                }
            } catch (err) {
                console.error("Group Fetch Error:", err);
            } finally {
                setLoadingGroup(false);
            }
        };

        loadGroupData();
    }, [selectedGroupId, activeTab, scriptUrl]);

    // Derived Data for Orgs
    const orgRankings = useMemo(() => {
        if (!globalData?.leaderboard) return [];
        const stats: Record<string, { total: number, count: number }> = {};
        globalData.leaderboard.forEach(user => {
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
    }, [globalData, organizations]);

    // Current Data Source based on Tab
    const currentList = useMemo(() => {
        if (!globalData) return [];
        switch (activeTab) {
            case 'trending': return globalData.trending;
            case 'myGroup': return groupData; // From separate fetch
            case 'orgs': return []; // Handled separately
            case 'water': return globalData.categories.water;
            case 'food': return globalData.categories.food;
            case 'activity': return globalData.categories.activity;
            default: return globalData.leaderboard;
        }
    }, [activeTab, globalData, groupData]);

    const myStatsInCurrentTab = useMemo(() => {
        if (!currentUser || !globalData) return null;

        let rank = -1;
        let value = '';
        let unit = '';
        let label = '';

        if (activeTab === 'users') {
            rank = globalData.leaderboard.findIndex(u => u.username === currentUser.username);
            const user = globalData.leaderboard[rank];
            if (user) { value = user.xp.toLocaleString(); unit = 'HP'; label = 'คะแนนสะสม'; }
        } else if (activeTab === 'myGroup') {
            rank = groupData.findIndex(u => u.username === currentUser.username);
            const user = groupData[rank];
            // Use groupXp if available, fallback to 0
            if (user) { value = (user.groupXp || 0).toLocaleString(); unit = 'Group HP'; label = 'คะแนนกลุ่ม'; }
        } else if (activeTab === 'trending') {
            rank = globalData.trending.findIndex(u => u.username === currentUser.username);
            const user = globalData.trending[rank];
            if (user) { value = (user.weeklyXp || 0).toLocaleString(); unit = 'HP'; label = 'สัปดาห์นี้'; }
        } else if (activeTab === 'water') {
            rank = globalData.categories.water.findIndex(u => u.username === currentUser.username);
            const user = globalData.categories.water[rank];
            if (user) { value = ((user.score || 0) / 1000).toFixed(1); unit = 'ลิตร'; label = 'ปริมาณน้ำ'; }
        } else if (activeTab === 'food') {
            rank = globalData.categories.food.findIndex(u => u.username === currentUser.username);
            const user = globalData.categories.food[rank];
            if (user) { value = (user.score || 0).toString(); unit = 'รายการ'; label = 'บันทึกอาหาร'; }
        } else if (activeTab === 'activity') {
            rank = globalData.categories.activity.findIndex(u => u.username === currentUser.username);
            const user = globalData.categories.activity[rank];
            if (user) { value = (user.score || 0).toLocaleString(); unit = 'kcal'; label = 'เผาผลาญ'; }
        } else if (activeTab === 'orgs') {
            const myOrgId = userProfile.organization;
            rank = orgRankings.findIndex(o => o.id === myOrgId);
            const org = orgRankings[rank];
            if (org) { value = org.avgXp.toLocaleString(); unit = 'คะแนนเฉลี่ย'; label = 'หน่วยงานคุณ'; }
        }

        if (rank === -1) return null;
        return { rank: rank + 1, value, unit, label };
    }, [activeTab, globalData, groupData, orgRankings, currentUser, userProfile]);

    const captureAndShare = async (element: HTMLElement, filename: string) => {
        try {
            if (!element) {
                alert("ไม่พบข้อมูลที่จะแชร์ (Element not found)");
                return;
            }

            const canvas = await html2canvas(element, { 
                useCORS: true, 
                scale: 2, 
                backgroundColor: '#f8fafc',
                logging: false,
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight
            });
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("สร้างรูปภาพไม่สำเร็จ");
            
            const file = new File([blob], filename, { type: 'image/png' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'Satun Healthy Life', text: `🏆 อันดับสุขภาพของฉันใน Satun Smart Life! #${myStatsInCurrentTab?.rank}` });
                } catch (shareErr: any) {
                    if (shareErr.name !== 'AbortError') {
                        // If sharing failed (not cancelled), try download
                        const link = document.createElement('a');
                        link.href = canvas.toDataURL('image/png');
                        link.download = filename;
                        link.click();
                    }
                }
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = filename;
                link.click();
            }
        } catch (err: any) {
            console.error(err);
            alert(`ไม่สามารถแชร์รูปได้: ${err.message}`);
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

        if (activeTab === 'myGroup') {
            title = "กลุ่มของฉัน";
            icon = <UserGroupIcon className="text-5xl" />;
            gradient = "from-teal-500 to-blue-500";
            subtitle = "จัดอันดับคะแนนที่ได้หลังจากเข้ากลุ่ม";
        } else if (activeTab === 'trending') { 
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

    const renderRankingItem = (user: LeaderboardUser, idx: number, value: string, unit: string, valueColor: string) => {
        const isMe = user.username === currentUser?.username;
        const org = organizations.find(o => o.id === user.organization);
        const orgDisplay = org ? org.name : (user.organization === 'general' ? 'บุคคลทั่วไป' : user.organization || 'ทั่วไป');

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
                    {user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data') ? <img src={user.profilePicture} alt="User" crossOrigin="anonymous" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">{user.profilePicture || '👤'}</div>}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-[13px] tracking-tight truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                        {user.displayName} {isMe && '(คุณ)'}
                    </h4>
                    <p className="text-[9px] font-medium text-slate-400 truncate">{orgDisplay}</p>
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

    if (loadingGlobal) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            {/* Podium & Trophy Container */}
            <div className="relative flex flex-col items-center">
                {/* Floating/Bouncing Trophy */}
                <div className="relative z-10 animate-bounce mb-[-10px]">
                    <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 rounded-full"></div>
                    <TrophyIcon className="w-28 h-28 text-yellow-500 drop-shadow-2xl" />
                    
                    {/* Sparkles */}
                    <div className="absolute -top-4 -right-4 animate-pulse">
                        <StarIcon className="w-8 h-8 text-yellow-300" />
                    </div>
                    <div className="absolute top-10 -left-6 animate-pulse delay-75">
                        <StarIcon className="w-5 h-5 text-yellow-300" />
                    </div>
                </div>

                {/* Podium Base */}
                <div className="flex items-end gap-1">
                    <div className="w-8 h-12 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg"></div>
                    <div className="w-16 h-16 bg-indigo-500 dark:bg-indigo-600 rounded-t-lg shadow-lg relative flex justify-center pt-2">
                        <span className="text-white font-bold opacity-50 text-xl">1</span>
                    </div>
                    <div className="w-8 h-10 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg"></div>
                </div>
            </div>

            <div className="text-center mt-8 space-y-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white animate-pulse">
                    กำลังจัดอันดับผู้พิชิต...
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {loadingMessage}
                </p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center pt-16 pb-12 px-6 animate-fade-in text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-sm">ลองใหม่อีกครั้ง</button>
        </div>
    );

    return (
        <div className="animate-fade-in pb-24 relative">
            {renderHeader()}
            
            {/* Hidden Share Card Template - Always Rendered but Off-screen for capturing */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                <div ref={shareCardRef} className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-xl shadow-xl flex items-center justify-between border border-white/20 w-[350px]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-white/30">
                            #{myStatsInCurrentTab?.rank}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase opacity-70 tracking-widest">{myStatsInCurrentTab?.label}</p>
                            <p className="font-bold text-lg truncate max-w-[180px]">
                                {activeTab === 'orgs' ? organizations.find(o => o.id === userProfile.organization)?.name : currentUser?.displayName}
                            </p>
                            <p className="text-[10px] opacity-75 mt-1 font-medium bg-white/10 px-2 py-0.5 rounded-full inline-block">Satun Healthy Life 2026</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black">{myStatsInCurrentTab?.value}</p>
                        <p className="text-xs font-bold uppercase opacity-80">{myStatsInCurrentTab?.unit}</p>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="bg-white dark:bg-gray-800 p-2 rounded-xl mb-4 shadow-sm border border-slate-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'users' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <TrophyIcon className="w-3 h-3" /> รวม
                    </button>
                    <button onClick={() => setActiveTab('trending')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'trending' ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <FireIcon className="w-3 h-3" /> มาแรง
                    </button>
                    <button onClick={() => setActiveTab('myGroup')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'myGroup' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 dark:bg-gray-700'}`}>
                        <UserGroupIcon className="w-3 h-3" /> กลุ่มฉัน
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

            {/* My Group Selector - Only show in My Group Tab */}
            {activeTab === 'myGroup' && myGroups && myGroups.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2 pl-1">เลือกกลุ่มที่ต้องการดูอันดับ:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {myGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroupId(group.id)}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                    selectedGroupId === group.id
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700'
                                    : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                }`}
                            >
                                {group.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div ref={leaderboardRef} className="space-y-2 min-h-[200px]">
                {loadingGroup && activeTab === 'myGroup' ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && currentList.map((user, idx) => renderRankingItem(user, idx, (user.xp || 0).toLocaleString(), 'HP', 'text-indigo-600 dark:text-indigo-400'))}

                        {activeTab === 'trending' && currentList.map((user, idx) => renderRankingItem(user, idx, (user.weeklyXp || 0).toLocaleString(), 'Weekly HP', 'text-rose-600 dark:text-rose-400'))}
                        
                        {/* Display Group XP in My Group Tab */}
                        {activeTab === 'myGroup' && currentList.map((user, idx) => renderRankingItem(user, idx, (user.groupXp || 0).toLocaleString(), 'Group HP', 'text-indigo-600 dark:text-indigo-400'))}

                        {activeTab === 'water' && currentList.map((user, idx) => renderRankingItem(user, idx, ((user.score || 0) / 1000).toFixed(1) + ' L', 'ปริมาณรวม', 'text-blue-600 dark:text-blue-400'))}
                        
                        {activeTab === 'food' && currentList.map((user, idx) => renderRankingItem(user, idx, (user.score || 0).toString(), 'รายการ', 'text-purple-600 dark:text-purple-400'))}
                        
                        {activeTab === 'activity' && currentList.map((user, idx) => renderRankingItem(user, idx, (user.score || 0).toLocaleString(), 'kcal', 'text-yellow-600 dark:text-yellow-400'))}

                        {activeTab === 'orgs' && orgRankings.map((org, idx) => renderOrgItem(org, idx))}
                    </>
                )}
                
                {activeTab === 'myGroup' && (!myGroups || myGroups.length === 0) && (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white">ท่านยังไม่ได้เข้าร่วมกลุ่ม</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-4">เข้าร่วมกลุ่มเพื่อดูอันดับในกลุ่มของคุณ</p>
                        <button className="bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md" onClick={() => window.location.href='?view=profile'}>ไปที่หน้าโปรไฟล์</button>
                    </div>
                )}

                {!loadingGroup && currentList.length === 0 && activeTab !== 'orgs' && !(activeTab === 'myGroup' && (!myGroups || myGroups.length === 0)) && (
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
                    <p>Active Tab: {activeTab}</p>
                    <p>Global Data: {globalData ? 'Loaded' : 'Null'}</p>
                    <p>Group Data: {groupData ? `Loaded (${groupData.length})` : 'Null'}</p>
                </div>
            )}

            {/* Sticky Stats Footer (Always show if myStats found, except top 3 who see themselves on screen) */}
            {myStatsInCurrentTab && myStatsInCurrentTab.rank > 3 && (
                <div className="fixed bottom-20 left-4 right-4 bg-indigo-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between border border-indigo-400 z-30 animate-slide-up">
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
