
import React, { useState } from 'react';
import { UserCircleIcon, TargetIcon, ClipboardListIcon, TrophyIcon, ArrowLeftIcon, XIcon, SparklesIcon, BookOpenIcon } from './icons';

interface OnboardingModalProps {
    onClose: () => void;
}

const STEPS = [
    {
        id: 1,
        title: "1. เริ่มต้นรู้จักตัวคุณ",
        desc: "บันทึกน้ำหนัก ส่วนสูง และข้อมูลพื้นฐาน เพื่อให้ระบบประเมินค่า BMI และ TDEE ของคุณได้อย่างแม่นยำ",
        icon: <UserCircleIcon className="w-24 h-24 text-blue-500" />,
        color: "bg-blue-50 dark:bg-blue-900/20",
        accent: "text-blue-600 dark:text-blue-400"
    },
    {
        id: 2,
        title: "2. ตั้งเป้าหมายสุขภาพ",
        desc: "กำหนดเป้าหมายที่คุณต้องการ เช่น ลดน้ำหนัก ควบคุมความดัน หรือลดน้ำตาล เพื่อติดตามความก้าวหน้า",
        icon: <TargetIcon className="w-24 h-24 text-rose-500" />,
        color: "bg-rose-50 dark:bg-rose-900/20",
        accent: "text-rose-600 dark:text-rose-400"
    },
    {
        id: 3,
        title: "3. สร้างแผนสุขภาพ AI",
        desc: "ให้ AI ช่วยออกแบบตารางอาหารและกิจกรรม 7 วัน ที่เหมาะสมกับไลฟ์สไตล์และเป้าหมายของคุณโดยเฉพาะ",
        icon: <div className="relative"><ClipboardListIcon className="w-24 h-24 text-teal-500" /><SparklesIcon className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" /></div>,
        color: "bg-teal-50 dark:bg-teal-900/20",
        accent: "text-teal-600 dark:text-teal-400"
    },
    {
        id: 4,
        title: "4. สนุกกับภารกิจรายวัน",
        desc: "ทำภารกิจสุขภาพให้ครบ สะสมแต้ม (HP) เลื่อนระดับเลเวล และแลกของรางวัลสุดพิเศษ!",
        icon: <TrophyIcon className="w-24 h-24 text-orange-500" />,
        color: "bg-orange-50 dark:bg-orange-900/20",
        accent: "text-orange-600 dark:text-orange-400"
    },
    {
        id: 5,
        title: "5. ประเมินความรอบรู้",
        desc: "ทดสอบและยกระดับความรอบรู้ทางสุขภาพ (Health Literacy) ผ่านแบบทดสอบ เพื่อการดูแลตนเองอย่างถูกต้อง",
        icon: <BookOpenIcon className="w-24 h-24 text-purple-500" />,
        color: "bg-purple-50 dark:bg-purple-900/20",
        accent: "text-purple-600 dark:text-purple-400"
    }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const stepData = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative animate-bounce-in flex flex-col min-h-[500px]">
                
                {/* Skip Button */}
                <div className="absolute top-4 right-4 z-20">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        ข้าม <XIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Area */}
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-500 ${stepData.color}`}>
                    <div className="mb-6 transform transition-transform duration-500 hover:scale-110 drop-shadow-xl">
                        {stepData.icon}
                    </div>
                    <h2 className={`text-2xl font-black mb-3 ${stepData.accent}`}>
                        {stepData.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium">
                        {stepData.desc}
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-white dark:bg-gray-800">
                    {/* Pagination Dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {STEPS.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    idx === currentStep 
                                    ? `w-8 ${stepData.accent.replace('text-', 'bg-')}` 
                                    : 'w-2 bg-gray-200 dark:bg-gray-700'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {currentStep > 0 ? (
                            <button 
                                onClick={handleBack}
                                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                        ) : <div className="w-[52px]"></div> /* Spacer to keep alignment */}
                        
                        <button 
                            onClick={handleNext}
                            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                                currentStep === STEPS.length - 1 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                            }`}
                        >
                            {currentStep === STEPS.length - 1 ? 'เริ่มต้นใช้งานทันที! 🚀' : 'ถัดไป'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
