
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { createGroup, getAdminGroups, fetchGroupMembers, fetchUserDataByAdmin } from '../services/googleSheetService';
import { UserGroupIcon, SquaresIcon, CameraIcon, ClipboardListIcon, LineIcon, ArrowLeftIcon, UserCircleIcon, TrophyIcon, SearchIcon, XIcon, ScaleIcon, FireIcon, ChartBarIcon, HeartIcon, StethoscopeIcon, WaterDropIcon, BrainIcon, MoonIcon } from './icons';

const MemberDetailModal: React.FC<{ member: any; onClose: () => void }> = ({ member, onClose }) => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [fullData, setFullData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch detailed data when modal opens
    useEffect(() => {
        const loadDetails = async () => {
            if (scriptUrl && currentUser && member.username) {
                setLoading(true);
                try {
                    const data = await fetchUserDataByAdmin(scriptUrl, currentUser, member.username);
                    setFullData(data);
                } catch (e) {
                    console.error("Failed to load member details", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadDetails();
    }, [scriptUrl, currentUser, member.username]);
    
    // Calculate Basic Metrics from basic member info (fallback)
    const basicMetrics = useMemo(() => {
        const weight = parseFloat(member.weight || '0');
        const height = parseFloat(member.height || '0');
        const age = parseFloat(member.age || '0');
        const gender = member.gender || 'male';
        const activityLevel = parseFloat(member.activityLevel || '1.2');

        let bmi = 0;
        let tdee = 0;
        let bmiCategory = '-';

        if (weight > 0 && height > 0) {
            const hM = height / 100;
            bmi = weight / (hM * hM);
            if (bmi < 18.5) bmiCategory = 'ผอม';
            else if (bmi < 23) bmiCategory = 'สมส่วน';
            else if (bmi < 25) bmiCategory = 'ท้วม';
            else if (bmi < 30) bmiCategory = 'อ้วน 1';
            else bmiCategory = 'อ้วน 2';
        }

        if (weight > 0 && height > 0 && age > 0) {
            const bmr = gender === 'male' 
                ? (10 * weight + 6.25 * height - 5 * age + 5)
                : (10 * weight + 6.25 * height - 5 * age - 161);
            tdee = bmr * activityLevel;
        }

        return { 
            bmi: bmi > 0 ? bmi.toFixed(1) : '-', 
            bmiCategory,
            tdee: tdee > 0 ? Math.round(tdee).toLocaleString() : '-' 
        };
    }, [member]);

    // Extract Latest Clinical & Risk Data
    const advancedMetrics = useMemo(() => {
        if (!fullData) return null;

        // Helper to sort by date desc
        const sortByDate = (arr: any[]) => [...(arr || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const latestClinical = sortByDate(fullData.clinicalHistory)[0] || {};
        const latestRisk = sortByDate(fullData.riskHistory)[0] || {};
        const latestStats = fullData.profile || {}; // Sometimes updated profile has latest

        return {
            bp: latestClinical.systolic ? `${latestClinical.systolic}/${latestClinical.diastolic}` : '-',
            fbs: latestClinical.fbs ? `${latestClinical.fbs}` : '-',
            cvd: latestRisk.cvdRiskLevel || '-',
            depression: latestRisk.depressionSeverity || (latestRisk.depressionRisk ? 'Positive' : 'Normal'),
            sleep: latestRisk.sleepApneaRisk || '-',
            // Fallback to basic member if not found in fullData
            waist: latestClinical.waist || member.waist || '-',
            hip: member.hip || '-'
        };
    }, [fullData, member]);

    const getRiskColor = (level: string) => {
        if (['very_high', 'high', 'severe'].includes(level)) return 'text-red-600 bg-red-50 border-red-200';
        if (['moderate'].includes(level)) return 'text-orange-600 bg-orange-50 border-orange-200';
        if (['mild', 'low'].includes(level)) return 'text-green-600 bg-green-50 border-green-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getCvdLabel = (level: string) => {
        const map: any = { low: 'เสี่ยงต่ำ', moderate: 'ปานกลาง', high: 'สูง', very_high: 'สูงมาก' };
        return map[level] || level;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-0 relative animate-bounce-in max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors z-10">
                        <XIcon className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg overflow-hidden mb-3 bg-white">
                             {member.profilePicture && (member.profilePicture.startsWith('http') || member.profilePicture.startsWith('data')) ? (
                                <img src={member.profilePicture} alt={member.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">{member.profilePicture || '👤'}</div>
                            )}
                        </div>
                        <h3 className="text-xl font-bold">{member.displayName}</h3>
                        <p className="text-xs opacity-80 font-mono mb-3">@{member.username}</p>
                        
                        <div className="flex gap-2">
                            <span className="px-3 py-0.5 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/10">
                                Level {member.level}
                            </span>
                            <span className="px-3 py-0.5 bg-yellow-400/90 text-yellow-900 rounded-full text-[10px] font-bold shadow-sm">
                                {member.xp?.toLocaleString()} XP
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* 1. Basic Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                                <ScaleIcon className="w-3 h-3 text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase">BMI</span>
                            </div>
                            <span className="text-2xl font-black text-gray-800 dark:text-white">{basicMetrics.bmi}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{basicMetrics.bmiCategory}</span>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex flex-col items-center">
                            <div className="flex items-center gap-1 mb-1">
                                <FireIcon className="w-3 h-3 text-orange-500" />
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-300 uppercase">TDEE</span>
                            </div>
                            <span className="text-2xl font-black text-gray-800 dark:text-white">{basicMetrics.tdee}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">kcal/วัน</span>
                        </div>
                    </div>

                    {/* 2. Clinical Data (Requires Fetch) */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                            <StethoscopeIcon className="w-3 h-3" /> ข้อมูลทางคลินิก (ล่าสุด)
                        </h4>
                        
                        {loading ? (
                            <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : advancedMetrics ? (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700/30 dark:border-gray-600 text-center">
                                    <span className="text-[9px] text-gray-400 block uppercase">ความดัน (BP)</span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">{advancedMetrics.bp}</span>
                                </div>
                                <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700/30 dark:border-gray-600 text-center">
                                    <span className="text-[9px] text-gray-400 block uppercase">น้ำตาล (FBS)</span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">{advancedMetrics.fbs}</span>
                                </div>
                                <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700/30 dark:border-gray-600 text-center">
                                    <span className="text-[9px] text-gray-400 block uppercase">รอบเอว</span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white">{advancedMetrics.waist}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-center text-gray-400">ไม่พบข้อมูลเพิ่มเติม</p>
                        )}
                    </div>

                    {/* 3. Risk Assessment */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-1">
                            <HeartIcon className="w-3 h-3" /> การประเมินความเสี่ยง
                        </h4>

                        {loading ? (
                            <div className="h-20 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-xl"></div>
                        ) : advancedMetrics ? (
                            <div className="space-y-2">
                                {/* CVD Risk */}
                                <div className={`flex justify-between items-center p-3 rounded-xl border ${getRiskColor(advancedMetrics.cvd)}`}>
                                    <div className="flex items-center gap-2">
                                        <HeartIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">Thai CV Risk</span>
                                    </div>
                                    <span className="text-xs font-black uppercase">{getCvdLabel(advancedMetrics.cvd)}</span>
                                </div>

                                {/* Mental Health */}
                                <div className={`flex justify-between items-center p-3 rounded-xl border ${getRiskColor(advancedMetrics.depression)}`}>
                                    <div className="flex items-center gap-2">
                                        <BrainIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">สุขภาพจิต (9Q)</span>
                                    </div>
                                    <span className="text-xs font-black uppercase">{advancedMetrics.depression === 'normal' ? 'ปกติ' : advancedMetrics.depression}</span>
                                </div>

                                {/* Sleep Risk */}
                                <div className={`flex justify-between items-center p-3 rounded-xl border ${advancedMetrics.sleep === 'high' ? getRiskColor('high') : getRiskColor('low')}`}>
                                    <div className="flex items-center gap-2">
                                        <MoonIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">การนอน (STOP-BANG)</span>
                                    </div>
                                    <span className="text-xs font-black uppercase">{advancedMetrics.sleep === 'high' ? 'เสี่ยงสูง' : 'ปกติ'}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* 4. Bio Data */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-500">อายุ</span>
                                <span className="font-bold dark:text-white">{member.age || '-'} ปี</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ส่วนสูง</span>
                                <span className="font-bold dark:text-white">{member.height || '-'} ซม.</span>
                            </div>
                            <div className="flex justify-between col-span-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                <span className="text-gray-500">โรคประจำตัว</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">{member.healthCondition || '-'}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const GroupDetail: React.FC<{ group: any, onBack: () => void }> = ({ group, onBack }) => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            if (scriptUrl && currentUser) {
                try {
                    const res = await fetchGroupMembers(scriptUrl, currentUser, group.id);
                    // Sort members by XP (Leaderboard style)
                    setMembers(res.sort((a: any, b: any) => b.xp - a.xp));
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchMembers();
    }, [group, scriptUrl, currentUser]);

    return (
        <div className="space-y-6 animate-slide-up pb-20">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5" /> 
                <span className="text-sm font-bold">ย้อนกลับไปหน้ารวม</span>
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                     {group.image ? <img src={group.image} alt={group.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><UserGroupIcon className="w-10 h-10" /></div>}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{group.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{group.description || "ไม่มีรายละเอียด"}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-2">
                            <span>CODE:</span>
                            <span className="font-mono text-base">{group.code}</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            <span>สมาชิก {members.length} คน</span>
                        </div>
                        {group.lineLink && (
                            <a href={group.lineLink} target="_blank" rel="noreferrer" className="bg-[#06C755] text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-[#05b54d] transition-colors">
                                <LineIcon className="w-4 h-4" /> OpenChat
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Member List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        อันดับสมาชิก (Leaderboard)
                    </h3>
                </div>
                
                {loading ? (
                    <div className="p-10 flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400 text-sm">กำลังโหลดรายชื่อสมาชิก...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">ยังไม่มีสมาชิกเข้าร่วมกลุ่มนี้</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {members.map((member, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedMember(member)}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 group-hover:scale-105 transition-transform">
                                        {member.profilePicture && (member.profilePicture.startsWith('http') || member.profilePicture.startsWith('data')) ? (
                                            <img src={member.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">{member.profilePicture || '👤'}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{member.displayName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">@{member.username}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{member.xp?.toLocaleString()} HP</p>
                                    <p className="text-[10px] text-gray-400">Level {member.level}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedMember && <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
        </div>
    );
};

const GroupManagement: React.FC = () => {
    const { scriptUrl, currentUser, setActiveView } = useContext(AppContext);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
    
    // Create Form State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newGroupCode, setNewGroupCode] = useState('');
    const [newLineLink, setNewLineLink] = useState('');
    const [creating, setCreating] = useState(false);
    const [newGroupImage, setNewGroupImage] = useState<string>('');
    const imageInputRef = useRef<HTMLInputElement>(null);

    const loadGroups = async () => {
        if (scriptUrl && currentUser) {
            setLoading(true);
            const res = await getAdminGroups(scriptUrl, currentUser);
            setGroups(res);
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (!selectedGroup) loadGroups(); 
    }, [scriptUrl, currentUser, selectedGroup]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewGroupImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || !newGroupCode.trim() || !scriptUrl || !currentUser) return;
        
        setCreating(true);
        const res = await createGroup(scriptUrl, currentUser, { 
            name: newGroupName, 
            code: newGroupCode,
            description: newGroupDesc,
            lineLink: newLineLink,
            image: newGroupImage
        });
        
        if (res.status === 'success') {
            alert('สร้างกลุ่มสำเร็จ');
            setNewGroupName(''); setNewGroupDesc(''); setNewGroupCode(''); setNewLineLink(''); setNewGroupImage('');
            loadGroups();
        } else {
            alert('สร้างกลุ่มไม่สำเร็จ: ' + res.message);
        }
        setCreating(false);
    };

    const copyToClipboard = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        alert(`คัดลอกรหัส "${text}" แล้ว`);
    };

    // If a group is selected, show detail view
    if (selectedGroup) {
        return <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveView('menu')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-indigo-500" />
                        จัดการกลุ่ม
                    </h1>
                </div>
                <button onClick={loadGroups} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Create Group Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 border-l-indigo-500">
                <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">สร้างกลุ่มดูแลสุขภาพใหม่</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">สร้างคลินิกออนไลน์หรือกลุ่มเฉพาะกิจสำหรับติดตามสุขภาพ</p>
                </div>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div 
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors h-40 bg-gray-50 dark:bg-gray-900/50" 
                            onClick={() => imageInputRef.current?.click()}
                        >
                            {newGroupImage ? (
                                <img src={newGroupImage} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-sm" />
                            ) : (
                                <>
                                    <CameraIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500">อัปโหลดรูปปกกลุ่ม</span>
                                </>
                            )}
                            <input type="file" ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ชื่อกลุ่ม *</label>
                            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="เช่น คลินิกเบาหวาน รพ.สต.บ้านควน" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">รายละเอียดกลุ่ม</label>
                            <textarea
                                value={newGroupDesc}
                                onChange={e => setNewGroupDesc(e.target.value)}
                                placeholder="อธิบายวัตถุประสงค์ของกลุ่ม..."
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">รหัสเข้ากลุ่ม (Access Code) *</label>
                            <input type="text" value={newGroupCode} onChange={e => setNewGroupCode(e.target.value.toUpperCase())} placeholder="เช่น DM001 (ต้องไม่ซ้ำ)" className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase dark:text-white" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ลิงก์ LINE OpenChat</label>
                            <input type="url" value={newLineLink} onChange={e => setNewLineLink(e.target.value)} placeholder="https://line.me/..." className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
                        </div>
                        <button type="submit" disabled={creating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                            {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><SquaresIcon className="w-5 h-5" /> สร้างกลุ่มใหม่</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Group List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2 px-1">
                    <ClipboardListIcon className="w-5 h-5 text-teal-500" />
                    รายการกลุ่มของคุณ ({groups.length})
                </h3>
                
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groups.map((g, i) => (
                            <div 
                                key={i} 
                                className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                            >
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                                        {g.image ? <img src={g.image} alt={g.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><UserGroupIcon className="w-8 h-8" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 dark:text-white text-lg truncate group-hover:text-indigo-600 transition-colors">{g.name}</h4>
                                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-lg text-xs font-bold shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-800">
                                                {g.memberCount || 0} คน
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 font-mono font-bold">{g.code}</span>
                                            <button 
                                                onClick={(e) => copyToClipboard(e, g.code)} 
                                                className="text-gray-400 hover:text-teal-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Copy Code"
                                            >
                                                <ClipboardListIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setSelectedGroup(g)}
                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <SquaresIcon className="w-4 h-4" />
                                    จัดการ / ดูรายละเอียด
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {!loading && groups.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">ยังไม่มีกลุ่มที่สร้างไว้</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupManagement;
