
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeftIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, XIcon, MedalIcon, HeartIcon, ClipboardListIcon } from './icons';
import { RedemptionHistoryEntry } from '../types';

interface RewardItem {
    id: string;
    name: string;
    description: string;
    xpCost: number;
    icon: string;
    type: 'physical' | 'digital' | 'impact' | 'experience';
    tag?: string;
}

const REWARDS: RewardItem[] = [
    {
        id: 'book_satun',
        name: 'Pocketbook "ชีวิตดีที่สตูล"',
        description: 'หนังสือคู่มือดูแลสุขภาพฉบับพกพา รวมเคล็ดลับวิถีคนสตูล กินดี อยู่ดี มีสุข',
        xpCost: 2500,
        icon: '📖',
        type: 'physical',
        tag: 'Recommended'
    },
    {
        id: 'bottle_satun',
        name: 'กระบอกน้ำ "ชีวิตดีที่สตูล"',
        description: 'กระบอกน้ำเก็บอุณหภูมิสกรีนลาย Limited Edition ช่วยลดขยะพลาสติก',
        xpCost: 3500,
        icon: '🍶',
        type: 'physical',
        tag: 'Popular'
    },
    {
        id: 'shirt_satun',
        name: 'เสื้อยืดออกกำลังกาย "ชีวิตดีที่สตูล"',
        description: 'เสื้อวิ่งผ้า Micro-polyester ระบายเหงื่อดีเยี่ยม สวมใส่สบายทุกการเคลื่อนไหว',
        xpCost: 5000,
        icon: '👕',
        type: 'physical'
    },
    {
        id: 'coupon_checkup',
        name: 'คูปองตรวจสุขภาพฟรี',
        description: 'ร่วมมือกับโรงพยาบาลในสตูล แลกสิทธิ์ตรวจวัดองค์ประกอบร่างกาย (Body Composition) หรือตรวจเลือดพื้นฐาน',
        xpCost: 4500,
        icon: '🩺',
        type: 'experience',
        tag: 'Health Care'
    },
    {
        id: 'discount_food',
        name: 'ส่วนลดร้านอาหาร Healthy',
        description: 'ส่วนลดพิเศษสำหรับเมนูชูสุขภาพ ณ ร้านอาหารโครงการ Satun Healthy Partners',
        xpCost: 800,
        icon: '🥗',
        type: 'experience',
        tag: 'Partner'
    },
    {
        id: 'ticket_run',
        name: 'บัตรเข้าร่วมกิจกรรมเดิน-วิ่ง',
        description: 'สิทธิ์เข้าร่วมกิจกรรมมาราธอนหรือเดิน-วิ่งเพื่อสุขภาพของจังหวัดสตูลฟรี',
        xpCost: 3000,
        icon: '🏃',
        type: 'experience',
        tag: 'Activity'
    },
    {
        id: 'donate_patient',
        name: 'บริจาคแต้มช่วยผู้ป่วยติดเตียง',
        description: 'เปลี่ยนสุขภาพดีของคุณ เป็นการแบ่งปัน ทางโครงการจะสมทบทุนซื้อของใช้จำเป็นให้ผู้ป่วยในพื้นที่',
        xpCost: 1000,
        icon: '🤝',
        type: 'impact',
        tag: 'Charity'
    },
    {
        id: 'cert_digital',
        name: 'E-Certificate "ผู้พิชิตสุขภาพ"',
        description: 'ใบประกาศนียบัตรดิจิทัลระบุชื่อคุณ สำหรับผู้ที่มีความตั้งใจดูแลสุขภาพยอดเยี่ยม',
        xpCost: 500,
        icon: '📜',
        type: 'digital'
    }
];

const RewardsRedemption: React.FC = () => {
    const { userProfile, setUserProfile, setActiveView, currentUser, redemptionHistory, setRedemptionHistory } = useContext(AppContext);
    const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
    const [redeemSuccess, setRedeemSuccess] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const currentXP = userProfile.xp || 0;

    const handleViewDetail = (reward: RewardItem) => {
        setSelectedReward(reward);
    };

    const confirmRedeem = () => {
        if (!selectedReward || !currentUser) return;

        // Calculate new XP
        const newXP = currentXP - selectedReward.xpCost;
        
        // Prevent negative XP (just in case)
        if (newXP < 0) {
            alert("แต้มสะสมไม่เพียงพอ");
            return;
        }

        // Update Profile
        const updatedProfile = { ...userProfile, xp: newXP };
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });

        // Add to Redemption History
        const newHistoryEntry: RedemptionHistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            rewardId: selectedReward.id,
            rewardName: selectedReward.name,
            cost: selectedReward.xpCost
        };
        setRedemptionHistory(prev => [newHistoryEntry, ...prev]);

        // UI Feedback
        setRedeemSuccess(true);
        setSelectedReward(null);
        setTimeout(() => {
            setRedeemSuccess(false);
            setActiveView('home');
        }, 4000);
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'physical': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300';
            case 'impact': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300';
            case 'digital': return 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300';
            case 'experience': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="w-full space-y-6 animate-fade-in pb-10">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setActiveView('home')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">แลกรางวัลสุขภาพ</h2>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12">
                    <TrophyIcon className="w-24 h-24" />
                </div>
                
                {/* History Button - Added */}
                <button 
                    onClick={() => setShowHistory(true)}
                    className="absolute top-4 right-4 text-[10px] bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors font-bold text-white backdrop-blur-sm z-20"
                >
                    <ClipboardListIcon className="w-3 h-3" />
                    ประวัติแลก
                </button>

                <div className="relative z-10">
                    <p className="text-amber-100 text-xs font-semibold uppercase tracking-widest">แต้มสะสมของคุณ (Your Balance)</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-5xl font-semibold">{currentXP.toLocaleString()}</span>
                        <div className="flex flex-col">
                            <span className="text-lg font-medium text-amber-100">HP</span>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase">Level {userProfile.level}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redeem Success Notification */}
            {redeemSuccess && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300 p-4 rounded-xl flex items-center gap-3 animate-bounce-in">
                    <div className="bg-green-500 text-white rounded-full p-1"><ClipboardCheckIcon className="w-5 h-5" /></div>
                    <div>
                        <p className="font-bold text-sm">แลกรางวัลสำเร็จ!</p>
                        <p className="text-xs">หักคะแนนเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับเพื่อจัดส่งของรางวัล</p>
                    </div>
                </div>
            )}

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 gap-4">
                {REWARDS.map((reward) => {
                    const isAffordable = currentXP >= reward.xpCost;
                    const progress = Math.min(100, (currentXP / reward.xpCost) * 100);
                    
                    return (
                        <div 
                            key={reward.id} 
                            onClick={() => handleViewDetail(reward)}
                            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-5 items-center group transition-all relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {reward.tag && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-wider">
                                    {reward.tag}
                                </div>
                            )}
                            
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-105 transition-transform shrink-0 ${getTypeColor(reward.type)}`}>
                                {reward.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 dark:text-white truncate">{reward.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 mb-3 font-medium leading-relaxed">{reward.description}</p>
                                
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-semibold">
                                        <span className={isAffordable ? 'text-green-600' : 'text-amber-600'}>
                                            {isAffordable ? 'แต้มของคุณเพียงพอแล้ว!' : `ขาดอีก ${(reward.xpCost - currentXP).toLocaleString()} HP`}
                                        </span>
                                        <span className="text-gray-400">{reward.xpCost.toLocaleString()} HP</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${isAffordable ? 'bg-green-500' : 'bg-amber-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Visual chevron to indicate clickability */}
                            <div className="text-gray-300">
                                <i className="fa-solid fa-chevron-right"></i>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reward Detail Modal */}
            {selectedReward && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative animate-bounce-in flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <StarIcon className="w-5 h-5 text-amber-500" />
                                รายละเอียดรางวัล
                            </h3>
                            <button onClick={() => setSelectedReward(null)} className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                <XIcon className="w-4 h-4 text-gray-600 dark:text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-inner ${getTypeColor(selectedReward.type)}`}>
                                {selectedReward.icon}
                            </div>
                            
                            <div className="text-center mb-6">
                                {selectedReward.tag && <span className="inline-block bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">{selectedReward.tag}</span>}
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{selectedReward.name}</h3>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-semibold tracking-wider">{selectedReward.type} Reward</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-6 border border-gray-100 dark:border-gray-700">
                                {selectedReward.description}
                            </div>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">แต้มที่จะถูกหัก</span>
                                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">-{selectedReward.xpCost.toLocaleString()} HP</span>
                            </div>
                        </div>

                        {/* Footer / Action */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {currentXP >= selectedReward.xpCost ? (
                                <button 
                                    onClick={confirmRedeem}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <ClipboardCheckIcon className="w-5 h-5" />
                                    ยืนยันแลกรางวัล
                                </button>
                            ) : (
                                <button 
                                    disabled
                                    className="w-full py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-400 font-bold rounded-xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <XIcon className="w-5 h-5" />
                                    แต้มไม่เพียงพอ
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative animate-slide-up">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <ClipboardListIcon className="w-5 h-5 text-amber-500" />
                                ประวัติการแลกรางวัล
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                <XIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {redemptionHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p>ยังไม่มีประวัติการแลกรางวัล</p>
                                </div>
                            ) : (
                                redemptionHistory.map(entry => (
                                    <div key={entry.id} className="bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-white">{entry.rewardName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-red-500 text-sm">-{entry.cost.toLocaleString()} HP</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsRedemption;
