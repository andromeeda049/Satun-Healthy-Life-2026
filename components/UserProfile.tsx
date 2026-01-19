
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, ACHIEVEMENTS } from '../constants';
import { UserProfile as UserProfileType } from '../types';
import OrganizationModal from './OrganizationModal'; 
import { SearchIcon, UserGroupIcon, ClipboardCheckIcon, LineIcon } from './icons';

const emojis = ['😊', '😎', '🎉', '🚀', '🌟', '💡', '🌱', '🍎', '💪', '🧠', '👍', '✨'];
const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

const UserProfile: React.FC = () => {
    const { userProfile, setUserProfile, currentUser, organizations, joinGroup, refreshGroups } = useContext(AppContext);
    
    // Safety check for userProfile
    const safeUserProfile = userProfile || {
        gender: 'male',
        age: '',
        weight: '',
        height: '',
        waist: '',
        hip: '',
        activityLevel: 1.2,
        healthCondition: HEALTH_CONDITIONS[0],
        xp: 0,
        level: 1,
        badges: [],
        organization: ''
    };

    const [healthData, setHealthData] = useState<UserProfileType>(safeUserProfile);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [profilePicture, setProfilePicture] = useState(currentUser?.profilePicture || '');
    
    const [saved, setSaved] = useState(false);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [groupCode, setGroupCode] = useState('');
    const [consentGiven, setConsentGiven] = useState(false);
    const [joining, setJoining] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setHealthData(userProfile);
        }
        if (currentUser) {
            setDisplayName(currentUser.displayName || '');
            setProfilePicture(currentUser.profilePicture || '');
        }
    }, [userProfile, currentUser]);

    const handleHealthChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHealthData(prev => ({ 
            ...prev, 
            [name]: (name === 'activityLevel') ? parseFloat(value) : value 
        }));
    };
    
    const handleOrgSelect = (orgId: string) => {
        setHealthData(prev => ({ ...prev, organization: orgId }));
        setShowOrgModal(false);
    };

    const handleRandomizeEmoji = () => {
        setProfilePicture(getRandomEmoji());
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setProfilePicture(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedProfile = { 
            ...healthData, 
            pillarScores: userProfile?.pillarScores,
            xp: userProfile?.xp,
            level: userProfile?.level,
            badges: userProfile?.badges,
            pdpaAccepted: userProfile?.pdpaAccepted,
            pdpaAcceptedDate: userProfile?.pdpaAcceptedDate
        };
        setUserProfile(updatedProfile, { displayName, profilePicture });
        setSaved(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSaved(false), 3000);
    };

    const handleJoinGroup = async () => {
        if (!groupCode) return alert('กรุณากรอกรหัสกลุ่ม');
        if (!consentGiven) return alert('กรุณายอมรับเงื่อนไขการเปิดเผยข้อมูล');
        
        // FIX: Ensure user info is present
        if (!currentUser || !currentUser.username) {
            alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาออกจากระบบแล้วเข้าใหม่");
            return;
        }

        setJoining(true);
        const res = await joinGroup(groupCode);
        if (res.success) {
            alert('เข้าร่วมกลุ่มสำเร็จ! คุณสามารถดูข้อมูลกลุ่มได้ที่หน้าหลัก');
            setGroupCode('');
            setConsentGiven(false);
        } else {
            alert(res.message);
        }
        setJoining(false);
    };
    
    if (!currentUser) return null;

    const isImage = profilePicture.startsWith('data:image/') || profilePicture.startsWith('http');
    // Ensure badges is an array to prevent crash
    const badges = Array.isArray(userProfile?.badges) ? userProfile.badges : [];
    const currentOrgName = (organizations || []).find(o => o.id === healthData.organization)?.name || 'เลือกหน่วยงาน...';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">ข้อมูลส่วนตัวและบัญชี</h2>
            
            {saved && (
                <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6 animate-fade-in" role="alert">
                    <p className="font-bold">บันทึกข้อมูลสำเร็จ!</p>
                </div>
            )}

            {/* Public LINE Group Invitation (Moved to Top) */}
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-100 dark:border-green-800 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-[#06C755] flex-shrink-0">
                        <LineIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-white text-base">กลุ่มสาธารณะ Satun Healthy Life</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                            เข้าร่วมกลุ่ม LINE Group เพื่อรับการแจ้งเตือนข่าวสาร และร่วมจัดอันดับคนรักสุขภาพ (Public Ranking)
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-dashed border-[#06C755] flex items-center justify-center gap-2">
                                <span className="text-[10px] text-gray-500 font-medium">Code:</span>
                                <span className="font-mono font-black text-[#06C755] text-lg tracking-wider">SHL2026</span>
                            </div>
                            <a 
                                href="https://line.me/ti/g/rjw7XHyTFm"
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-[#06C755] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-[#05b54d] transition-all text-center flex items-center justify-center gap-2 active:scale-95"
                            >
                                <LineIcon className="w-4 h-4" />
                                กดเข้าร่วมกลุ่มเลย
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Join Group Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-6 h-6" /> เข้าร่วมกลุ่มสุขภาพ / คลินิก (Join Group)
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">รหัสเข้ากลุ่ม (Access Code)</label>
                        <input 
                            type="text" 
                            value={groupCode}
                            onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                            placeholder="เช่น DM001, FIT2024"
                            className="w-full p-3 border border-blue-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                        />
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <input 
                            type="checkbox" 
                            checked={consentGiven} 
                            onChange={(e) => setConsentGiven(e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                            ข้าพเจ้ายินยอมให้ผู้ดูแลกลุ่ม (Admin) เข้าถึงข้อมูลสุขภาพของข้าพเจ้า เพื่อการติดตามผลและให้คำแนะนำสุขภาพ
                        </span>
                    </label>
                    <button 
                        onClick={handleJoinGroup}
                        disabled={joining || !groupCode || !consentGiven}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {joining ? 'กำลังตรวจสอบ...' : 'เข้าร่วมกลุ่ม'}
                    </button>
                </div>
            </div>
            
             <div className="p-4 border dark:border-gray-700 rounded-lg mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-4">เหรียญรางวัลที่ได้รับ ({badges.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {ACHIEVEMENTS.map(achievement => {
                        const isUnlocked = badges.includes(achievement.id);
                        return (
                            <div key={achievement.id} className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${isUnlocked ? 'opacity-100 scale-105' : 'opacity-40 grayscale'}`}>
                                <div className="text-3xl mb-1 bg-white dark:bg-gray-600 rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
                                    {achievement.icon}
                                </div>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{achievement.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* ... (Existing Profile Form Fields) ... */}
                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">จัดการบัญชี</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (ID)</label>
                            <p className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 font-mono text-sm">
                                @{currentUser.username}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อที่แสดง</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500"
                                placeholder="ชื่อของคุณ"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                                รหัสกลุ่มตัวอย่าง / รหัสพนักงาน (Research ID)
                            </label>
                            <input
                                type="text"
                                name="researchId"
                                value={healthData.researchId || ''}
                                onChange={handleHealthChange}
                                className="w-full p-2 border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-md focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-200"
                                placeholder="เช่น STN-001 (ระบุตามที่ได้รับแจ้ง)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">สังกัด/หน่วยงาน (Organization)</label>
                            <button
                                type="button"
                                onClick={() => setShowOrgModal(true)}
                                className="w-full p-3 border border-teal-300 dark:border-teal-700 rounded-md bg-teal-50 dark:bg-teal-900/20 text-left flex items-center justify-between group hover:border-teal-500 transition-colors"
                            >
                                <span className={`font-bold ${healthData.organization ? 'text-teal-800 dark:text-teal-200' : 'text-gray-400'}`}>
                                    {currentOrgName}
                                </span>
                                <span className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <SearchIcon className="w-4 h-4 text-teal-600" />
                                </span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">รูปโปรไฟล์</label>
                            <div className="flex items-center gap-4">
                                {isImage ? (
                                    <img src={profilePicture} alt="Profile preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"/>
                                ) : (
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                                        <span className="text-3xl">{profilePicture}</span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleRandomizeEmoji} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">สุ่ม Emoji</button>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">อัปโหลด</button>
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ข้อมูลสุขภาพพื้นฐาน</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เพศ</label>
                                <select name="gender" value={healthData.gender} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500">
                                    <option value="male">ชาย</option>
                                    <option value="female">หญิง</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">อายุ (ปี)</label>
                                <input type="number" name="age" value={healthData.age} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 35"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">น้ำหนัก (กก.)</label>
                                <input type="number" name="weight" value={healthData.weight} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 75"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ส่วนสูง (ซม.)</label>
                                <input type="number" name="height" value={healthData.height} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 175"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รอบเอว (ซม.)</label>
                                <input type="number" name="waist" value={healthData.waist} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 90"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รอบสะโพก (ซม.)</label>
                                <input type="number" name="hip" value={healthData.hip} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500" placeholder="เช่น 100"/>
                            </div>
                        </div>
                        <div className="border-t dark:border-gray-600 pt-4 mt-2">
                             <label className="block text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">โรคประจำตัว / ความเสี่ยงสุขภาพ (สำหรับ AI Coach)</label>
                            <select name="healthCondition" value={healthData.healthCondition || HEALTH_CONDITIONS[0]} onChange={handleHealthChange} className="w-full p-2 border border-teal-300 dark:border-teal-700 rounded-md bg-teal-50 dark:bg-teal-900/20 focus:ring-2 focus:ring-teal-500 text-gray-800 dark:text-gray-200">
                                {HEALTH_CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                            </select>
                        </div>
                         <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับกิจกรรม</label>
                            <select name="activityLevel" value={healthData.activityLevel} onChange={handleHealthChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500">
                                {PLANNER_ACTIVITY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 transition-all duration-300 transform hover:scale-105"
                >
                    บันทึกข้อมูลทั้งหมด
                </button>
            </form>

            {showOrgModal && (
                <OrganizationModal 
                    onSelect={handleOrgSelect} 
                    onClose={() => setShowOrgModal(false)}
                    initialValue={healthData.organization}
                />
            )}
        </div>
    );
};

export default UserProfile;
