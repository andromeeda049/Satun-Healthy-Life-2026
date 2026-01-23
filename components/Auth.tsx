
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, LockIcon, ArrowLeftIcon, ExclamationTriangleIcon } from './icons';
import { socialAuth, adminLogin } from '../services/googleSheetService';
import liff from '@line/liff';
import { APP_LOGO_URL } from '../constants';

const LINE_LIFF_ID = "2008705690-V5wrjpTX";

const UserAuth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const { scriptUrl, organizations } = useContext(AppContext);
    const [view, setView] = useState<'main' | 'admin'>('main');
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');
    const [isLineReady, setIsLineReady] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        const initLine = async () => {
            try {
                if (!liff.id) { await liff.init({ liffId: LINE_LIFF_ID }); }
                setIsLineReady(true);

                // Check if the user has just logged out
                // If yes, we force a LIFF logout to clear tokens and prevent auto-login
                const isLoggedOut = sessionStorage.getItem('isLoggedOut');
                if (isLoggedOut === 'true') {
                    if (liff.isLoggedIn()) {
                        liff.logout();
                    }
                    sessionStorage.removeItem('isLoggedOut');
                    setLoading(false);
                    return; // Stop here, do not auto-login
                }

                if (liff.isLoggedIn()) {
                    setLoading(true);
                    setStatusText('กำลังยืนยันตัวตน...');
                    const profile = await liff.getProfile();
                    const userEmail = liff.getDecodedIDToken()?.email || `${profile.userId}@line.me`;
                    if (scriptUrl) {
                        try {
                            const res = await socialAuth(scriptUrl, {
                                email: userEmail,
                                name: profile.displayName,
                                picture: profile.pictureUrl || '',
                                provider: 'line',
                                userId: profile.userId
                            });
                            
                            // FIX: Handle nested user object from Google Script response
                            // Structure: { status: 'success', data: { success: true, user: { ... } } }
                            if (res.status === 'success') {
                                const userData = res.data?.user || res.data; // Try nested 'user' first, then direct data
                                
                                if (userData && userData.username) {
                                    onLogin({ 
                                        ...userData, 
                                        displayName: profile.displayName || userData.displayName,
                                        profilePicture: profile.pictureUrl || userData.profilePicture,
                                        authProvider: 'line' 
                                    });
                                } else {
                                    console.error("Invalid User Data Structure:", res);
                                    setError(`Login Error: โครงสร้างข้อมูลผู้ใช้ไม่ถูกต้อง`); 
                                    setLoading(false);
                                }
                            } else { 
                                console.error("Login Response Error:", res);
                                setError(`Login Error: ข้อมูลผู้ใช้ไม่สมบูรณ์จากระบบ (${res.message || 'Unknown'})`); 
                                setLoading(false); 
                            }
                        } catch (fetchErr: any) { 
                            setError(`Network Error: ${fetchErr.message}`); 
                            setLoading(false); 
                        }
                    } else { setError('ไม่พบ URL ของ Google Script'); setLoading(false); }
                }
            } catch (err: any) { 
                console.error(err);
                setIsLineReady(true); 
                // If LIFF init fails, we might still allow admin login
            }
        };
        initLine();
    }, [scriptUrl, onLogin]);

    const handleLineLogin = () => {
        if (!isLineReady) { setError('LINE ยังไม่พร้อมใช้งาน'); return; }
        if (!liff.isLoggedIn()) { 
            liff.login(); 
        } else { 
            // FIX: If already logged in but stuck (e.g. error), force logout to reset session
            if (window.confirm("คุณต้องการรีเซ็ตการเข้าสู่ระบบหรือไม่?")) {
                liff.logout();
                window.location.reload(); 
            }
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setStatusText('กำลังตรวจสอบสิทธิ์กับ Server...');
        
        try {
            if (!scriptUrl) throw new Error("ไม่พบ URL ของระบบ");
            
            const res = await adminLogin(scriptUrl, password);
            
            if (res.status === 'success' && res.data) {
                const adminUser = res.data;
                // Store password temporarily in user session for data fetching
                onLogin({ 
                    ...adminUser, 
                    authProvider: 'email',
                    adminSecret: password 
                });
            } else {
                setError(res.message || 'รหัสผ่านไม่ถูกต้อง');
            }
        } catch (err: any) {
            console.error(err);
            setError('การเชื่อมต่อล้มเหลว: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-12 flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-500 text-sm font-medium animate-pulse">{statusText}</p></div>;

    return (
        <div className="animate-fade-in w-full space-y-4">
            {view === 'main' ? (
                <div className="space-y-6">
                    <div className="text-center space-y-4">
                        <img src={APP_LOGO_URL} alt="Logo" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
                        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Satun Healthy Life</h1>
                        <p className="text-sm text-gray-500 font-medium">นวัตกรรมดูแลสุขภาพวิถีใหม่เพื่อชาวสตูล</p>
                    </div>
                    
                    <div className="space-y-3">
                        <button onClick={handleLineLogin} disabled={!isLineReady} className="w-full py-4 rounded-2xl font-semibold text-white bg-[#06C755] hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-100 dark:shadow-none">
                            <LineIcon className="w-6 h-6" />
                            <span>เข้าใช้งานด้วย LINE</span>
                        </button>
                        
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-400 font-medium">สำหรับเจ้าหน้าที่</span></div>
                        </div>

                        <button onClick={() => setView('admin')} className="w-full py-4 rounded-2xl font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                            <LockIcon className="w-5 h-5" />
                            <span>ระบบจัดการ (Admin/Research)</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex flex-col gap-2 text-red-600 dark:text-red-400 animate-bounce-in">
                            <div className="flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                <p className="text-xs font-semibold">{error}</p>
                            </div>
                            {liff.isLoggedIn() && (
                                <button onClick={() => { liff.logout(); window.location.reload(); }} className="text-[10px] underline hover:text-red-800 dark:hover:text-red-300 self-end">
                                    ออกจากระบบแล้วลองใหม่
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('main')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><ArrowLeftIcon className="w-5 h-5 text-gray-600" /></button>
                        <h2 className="text-xl font-semibold dark:text-white">เจ้าหน้าที่ (Admin)</h2>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Admin Access Token</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-semibold focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Enter password..." required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50">
                            {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันสิทธิ์เข้าใช้งาน'}
                        </button>
                    </form>
                    {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}
                </div>
            )}
        </div>
    );
};

const Auth: React.FC = () => {
    const { login } = useContext(AppContext);
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-6">
            <div className="w-full max-w-sm">
                <UserAuth onLogin={login} />
            </div>
        </div>
    );
};

export default Auth;
