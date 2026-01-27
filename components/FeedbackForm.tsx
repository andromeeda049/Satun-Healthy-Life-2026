
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ChatBubbleLeftEllipsisIcon, StarIcon, ArrowLeftIcon, ClipboardCheckIcon } from './icons';

const FeedbackForm: React.FC = () => {
    const { saveFeedback, setActiveView } = useContext(AppContext);
    const [category, setCategory] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const categories = [
        "🐛 แจ้งปัญหาทางเทคนิค (Bug Report)",
        "💡 เสนอแนะฟีเจอร์ใหม่ (Feature Request)",
        "🥗 ข้อมูลอาหาร/โภชนาการ (Food Data)",
        "🎨 การใช้งานและหน้าตาแอป (UX/UI)",
        "🔓 ปัญหาบัญชีผู้ใช้ (Account)",
        "⭐ ชื่นชมและให้กำลังใจ (Compliment)",
        "📝 อื่นๆ (Other)"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !message || rating === 0) {
            alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        saveFeedback({ category, message, rating });
        setSubmitted(true);
        setTimeout(() => setActiveView('menu'), 2500);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 animate-fade-in text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <ClipboardCheckIcon className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">ขอบคุณสำหรับข้อเสนอแนะ!</h2>
                <p className="text-gray-500 dark:text-gray-400">เสียงของคุณช่วยให้เราพัฒนาแอปให้ดียิ่งขึ้น</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('menu')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">เสนอแนะ/แจ้งปัญหา</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                {/* Decorative Header */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                        <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">เสียงของคุณสำคัญสำหรับเรา</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ช่วยบอกเราหน่อย ว่าเราจะทำอะไรให้ดีขึ้นได้บ้าง</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">หัวข้อเรื่อง (Category)</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 dark:text-white font-medium"
                            required
                        >
                            <option value="" disabled>-- เลือกหัวข้อ --</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ความพึงพอใจต่อแอป (Rating)</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}
                                >
                                    <StarIcon className="w-8 h-8" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">รายละเอียด (Message)</label>
                        <textarea 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="พิมพ์ข้อเสนอแนะ หรือรายละเอียดปัญหาที่พบ..."
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 dark:text-white h-32 resize-none"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wide"
                    >
                        ส่งข้อมูล (Submit)
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;
