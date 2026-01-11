
import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { HEALTH_LITERACY_QUESTIONS, WEEKLY_QUIZ_QUESTIONS, DAILY_QUIZ_QUESTIONS, XP_VALUES, getWeekNumber } from '../constants';
import { BookOpenIcon, StarIcon, TrophyIcon, ClipboardCheckIcon } from './icons';

const HealthLiteracyQuiz: React.FC = () => {
    const { saveQuizResult, gainXP, setActiveView, currentUser, quizHistory, activeView } = useContext(AppContext);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const isWeeklyMode = activeView === 'weeklyQuiz';
    const isDailyMode = activeView === 'dailyQuiz';
    const weekNum = getWeekNumber(new Date());
    const today = new Date().toDateString();

    const questions = useMemo(() => {
        if (isWeeklyMode) {
            // Select 3 random but consistent questions for the week based on weekNum
            const qCount = WEEKLY_QUIZ_QUESTIONS.length;
            const seed = weekNum;
            const selected = [];
            for (let i = 0; i < 3; i++) {
                const idx = (seed * 3 + i) % qCount;
                selected.push(WEEKLY_QUIZ_QUESTIONS[idx]);
            }
            return selected;
        }
        if (isDailyMode) {
            // Select 1 question for the day based on date
            const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
            const index = dayOfYear % DAILY_QUIZ_QUESTIONS.length;
            return [DAILY_QUIZ_QUESTIONS[index]];
        }
        return HEALTH_LITERACY_QUESTIONS;
    }, [isWeeklyMode, isDailyMode, weekNum]);

    if (!currentUser || currentUser.role === 'guest') {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">กรุณาเข้าสู่ระบบ</h2>
                <p className="text-gray-600 dark:text-gray-300">ฟีเจอร์นี้สำหรับผู้ใช้ที่ลงทะเบียนเพื่อติดตามผลการเรียนรู้</p>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isPreTest = quizHistory.length === 0;

    // Check if already done
    if (isWeeklyMode) {
        const doneThisWeek = quizHistory.some(q => q.type === 'weekly' && q.weekNumber === weekNum);
        if (doneThisWeek && !isFinished) {
             return (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardCheckIcon className="w-8 h-8 text-green-600" /></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ทำครบแล้ว!</h2>
                    <p className="text-gray-600 dark:text-gray-300">คุณทำควิซประจำสัปดาห์นี้ไปแล้ว กลับมาใหม่สัปดาห์หน้าครับ</p>
                    <button onClick={() => setActiveView('home')} className="mt-6 w-full bg-gray-200 dark:bg-gray-700 font-bold py-3 rounded-xl">กลับหน้าหลัก</button>
                </div>
            );
        }
    }

    if (isDailyMode) {
        const doneToday = quizHistory.some(q => q.type === 'daily' && new Date(q.date).toDateString() === today);
        if (doneToday && !isFinished) {
             return (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardCheckIcon className="w-8 h-8 text-green-600" /></div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">ทำครบแล้ว!</h2>
                    <p className="text-gray-600 dark:text-gray-300">คุณทำควิซประจำวันนี้ไปแล้ว พรุ่งนี้มาสนุกกันใหม่นะครับ</p>
                    <button onClick={() => setActiveView('home')} className="mt-6 w-full bg-gray-200 dark:bg-gray-700 font-bold py-3 rounded-xl">กลับหน้าหลัก</button>
                </div>
            );
        }
    }

    const handleAnswer = (index: number) => {
        setSelectedOption(index);
        setShowExplanation(true);
        if (index === currentQuestion.correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        setSelectedOption(null);
        setShowExplanation(false);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        const totalCorrect = selectedOption === currentQuestion.correctIndex ? score + 1 : score;
        const finalPercent = Math.round((totalCorrect / questions.length) * 100);
        
        if (isWeeklyMode) {
            saveQuizResult(finalPercent, questions.length, totalCorrect, 'weekly', weekNum);
            gainXP(XP_VALUES.WEEKLY_QUIZ, 'WEEKLY_QUIZ');
        } else if (isDailyMode) {
            saveQuizResult(finalPercent, questions.length, totalCorrect, 'daily');
            gainXP(XP_VALUES.DAILY_QUIZ, 'DAILY_QUIZ');
        } else {
            saveQuizResult(finalPercent, questions.length, totalCorrect, isPreTest ? 'pre-test' : 'post-test');
            gainXP(XP_VALUES.QUIZ, 'QUIZ');
        }
        setIsFinished(true);
    };

    if (isFinished) {
        const totalCorrect = selectedOption === currentQuestion.correctIndex ? score + 1 : score;
        let earnedXP = isWeeklyMode ? XP_VALUES.WEEKLY_QUIZ : isDailyMode ? XP_VALUES.DAILY_QUIZ : XP_VALUES.QUIZ;
        
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center animate-fade-in w-full max-w-2xl mx-auto">
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-400">
                        {totalCorrect === questions.length ? <TrophyIcon className="w-12 h-12 text-yellow-500" /> : <StarIcon className="w-12 h-12 text-yellow-500" />}
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    {isWeeklyMode ? 'ภารกิจรายสัปดาห์สำเร็จ!' : isDailyMode ? 'ภารกิจรายวันสำเร็จ!' : 'บันทึกผลเรียบร้อย!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {isWeeklyMode ? `คุณทำควิซประจำสัปดาห์ที่ ${weekNum} เสร็จสิ้น` : `คุณทำแบบทดสอบเสร็จสิ้น`}
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl mb-8">
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">คะแนนความรอบรู้ทางสุขภาพ</p>
                    <div className="text-5xl font-bold text-teal-600 dark:text-teal-400 my-2">
                        {Math.round((totalCorrect / questions.length) * 100)}%
                    </div>
                    <p className="text-sm text-gray-500">ตอบถูก {totalCorrect} จาก {questions.length} ข้อ</p>
                    <p className="mt-2 text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">+ {earnedXP} HP REWARDED! 🏆</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => setActiveView('home')} className="w-full bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors shadow-md">
                        กลับหน้าหลัก
                    </button>
                    <button onClick={() => setActiveView('dashboard')} className="w-full bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-colors shadow-md">
                        ดูผลลัพธ์ใน Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isWeeklyMode ? 'bg-rose-100 text-rose-600' : isDailyMode ? 'bg-cyan-100 text-cyan-600' : 'bg-teal-100 text-teal-600'}`}>
                            <BookOpenIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {isWeeklyMode ? 'Weekly Health Quiz' : isDailyMode ? 'Daily Health Quiz' : 'แบบทดสอบความรอบรู้ (HL Quiz)'}
                            </h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                {isWeeklyMode ? `ภารกิจสัปดาห์ที่ ${weekNum}` : isDailyMode ? 'ภารกิจประจำวัน' : isPreTest ? 'Pre-test (ก่อนการใช้งาน)' : 'Post-test (ติดตามผล)'}
                            </p>
                        </div>
                    </div>
                    {questions.length > 1 && (
                        <div className="text-sm font-semibold text-gray-500">
                            ข้อที่ {currentQuestionIndex + 1} / {questions.length}
                        </div>
                    )}
                </div>

                {/* Progress Bar (Only for multi-question quiz) */}
                {questions.length > 1 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-6">
                        <div 
                            className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                )}

                {/* Question */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl mb-6 border border-gray-100 dark:border-gray-600 shadow-inner">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white leading-relaxed text-center">
                        {currentQuestion.question}
                    </h3>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                        let buttonClass = "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 font-bold ";
                        
                        if (showExplanation) {
                            if (index === currentQuestion.correctIndex) {
                                buttonClass += "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 ";
                            } else if (index === selectedOption) {
                                buttonClass += "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 ";
                            } else {
                                buttonClass += "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 ";
                            }
                        } else {
                            buttonClass += "bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:border-indigo-400 active:scale-[0.98] ";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => !showExplanation && handleAnswer(index)}
                                disabled={showExplanation}
                                className={buttonClass}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option}</span>
                                    {showExplanation && index === currentQuestion.correctIndex && <StarIcon className="w-5 h-5 text-green-500" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <div className="mt-8 p-5 bg-blue-50 dark:bg-indigo-900/20 rounded-2xl border-l-8 border-indigo-500 animate-fade-in-down shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><StarIcon className="w-4 h-4 text-indigo-500" /></div>
                             <h4 className="font-black text-indigo-700 dark:text-indigo-300 uppercase text-xs tracking-widest">ข้อมูลเพิ่มเติม</h4>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium leading-relaxed">{currentQuestion.explanation}</p>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleNext}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black py-3 px-10 rounded-xl hover:shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
                            >
                                {currentQuestionIndex < questions.length - 1 ? 'ข้อถัดไป' : 'เสร็จสิ้นภารกิจ'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {isWeeklyMode && (
                <div className="text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                        สัปดาห์ที่ {weekNum} ประจำวันที่ {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            )}
        </div>
    );
};

export default HealthLiteracyQuiz;
