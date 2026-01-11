
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { User } from '../types';
import { LineIcon, LockIcon, ArrowLeftIcon, ExclamationTriangleIcon } from './icons';
import { socialAuth } from '../services/googleSheetService';
import liff from '@line/liff';
import { APP_LOGO_URL, ADMIN_CREDENTIALS } from '../constants';

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
                            
                            // FIX: Handle Backend Response Format { status: 'success', data: ... }
                            if (res.status === 'success' && res.data) {
                                onLogin({ ...res.data, authProvider: 'line' });
                            } else if (res.success && res.user) { 
                                // Fallback for legacy format
                                onLogin({ ...res.user, authProvider: 'line' }); 
                            } else { 
                                setError(`Login Error: ${res.message || 'Unknown response'}`); 
                                setLoading(false); 
                            }
                        } catch (fetchErr: any) { 
                            setError(`Network Error: ${fetchErr.message}`); 
                            setLoading(false); 
                        }
                    } else { setError('ไม่พบ URL ของ Google Script'); setLoading(false); }
                }
            } catch (err: any) { setIsLineReady(true); }
        };
        initLine();
    }, [scriptUrl, onLogin]);

    const handleLineLogin = () => {
        if (!isLineReady) { setError('LINE ยังไม่พร้อมใช้งาน'); return; }
        if (!liff.isLoggedIn()) { liff.login(); }
        else { window.location.reload(); }
    };

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setStatusText('กำลังตรวจสอบสิทธิ์...');
        setTimeout(() => {
            const targetOrgId = ADMIN_CREDENTIALS[password];
            if (targetOrgId) {
                // Try to find name in organizations context, if not found (e.g. initial load), default to Admin
                const orgName = (organizations || []).find(o => o.id === targetOrgId)?.name || 'Admin';
                onLogin({ username: `admin_${targetOrgId}`, displayName: `Admin: ${orgName}`, profilePicture: '🛡️', role: 'admin', organization: targetOrgId, authProvider: 'email' });
            } else { setError('รหัสผ่านไม่ถูกต้อง'); setLoading(false); }
        }, 800);
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
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-bounce-in">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            <p className="text-xs font-semibold">{error}</p>
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
                        <button type="submit" className="w-full py-4 bg-teal-600 text-white font-semibold rounded-2xl shadow-lg active:scale-[0.98] transition-all">ยืนยันสิทธิ์เข้าใช้งาน</button>
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
