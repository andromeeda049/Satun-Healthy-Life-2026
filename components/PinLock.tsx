
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { LockIcon } from './icons';

interface PinLockProps {
    onUnlock: () => void;
    isSetupMode?: boolean;
    onCancelSetup?: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock, isSetupMode = false, onCancelSetup }) => {
    const { userPin, setPin, verifyPin, currentUser } = useContext(AppContext);
    const [input, setInput] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const [step, setStep] = useState<'enter' | 'create' | 'confirm'>('enter');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (isSetupMode) {
            setStep('create');
        } else {
            setStep('enter');
        }
    }, [isSetupMode]);

    const handlePress = (num: number) => {
        if (shake) return;
        const nextInput = input + num;
        if (nextInput.length <= 4) {
            setInput(nextInput);
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError('');
    };

    // Auto-check when input length is 4
    useEffect(() => {
        if (input.length === 4) {
            if (step === 'enter') {
                if (verifyPin(input)) {
                    onUnlock();
                } else {
                    triggerError('รหัสผ่านไม่ถูกต้อง');
                }
            } else if (step === 'create') {
                setConfirmInput(input);
                setInput('');
                setStep('confirm');
            } else if (step === 'confirm') {
                if (input === confirmInput) {
                    setPin(input);
                    onUnlock(); // Finish setup
                } else {
                    triggerError('รหัสไม่ตรงกัน กรุณาตั้งใหม่');
                    setStep('create');
                    setConfirmInput('');
                }
            }
        }
    }, [input, step, confirmInput, verifyPin, setPin, onUnlock]);

    const triggerError = (msg: string) => {
        setError(msg);
        setShake(true);
        setTimeout(() => {
            setShake(false);
            setInput('');
        }, 400);
    };

    const renderDots = () => (
        <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                        i < input.length 
                        ? 'bg-white border-white scale-110' 
                        : 'border-white/50 bg-transparent'
                    }`} 
                />
            ))}
        </div>
    );

    const title = step === 'enter' ? 'กรุณาใส่รหัสผ่าน' : step === 'create' ? 'ตั้งรหัสผ่านใหม่ 4 หลัก' : 'ยืนยันรหัสผ่านอีกครั้ง';

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6 text-white backdrop-blur-xl animate-fade-in select-none touch-none overflow-hidden overscroll-none">
            
            {/* Header */}
            <div className={`flex flex-col items-center mb-8 transition-transform ${shake ? 'translate-x-[-5px] animate-shake' : ''}`}>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm shadow-xl border border-white/10">
                    <LockIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-wide">{title}</h2>
                {error && <p className="text-red-400 text-sm mt-2 font-medium animate-pulse">{error}</p>}
                {!error && isSetupMode && <p className="text-white/50 text-xs mt-2">เพื่อความปลอดภัยของข้อมูลสุขภาพ</p>}
                {!error && !isSetupMode && currentUser && (
                    <p className="text-white/50 text-xs mt-2">สวัสดี, {currentUser.displayName}</p>
                )}
            </div>

            {/* Dots */}
            {renderDots()}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handlePress(num)}
                        className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/20 active:bg-white/40 transition-all flex items-center justify-center text-3xl font-light backdrop-blur-md border border-white/10 shadow-lg active:scale-90"
                    >
                        {num}
                    </button>
                ))}
                
                {/* Bottom Row */}
                <div className="flex items-center justify-center">
                    {isSetupMode && (
                        <button onClick={onCancelSetup} className="text-sm text-gray-400 hover:text-white font-bold">
                            ยกเลิก
                        </button>
                    )}
                </div>
                <button
                    onClick={() => handlePress(0)}
                    className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/20 active:bg-white/40 transition-all flex items-center justify-center text-3xl font-light backdrop-blur-md border border-white/10 shadow-lg active:scale-90"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-20 h-20 flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-transform"
                >
                    <i className="fa-solid fa-delete-left text-2xl"></i>
                </button>
            </div>

            {/* Forgot PIN (Only in enter mode) */}
            {!isSetupMode && (
                <button 
                    onClick={() => {
                        if(window.confirm('หากลืมรหัสผ่าน ท่านต้องทำการ "ออกจากระบบ" และเข้าใหม่เพื่อรีเซ็ต PIN\n\nต้องการออกจากระบบหรือไม่?')) {
                            localStorage.removeItem('user_pin');
                            window.location.reload(); 
                        }
                    }} 
                    className="mt-12 text-xs text-white/30 hover:text-white/80 transition-colors"
                >
                    ลืมรหัสผ่าน?
                </button>
            )}
        </div>
    );
};

export default PinLock;
