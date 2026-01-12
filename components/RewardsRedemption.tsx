
import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeftIcon, StarIcon, TrophyIcon, ClipboardCheckIcon, XIcon, MedalIcon, HeartIcon } from './icons';

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
    const { userProfile, setUserProfile, setActiveView, currentUser } = useContext(AppContext);
    const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
    const [redeemSuccess, setRedeemSuccess] = useState(false);

    const currentXP = userProfile.xp || 0;

    const handleRedeem = (reward: RewardItem) => {
        if (currentXP < reward.xpCost) return;
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
        
        // Save to Context & Backend
        setUserProfile(updatedProfile, { 
            displayName: currentUser.displayName, 
            profilePicture: currentUser.profilePicture 
        });

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
                        <div key={reward.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-5 items-center group transition-all relative overflow-hidden">
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
                            <button 
                                onClick={() => handleRedeem(reward)}
                                disabled={!isAffordable}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase transition-all shrink-0 ${
                                    isAffordable 
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                แลก
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Redeem Modal */}
            {selectedReward && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative animate-bounce-in border-4 border-white dark:border-gray-700">
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-inner">
                                {selectedReward.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการแลก?</h3>
                            <p className="text-gray-600 dark:text-gray-300 font-bold text-lg mt-2">{selectedReward.name}</p>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl mt-4 border border-amber-100 dark:border-amber-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">แต้มที่จะถูกหัก</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">-{selectedReward.xpCost.toLocaleString()} HP</p>
                            </div>
                            
                            <div className="mt-8 flex flex-col gap-3">
                                <button 
                                    onClick={confirmRedeem}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 uppercase tracking-wider"
                                >
                                    ยืนยัน (Redeem)
                                </button>
                                <button 
                                    onClick={() => setSelectedReward(null)}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-2xl transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsRedemption;
