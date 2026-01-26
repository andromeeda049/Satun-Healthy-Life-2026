import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, AllAdminData } from '../services/googleSheetService';
import { UserGroupIcon, UserCircleIcon, ChartBarIcon, SearchIcon, TrophyIcon, ArrowLeftIcon, ClipboardListIcon } from './icons';

const AdminDashboard: React.FC = () => {
    const { scriptUrl, currentUser, setActiveView } = useContext(AppContext);
    const [data, setData] = useState<AllAdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (currentUser?.adminSecret && scriptUrl) {
                setLoading(true);
                try {
                    const result = await fetchAllAdminDataFromSheet(scriptUrl, currentUser.adminSecret);
                    if (result) {
                        setData(result);
                    } else {
                        setError("ไม่สามารถดึงข้อมูลได้ (Unauthorized or Network Error)");
                    }
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setLoading(false);
                }
            } else {
                setError("No Admin Access");
                setLoading(false);
            }
        };
        loadData();
    }, [currentUser, scriptUrl]);

    const outcomes = useMemo(() => {
        if (!data) return null;
        
        const totalUsers = data.users?.length || 0;
        const totalGroups = data.groups?.length || 0;
        const bmiStats = data.stats?.bmiStats || { improvedCount: 0, maintainedCount: 0, total: totalUsers };
        
        return {
            totalUsers,
            totalGroups,
            bmiStats
        };
    }, [data]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 text-3xl">⚠️</div>
            <p className="text-xl font-bold text-gray-800 dark:text-white">Error: {error}</p>
            <button onClick={() => window.location.reload()} className="mt-6 bg-gray-200 dark:bg-gray-700 px-6 py-3 rounded-xl font-bold">Reload</button>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveView('menu')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-100 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ChartBarIcon className="w-8 h-8 text-indigo-600" />
                        Admin Dashboard
                    </h1>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase">Total Users</p>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">{outcomes?.totalUsers.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl text-teal-600">
                            <ClipboardListIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase">Active Groups</p>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">{outcomes?.totalGroups.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600">
                            <TrophyIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase">BMI Improved</p>
                            <p className="text-2xl font-black text-gray-800 dark:text-white">{outcomes?.bmiStats.improvedCount || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Outcomes Section */}
            {outcomes && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Health Outcomes Overview</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 text-center flex flex-col justify-center">
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{outcomes.bmiStats.improvedCount}</p>
                                    <p className="text-xs text-gray-500">คน ที่ลดระดับความอ้วนได้</p>
                                    <div className="h-[1px] bg-orange-200 w-full my-2"></div>
                                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{outcomes.bmiStats.maintainedCount}</p>
                                    <p className="text-xs text-gray-500">คน ที่รักษารูปร่างสมส่วนไว้ได้</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 italic mt-2">
                                * Success Rate คำนวณจากผู้ที่ลดระดับ BMI ลงมาสู่เกณฑ์ที่ดีขึ้น (เช่น อ้วน &rarr; ท้วม) หรือผู้ที่รักษาระดับสมส่วนไว้ได้
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                            <p className="text-gray-400 text-sm">System Statistics Visualization (Coming Soon)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Management */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">User Management</h3>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search user..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Organization</th>
                                <th className="px-4 py-3 text-right">XP</th>
                                <th className="px-4 py-3 text-center">Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {data?.users
                                .filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.includes(searchTerm))
                                .slice(0, 10)
                                .map((user, idx) => (
                                <tr key={idx} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                            {user.profilePicture ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover"/> : <UserCircleIcon className="w-full h-full p-1 text-gray-400"/>}
                                        </div>
                                        <div>
                                            <div className="font-bold">{user.displayName}</div>
                                            <div className="text-[10px] text-gray-500">{user.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{user.organization || '-'}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{user.xp?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">Lvl {user.level || 1}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;