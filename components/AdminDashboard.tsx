
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, AllAdminData, createGroup, getAdminGroups, fetchGroupMembers, fetchUserDataByAdmin } from '../services/googleSheetService';
import { ChartBarIcon, UserGroupIcon, FireIcon, ClipboardCheckIcon, UserCircleIcon, PrinterIcon, BeakerIcon, WaterDropIcon, BoltIcon, HeartIcon, LineIcon, ArrowLeftIcon, XIcon, ScaleIcon, StarIcon, TrophyIcon, BookOpenIcon, SquaresIcon, CameraIcon } from './icons';
import { SATISFACTION_QUESTIONS, OUTCOME_QUESTIONS } from '../constants';

const ADMIN_KEY = "ADMIN1234!"; 

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-t-red-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <p className="text-red-600 dark:text-red-400 font-medium">กำลังดึงข้อมูลวิจัยเชิงลึก...</p>
    </div>
);

// ... (UserDetailModal, GroupDetailView, convertToCSV, DataTable, GroupManagementTab components remain the same - omitting for brevity but will be included in full structure if I wasn't doing partial updates. Since I'm replacing the file, I must include them) ...

const UserDetailModal: React.FC<{ userData: any, onClose: () => void }> = ({ userData, onClose }) => {
    if(!userData) return null;
    
    // Calculate simple stats from history
    const bmi = userData.bmiHistory.length > 0 ? userData.bmiHistory[0].value.toFixed(1) : '-';
    const tdee = userData.tdeeHistory.length > 0 ? Math.round(userData.tdeeHistory[0].value) : '-';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-bounce-in max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-600" /></button>
                
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-4">
                        {userData.profile?.profilePicture ? (
                            <img src={userData.profile.profilePicture} className="w-16 h-16 rounded-full border-2 border-white" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">👤</div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold">{userData.profile?.displayName || 'Unknown User'}</h2>
                            <p className="text-sm opacity-90">ID: {userData.profile?.username}</p>
                            <div className="flex gap-2 mt-1 text-xs font-bold">
                                <span className="bg-white/20 px-2 py-0.5 rounded">Level {userData.profile?.level}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded">{userData.profile?.xp} HP</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                            <ScaleIcon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">BMI</p>
                            <p className="font-bold text-lg dark:text-white">{bmi}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                            <FireIcon className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">TDEE</p>
                            <p className="font-bold text-lg dark:text-white">{tdee}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                            <BoltIcon className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Activity</p>
                            <p className="font-bold text-lg dark:text-white">{userData.activityHistory.length} ครั้ง</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                            <HeartIcon className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Condition</p>
                            <p className="font-bold text-xs dark:text-white truncate">{userData.profile?.healthCondition || '-'}</p>
                        </div>
                    </div>

                    {/* Detailed Lists */}
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 border-b pb-1">ประวัติการบันทึกล่าสุด</h3>
                        <div className="space-y-2 text-sm">
                            {userData.foodHistory.slice(0,3).map((f: any, i: number) => (
                                <div key={i} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span>🍽️ {f.analysis.description}</span>
                                    <span className="text-gray-500">{new Date(f.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {userData.activityHistory.slice(0,3).map((a: any, i: number) => (
                                <div key={i} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span>🏃 {a.name}</span>
                                    <span className="text-gray-500">{new Date(a.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                        {userData.foodHistory.length === 0 && userData.activityHistory.length === 0 && (
                            <p className="text-center text-gray-400 text-sm">ยังไม่มีประวัติกิจกรรม</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const GroupDetailView: React.FC<{ group: any, onBack: () => void }> = ({ group, onBack }) => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loadingUser, setLoadingUser] = useState(false);

    useEffect(() => {
        const loadMembers = async () => {
            if(!scriptUrl || !currentUser) return;
            const data = await fetchGroupMembers(scriptUrl, currentUser, group.id);
            setMembers(data);
            setLoading(false);
        };
        loadMembers();
    }, [group.id]);

    const handleViewUser = async (username: string) => {
        setLoadingUser(true);
        const data = await fetchUserDataByAdmin(scriptUrl, currentUser!, username);
        if(data) {
            setSelectedUser(data);
        } else {
            alert('ไม่สามารถดึงข้อมูลได้');
        }
        setLoadingUser(false);
    };

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold mb-4">
                <ArrowLeftIcon className="w-5 h-5" /> กลับไปหน้ารวมกลุ่ม
            </button>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md border-l-4 border-teal-500 relative overflow-hidden">
                <div className="relative z-10 flex items-start gap-4">
                    {group.image && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                            <img src={group.image} alt="Group" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{group.name}</h2>
                        <p className="text-gray-500 dark:text-gray-300">Code: {group.code} | สมาชิก: {members.length} คน</p>
                        {group.lineLink && <a href={group.lineLink} target="_blank" className="text-sm text-green-600 font-bold flex items-center gap-1 mt-2"><LineIcon className="w-4 h-4"/> Line Group</a>}
                    </div>
                </div>
            </div>

            {loading ? (
                <Spinner />
            ) : (
                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">สมาชิก</th>
                                <th className="px-6 py-3">ระดับ</th>
                                <th className="px-6 py-3">XP</th>
                                <th className="px-6 py-3">สุขภาพ</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                            {members.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        {m.profilePicture ? <img src={m.profilePicture} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">👤</div>}
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{m.displayName}</p>
                                            <p className="text-xs text-gray-400">{m.username}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">Level {m.level}</td>
                                    <td className="px-6 py-4 font-bold text-teal-600">{m.xp.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-xs">{m.healthCondition}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleViewUser(m.username)}
                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100"
                                        >
                                            ดูรายงาน
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีสมาชิกในกลุ่ม</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {loadingUser && <div className="fixed inset-0 bg-black/50 z-[190] flex items-center justify-center"><Spinner /></div>}
            {selectedUser && <UserDetailModal userData={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    );
};

const convertToCSV = (objArray: any[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let headers = Object.keys(array[0] || {}).join(',') + '\r\n';
    str += headers;
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line !== '') line += ',';
            let val = array[i][index];
            if (typeof val === 'string') {
                val = val.replace(/"/g, '""'); 
                line += `"${val}"`;
            } else if (typeof val === 'object') {
                 line += `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            } else {
                line += val;
            }
        }
        str += line + '\r\n';
    }
    return str;
};

const DataTable: React.FC<{ data: any[], title: string, allowExport?: boolean }> = ({ data, title, allowExport }) => {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">ไม่มีข้อมูลในส่วน {title}</p>;
    }

    const headers = Object.keys(data[0]);

    const handleExport = () => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${title}_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCellContent = (header: string, value: any) => {
        if (header === 'profilePicture') {
            if (String(value).startsWith('data:image/')) {
                return <img src={String(value)} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />;
            }
            return <span className="text-2xl">{String(value)}</span>;
        }
        if (header === 'timestamp' || header === 'lastSeen' || header === 'date') {
            const date = new Date(value);
             if (!isNaN(date.getTime())) {
                return date.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
        }
        if (typeof value === 'object' && value !== null) return JSON.stringify(value).substring(0, 30) + '...';
        const stringValue = String(value);
        return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
    };

    return (
        <div>
            {allowExport && (
                <div className="flex justify-end mb-2">
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-md transition-colors"><PrinterIcon className="w-4 h-4" /> Export CSV (สำหรับงานวิจัย)</button>
                </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>{headers.map(header => (<th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">{header}</th>))}</tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                {headers.map(header => (<td key={`${header}-${index}`} className="px-6 py-4 align-middle whitespace-nowrap">{renderCellContent(header, row[header])}</td>))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GroupManagementTab: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [groups, setGroups] = useState<any[]>([]);
    const [newGroup, setNewGroup] = useState({ name: '', code: '', description: '', lineLink: '', image: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadGroups(); }, []);

    const loadGroups = async () => {
        if(!currentUser) return;
        const res = await getAdminGroups(scriptUrl, currentUser);
        setGroups(res);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewGroup({ ...newGroup, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const res = await createGroup(scriptUrl, currentUser!, newGroup);
            if(res.status === 'success') {
                alert('สร้างกลุ่มสำเร็จ!');
                setNewGroup({ name: '', code: '', description: '', lineLink: '', image: '' });
                loadGroups();
            } else { setError(res.message || 'สร้างกลุ่มไม่สำเร็จ'); }
        } catch(e: any) { setError(e.message); } finally { setLoading(false); }
    };

    if (selectedGroup) return <GroupDetailView group={selectedGroup} onBack={() => setSelectedGroup(null)} />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md border-l-4 border-teal-500">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><UserGroupIcon className="w-6 h-6 text-teal-600" /> สร้างกลุ่มสุขภาพใหม่ (Create Group)</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="flex flex-col items-center mb-4">
                        <div 
                            onClick={() => imageInputRef.current?.click()}
                            className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-500 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 overflow-hidden"
                        >
                            {newGroup.image ? (
                                <img src={newGroup.image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <CameraIcon className="w-8 h-8 text-gray-400" />
                                    <span className="text-[10px] text-gray-400 mt-1">รูปกลุ่ม</span>
                                </>
                            )}
                        </div>
                        <input type="file" ref={imageInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อกลุ่ม *</label><input type="text" required value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600" placeholder="เช่น คลินิกเบาหวาน รุ่น 1" /></div>
                        <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสเข้ากลุ่ม (Access Code) *</label><input type="text" required value={newGroup.code} onChange={e => setNewGroup({...newGroup, code: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600" placeholder="เช่น DM001 (ต้องไม่ซ้ำ)" /></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">รายละเอียด</label><input type="text" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600" placeholder="คำอธิบายสั้นๆ" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">LINE Group Link (Optional)</label><input type="url" value={newGroup.lineLink} onChange={e => setNewGroup({...newGroup, lineLink: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600" placeholder="https://line.me/..." /></div>
                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading ? 'กำลังสร้าง...' : '+ สร้างกลุ่ม'}</button>
                </form>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">กลุ่มที่ดูแลอยู่ ({groups.length})</h3>
                <div className="grid gap-4">
                    {groups.map(g => (
                        <div key={g.id} className="p-4 border dark:border-gray-600 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedGroup(g)}>
                            <div className="flex items-center gap-4">
                                {g.image ? <img src={g.image} className="w-12 h-12 rounded-lg object-cover bg-gray-200" /> : <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600"><UserGroupIcon className="w-6 h-6" /></div>}
                                <div><h4 className="font-bold text-teal-700 dark:text-teal-300 text-lg">{g.name}</h4><p className="text-sm text-gray-500 dark:text-gray-400">Code: <span className="font-mono font-bold bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{g.code}</span></p><p className="text-xs text-gray-400 mt-1">{g.description}</p></div>
                            </div>
                            <div className="mt-2 md:mt-0 flex flex-col items-end gap-2">{g.lineLink && (<a href={g.lineLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded-full hover:bg-green-600"><LineIcon className="w-3 h-3" /> LINE Group</a>)}<span className="text-xs text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900 px-2 py-1 rounded">คลิกเพื่อจัดการ</span></div>
                        </div>
                    ))}
                    {groups.length === 0 && <p className="text-gray-500 text-center">ยังไม่มีกลุ่มที่สร้าง</p>}
                </div>
            </div>
        </div>
    );
};

const OverviewStatCard: React.FC<{ title: string; value: string | number; subValue?: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subValue, icon, colorClass }) => (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-gray-600 flex items-center justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">{value}</h3>
            {subValue && <p className="text-[10px] text-gray-400 mt-0.5">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>{icon}</div>
    </div>
);

const BarChart: React.FC<{ data: { label: string; value: number; color: string }[]; title: string }> = ({ data, title }) => (
    <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-gray-600">
        <h4 className="font-bold text-gray-700 dark:text-white mb-4 text-sm uppercase flex items-center gap-2">
            <ChartBarIcon className="w-4 h-4" /> {title}
        </h4>
        <div className="space-y-3">
            {data.map((item, idx) => (
                <div key={idx} className="relative">
                    <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                        <span className="text-gray-800 dark:text-white font-bold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const { scriptUrl, currentUser, organizations } = useContext(AppContext);
    const [allData, setAllData] = useState<AllAdminData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'groups' | 'allUsers' | 'profiles' | 'evaluation'>('overview');
    const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all'); 

    const isSuperAdmin = currentUser?.organization === 'all';
    const assignedOrg = currentUser?.organization || 'general';

    useEffect(() => {
        if (!isSuperAdmin) {
            setSelectedOrgFilter(assignedOrg);
        }
    }, [isSuperAdmin, assignedOrg]);

    useEffect(() => {
        if (activeTab === 'groups') {
            setLoading(false); // Groups load their own data
            return; 
        }
        
        const fetchData = async () => {
            if (!scriptUrl) {
                setError("กรุณาตั้งค่า Web App URL ในหน้า Settings ก่อน");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const data = await fetchAllAdminDataFromSheet(scriptUrl, ADMIN_KEY);
                if (data) {
                    setAllData(data);
                } else {
                    setError("ไม่สามารถดึงข้อมูลได้");
                }
            } catch (err: any) {
                setError(err.message || "เกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [scriptUrl, activeTab]);
    
    // --- Data Calculation Logic ---
    const userProfilesWithOrg = useMemo(() => {
        if (!allData?.profiles) return [];
        return allData.profiles.map(p => ({
            ...p,
            organization: p.organization || 'general' 
        }));
    }, [allData]);

    const filteredUsers = useMemo(() => {
        if (selectedOrgFilter === 'all') return userProfilesWithOrg;
        return userProfilesWithOrg.filter(u => u.organization === selectedOrgFilter);
    }, [userProfilesWithOrg, selectedOrgFilter]);

    const filteredUsernames = useMemo(() => {
        return new Set(filteredUsers.map(u => u.username));
    }, [filteredUsers]);

    const stats = useMemo(() => {
        const totalUsers = filteredUsers.length;
        const maleCount = filteredUsers.filter(u => u.gender === 'male').length;
        const femaleCount = filteredUsers.filter(u => u.gender === 'female').length;
        
        // Age & BMI
        let totalAge = 0, ageCount = 0;
        let totalBMI = 0, bmiCount = 0;
        const userLatestBMI: Record<string, number> = {};

        // Find latest BMI for filtered users
        if (allData?.bmiHistory) {
            const sortedBMI = [...allData.bmiHistory].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            sortedBMI.forEach(b => {
                if (filteredUsernames.has(b.username)) userLatestBMI[b.username] = b.bmi;
            });
        }

        filteredUsers.forEach(u => {
            if (u.age && !isNaN(Number(u.age))) { totalAge += Number(u.age); ageCount++; }
            if (userLatestBMI[u.username]) { totalBMI += userLatestBMI[u.username]; bmiCount++; }
        });

        const avgAge = ageCount > 0 ? (totalAge / ageCount).toFixed(1) : '-';
        const avgBMI = bmiCount > 0 ? (totalBMI / bmiCount).toFixed(1) : '-';

        // Health Conditions
        const conditionCounts: Record<string, number> = {};
        filteredUsers.forEach(u => {
            const cond = u.healthCondition || 'ไม่ระบุ';
            conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });
        const conditionStats = Object.entries(conditionCounts)
            .map(([label, count]) => ({ label, value: Math.round((count / totalUsers) * 100) || 0, color: 'bg-rose-500' }))
            .sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

        // Levels
        const levelCounts: Record<string, number> = {};
        filteredUsers.forEach(u => {
            const lvl = u.level || 1;
            const group = lvl >= 10 ? 'Lv.10+' : lvl >= 5 ? 'Lv.5-9' : 'Lv.1-4';
            levelCounts[group] = (levelCounts[group] || 0) + 1;
        });
        const levelStats = [
            { label: 'Lv.1-4 (Beginner)', value: Math.round((levelCounts['Lv.1-4'] || 0) / totalUsers * 100) || 0, color: 'bg-gray-400' },
            { label: 'Lv.5-9 (Intermediate)', value: Math.round((levelCounts['Lv.5-9'] || 0) / totalUsers * 100) || 0, color: 'bg-yellow-400' },
            { label: 'Lv.10+ (Expert)', value: Math.round((levelCounts['Lv.10+'] || 0) / totalUsers * 100) || 0, color: 'bg-purple-500' },
        ];

        // Global counts (Admin view)
        const totalAdmins = allData?.profiles ? allData.profiles.filter(p => String(p.role).toLowerCase() === 'admin').length : 0;
        const totalOrgs = organizations?.length || 0;
        const totalGroups = allData?.['Groups']?.length || 0; // Assuming raw sheet name access if not typed

        return { 
            totalUsers, malePercent: Math.round((maleCount/totalUsers)*100)||0, femalePercent: Math.round((femaleCount/totalUsers)*100)||0,
            avgAge, avgBMI, conditionStats, levelStats, totalAdmins, totalOrgs, totalGroups
        };
    }, [filteredUsers, allData, organizations, filteredUsernames]);

    const evalStats = useMemo(() => {
        if (!allData?.evaluationHistory) return { satisfaction: [], outcomes: [] };
        
        const filteredEvals = allData.evaluationHistory.filter(e => filteredUsernames.has(e.username));
        if (filteredEvals.length === 0) return { satisfaction: [], outcomes: [] };

        // Satisfaction Average
        const satSums: Record<string, number> = {};
        const satCounts: Record<string, number> = {};
        
        // Outcome Trend (Better/Same/Worse)
        const outCounts: Record<string, { better: number, same: number, worse: number }> = {};

        filteredEvals.forEach(e => {
            try {
                const sat = typeof e.satisfaction_json === 'string' ? JSON.parse(e.satisfaction_json) : e.satisfaction_json;
                const out = typeof e.outcome_json === 'string' ? JSON.parse(e.outcome_json) : e.outcome_json;

                if (sat) {
                    Object.entries(sat).forEach(([k, v]) => {
                        satSums[k] = (satSums[k] || 0) + Number(v);
                        satCounts[k] = (satCounts[k] || 0) + 1;
                    });
                }
                if (out) {
                    Object.entries(out).forEach(([k, v]) => {
                        if (!outCounts[k]) outCounts[k] = { better: 0, same: 0, worse: 0 };
                        if (v === 'better' || v === 'much_better') outCounts[k].better++;
                        else if (v === 'same') outCounts[k].same++;
                        else outCounts[k].worse++;
                    });
                }
            } catch (err) {}
        });

        const satisfactionData = SATISFACTION_QUESTIONS.map(q => ({
            label: q.label,
            value: satCounts[q.id] ? (satSums[q.id] / satCounts[q.id]).toFixed(1) : '0',
            color: 'bg-indigo-500' // Just for bar visualization
        }));

        const outcomeData = OUTCOME_QUESTIONS.map(q => {
            const counts = outCounts[q.id] || { better: 0, same: 0, worse: 0 };
            const total = counts.better + counts.same + counts.worse;
            return {
                label: q.label,
                value: total > 0 ? Math.round((counts.better / total) * 100) : 0,
                color: 'bg-green-500' // % Improvement
            };
        });

        return { satisfaction: satisfactionData, outcomes: outcomeData };
    }, [allData, filteredUsernames]);

    const quizStats = useMemo(() => {
        if (!allData?.quizHistory) return { prePass: 0, postPass: 0 };
        const filteredQuiz = allData.quizHistory.filter(q => filteredUsernames.has(q.username || q.username)); // Fallback if property differs
        
        // Manual mapping from array to object in generic fetch if needed, but assuming fetchAllAdminData maps correctly.
        // Actually fetchAllAdminData uses generic map which relies on headers. 
        // QuizHistory header is: timestamp, username, displayName, profilePicture, score, totalQuestions, correctAnswers, type
        
        const preTests = filteredQuiz.filter((q: any) => q.type === 'pre-test');
        const postTests = filteredQuiz.filter((q: any) => q.type === 'post-test');

        const calcPass = (arr: any[]) => {
            if (arr.length === 0) return 0;
            const passCount = arr.filter(q => (Number(q.score) || 0) >= 60).length; // Pass > 60%
            return Math.round((passCount / arr.length) * 100);
        };

        return { prePass: calcPass(preTests), postPass: calcPass(postTests) };
    }, [allData, filteredUsernames]);

    // --- Tab Render Logic ---
    const renderContent = () => {
        if (activeTab === 'groups') return <GroupManagementTab />;
        
        if (loading) return <Spinner />;
        if (error) return <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 dark:text-red-400 p-4 rounded-lg">{error}</p>;
        if (!allData) return <p className="text-center text-gray-500">ไม่มีข้อมูล</p>;

        if (activeTab === 'overview') {
             return (
                 <div className="space-y-6 animate-fade-in">
                     {/* Row 1: Key Metrics */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <OverviewStatCard title="ผู้ใช้งานทั้งหมด" value={stats.totalUsers.toLocaleString()} subValue="Active Users" icon={<UserGroupIcon className="w-6 h-6 text-blue-500"/>} colorClass="bg-blue-500 text-blue-500"/>
                         <OverviewStatCard title="อายุเฉลี่ย" value={stats.avgAge} subValue="ปี (Years)" icon={<UserCircleIcon className="w-6 h-6 text-teal-500"/>} colorClass="bg-teal-500 text-teal-500"/>
                         <OverviewStatCard title="BMI เฉลี่ย" value={stats.avgBMI} subValue="kg/m²" icon={<ScaleIcon className="w-6 h-6 text-orange-500"/>} colorClass="bg-orange-500 text-orange-500"/>
                         {isSuperAdmin && <OverviewStatCard title="องค์กร/กลุ่ม" value={`${stats.totalOrgs} / ${stats.totalGroups}`} subValue="Org / Groups" icon={<SquaresIcon className="w-6 h-6 text-purple-500"/>} colorClass="bg-purple-500 text-purple-500"/>}
                     </div>

                     {/* Row 2: Demographics & Levels */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-gray-600">
                             <h4 className="font-bold text-gray-700 dark:text-white mb-4 text-sm uppercase flex items-center gap-2"><UserCircleIcon className="w-4 h-4"/> สัดส่วนผู้ใช้งาน (Gender)</h4>
                             <div className="flex items-center gap-4 mt-6">
                                 <div className="flex-1 text-center">
                                     <div className="text-3xl font-black text-blue-500">{stats.malePercent}%</div>
                                     <div className="text-xs text-gray-500 dark:text-gray-400">เพศชาย</div>
                                     <div className="w-full bg-gray-200 h-2 rounded-full mt-2"><div className="h-full bg-blue-500 rounded-full" style={{width: `${stats.malePercent}%`}}></div></div>
                                 </div>
                                 <div className="flex-1 text-center">
                                     <div className="text-3xl font-black text-pink-500">{stats.femalePercent}%</div>
                                     <div className="text-xs text-gray-500 dark:text-gray-400">เพศหญิง</div>
                                     <div className="w-full bg-gray-200 h-2 rounded-full mt-2"><div className="h-full bg-pink-500 rounded-full" style={{width: `${stats.femalePercent}%`}}></div></div>
                                 </div>
                             </div>
                         </div>
                         <BarChart title="ระดับผู้ใช้งาน (User Levels)" data={stats.levelStats} />
                     </div>

                     {/* Row 3: Health & Quiz */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <BarChart title="โรคประจำตัว / ความเสี่ยง (Top 5)" data={stats.conditionStats} />
                         <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-gray-600">
                             <h4 className="font-bold text-gray-700 dark:text-white mb-4 text-sm uppercase flex items-center gap-2"><BookOpenIcon className="w-4 h-4"/> ผลการทดสอบความรู้ (Health Literacy)</h4>
                             <div className="grid grid-cols-2 gap-4 mt-4">
                                 <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center">
                                     <p className="text-xs text-orange-600 dark:text-orange-300 font-bold mb-1">Pre-Test Pass Rate</p>
                                     <p className="text-3xl font-black text-orange-600 dark:text-orange-400">{quizStats.prePass}%</p>
                                 </div>
                                 <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                                     <p className="text-xs text-green-600 dark:text-green-300 font-bold mb-1">Post-Test Pass Rate</p>
                                     <p className="text-3xl font-black text-green-600 dark:text-green-400">{quizStats.postPass}%</p>
                                 </div>
                             </div>
                             <p className="text-[10px] text-gray-400 text-center mt-3">*เกณฑ์ผ่าน 60%</p>
                         </div>
                     </div>
                 </div>
             );
        }

        if (activeTab === 'evaluation') {
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                        <h3 className="text-xl font-bold flex items-center gap-2"><ClipboardCheckIcon className="w-6 h-6"/> รายงานผลการประเมินแอปพลิเคชัน</h3>
                        <p className="text-indigo-100 text-sm mt-1">สรุปความพึงพอใจและผลลัพธ์การปรับเปลี่ยนพฤติกรรม</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm">
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-sm border-b pb-2 dark:border-gray-600">คะแนนความพึงพอใจเฉลี่ย (เต็ม 5)</h4>
                            <div className="space-y-4">
                                {evalStats.satisfaction.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-300 truncate w-3/4">{item.label}</span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{width: `${(Number(item.value)/5)*100}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-sm">
                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-sm border-b pb-2 dark:border-gray-600">ผลลัพธ์สุขภาพ (% ผู้ตอบว่า "ดีขึ้น")</h4>
                            <div className="space-y-4">
                                {evalStats.outcomes.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-300 truncate w-3/4">{item.label}</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">{item.value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{width: `${item.value}%`}}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Raw Evaluation Data Table */}
                    <DataTable data={allData.evaluationHistory || []} title="ข้อมูลดิบแบบประเมิน (Raw Data)" allowExport={true} />
                </div>
            );
        }
        
        // ... Other tabs handling ...
        const tabsDef = [
            { id: 'allUsers', label: 'สมาชิก', data: [] },
            { id: 'profiles', label: 'Profiles Data', data: filteredUsers },
        ];
        const activeTabData = tabsDef.find(t => t.id === activeTab);
        return <DataTable data={activeTabData?.data || []} title={activeTabData?.label || ''} allowExport={true} />;
    };

    const tabs = [
        { id: 'overview', label: 'ภาพรวม (Overview)' },
        { id: 'groups', label: 'จัดการกลุ่ม (Groups)' },
        { id: 'allUsers', label: 'สมาชิก' },
        { id: 'profiles', label: 'Profiles' },
        { id: 'evaluation', label: 'แบบประเมิน (Evaluation)' }, // Restored
    ];

    const currentOrgName = (organizations || []).find(o => o.id === selectedOrgFilter)?.name || 'ทั้งหมด';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full transform transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {isSuperAdmin ? 'Research Admin Dashboard' : `Dashboard: ${currentOrgName}`}
                    </h2>
                    <p className="text-gray-500 text-sm">ระบบติดตามและประเมินผลสำหรับงานวิชาการสาธารณสุข</p>
                </div>
                
                {isSuperAdmin && activeTab !== 'groups' && (
                    <select 
                        value={selectedOrgFilter} 
                        onChange={(e) => setSelectedOrgFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 text-sm"
                    >
                        <option value="all">-- แสดงข้อมูลทุกพื้นที่ --</option>
                        {(organizations || []).map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto pb-2" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;
