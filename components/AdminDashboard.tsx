
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, resetUserData, AllAdminData } from '../services/googleSheetService';
import { ChartBarIcon, UserGroupIcon, FireIcon, HeartIcon, ScaleIcon, SquaresIcon, ClipboardListIcon, ExclamationTriangleIcon, SearchIcon, ArrowLeftIcon, ClipboardCheckIcon, BoltIcon, TrophyIcon, StarIcon, BookOpenIcon, BeakerIcon, InformationCircleIcon } from './icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helper Components ---

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <p className="text-teal-600 dark:text-teal-400 font-medium">กำลังประมวลผลข้อมูล...</p>
    </div>
);

const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 text-xs">
                <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label || payload[0].name}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-black">
                    {payload[0].value.toLocaleString()} คน
                </p>
                {payload[0].payload.percent && (
                    <p className="text-gray-500 text-[10px]">
                        {(payload[0].payload.percent * 100).toFixed(1)}%
                    </p>
                )}
            </div>
        );
    }
    return null;
};

const FilterBar: React.FC<{
    orgs: any[],
    groups: any[],
    selectedOrg: string,
    setSelectedOrg: (val: string) => void,
    selectedGroup: string,
    setSelectedGroup: (val: string) => void,
    startDate: string,
    setStartDate: (val: string) => void,
    endDate: string,
    setEndDate: (val: string) => void,
    onRefresh: () => void
}> = ({ orgs, groups, selectedOrg, setSelectedOrg, selectedGroup, setSelectedGroup, startDate, setStartDate, endDate, setEndDate, onRefresh }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between animate-fade-in-down">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* Org Filter */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">หน่วยงาน (Organization)</label>
                    <div className="relative">
                        <select 
                            value={selectedOrg} 
                            onChange={(e) => setSelectedOrg(e.target.value)}
                            className="w-full p-2.5 pl-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                        >
                            <option value="all">ทั้งหมด (All Organizations)</option>
                            {orgs.map((o, i) => <option key={i} value={o.id}>{o.name}</option>)}
                        </select>
                        <UserGroupIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                {/* Group Filter (New) */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">กลุ่ม/คลินิก (Group/Clinic)</label>
                    <div className="relative">
                        <select 
                            value={selectedGroup} 
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="w-full p-2.5 pl-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="all">ทั้งหมด (All Groups)</option>
                            {groups && groups.map((g, i) => {
                                // Support raw data keys (GroupId/Name) or app keys (id/name)
                                const gid = g.id || g.GroupId || g.groupId;
                                const gname = g.name || g.Name;
                                return <option key={i} value={gid}>{gname}</option>;
                            })}
                        </select>
                        <SquaresIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                {/* Date Filters */}
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">ตั้งแต่วันที่</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">ถึงวันที่</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                    />
                </div>
            </div>
            
            <button 
                onClick={onRefresh}
                className="mt-4 md:mt-0 w-full md:w-auto px-6 py-2.5 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap h-[42px]"
            >
                <SearchIcon className="w-4 h-4" /> ประมวลผล
            </button>
        </div>
    );
};

const KPICard: React.FC<{ title: string, value: string, subValue?: string, change?: string, icon: React.ReactNode, color: string }> = ({ title, value, subValue, change, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-3 opacity-10 transform group-hover:scale-110 transition-transform duration-500 ${color.replace('text-', 'text-')}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-16 h-16" })}
        </div>
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')} ${color}`}>
                {icon}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{title}</p>
            <div className="flex items-end gap-2 mt-1">
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">{value}</h3>
                {change && (
                    <span className={`text-xs font-bold mb-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {change}
                    </span>
                )}
            </div>
            {subValue && <p className="text-xs text-gray-400 mt-1 font-medium">{subValue}</p>}
        </div>
    </div>
);

interface DashboardStats {
    totalN: number;
    gender: { male: number; female: number; unspecified: number };
    bmiStats: { under: number; normal: number; over: number; obese: number };
    waistRiskDetail: { male: number; female: number };
    whrRiskDetail: { male: number; female: number };
    ncdCount: number;
    ncdBreakdown: Record<string, number>;
    ageGroups: Record<string, number>;
    activeUsersCount: number;
    orgStats: Record<string, number>;
    groupStats: Record<string, number>;
    activityStats: Record<string, number>;
}

// --- Macro View Logic ---

const MacroOverview: React.FC<{ 
    adminData: AllAdminData | null, 
    filterOrg: string, 
    filterGroup: string,
    startDate: string, 
    endDate: string 
}> = ({ adminData, filterOrg, filterGroup, startDate, endDate }) => {
    const { organizations } = useContext(AppContext);
    
    if (!adminData) return <div className="text-center py-10 text-gray-400">No Data Loaded</div>;

    const { profiles, bmiHistory, groupMembers, groups } = adminData as any;

    const stats: DashboardStats = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        // Pre-process Group Lookups
        const validUsernamesInGroup = new Set();
        const userGroupsMap = new Map<string, string[]>();
        
        if (groupMembers) {
            groupMembers.forEach((m: any) => {
                const u = m.Username || m.username;
                const g = m.GroupId || m.groupId;
                if (!userGroupsMap.has(u)) userGroupsMap.set(u, []);
                userGroupsMap.get(u)?.push(g);

                if (filterGroup && filterGroup !== 'all') {
                    if (g === filterGroup) {
                        validUsernamesInGroup.add(u);
                    }
                }
            });
        }

        const userMap = new Map();
        (profiles || []).forEach((p: any) => {
            if (filterOrg !== 'all' && p.organization !== filterOrg) return;
            if (filterGroup !== 'all' && !validUsernamesInGroup.has(p.username)) return;

            const joinDate = new Date(p.timestamp);
            if (joinDate <= end) {
                userMap.set(p.username, p);
            }
        });

        const uniqueUsers = Array.from(userMap.values());
        const totalN = uniqueUsers.length;

        // Counters
        let gender = { male: 0, female: 0, unspecified: 0 };
        let bmiStats = { under: 0, normal: 0, over: 0, obese: 0 };
        let waistRiskDetail = { male: 0, female: 0 }; 
        let whrRiskDetail = { male: 0, female: 0 }; 
        let ncdCount = 0; 
        let ncdBreakdown: Record<string, number> = {}; 
        let ageGroups: Record<string, number> = { 'ต่ำกว่า 18': 0, '18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0, 'ไม่ระบุ': 0 };
        let activeUsersCount = 0;
        
        let orgStats: Record<string, number> = {};
        let groupStats: Record<string, number> = {};
        let activityStats: Record<string, number> = {};

        const getActivityLabel = (val: any) => {
            const v = parseFloat(val);
            if (v <= 1.2) return 'ไม่ออกกำลังกาย';
            if (v <= 1.375) return 'เล็กน้อย';
            if (v <= 1.55) return 'ปานกลาง';
            if (v <= 1.725) return 'หนัก';
            return 'หนักมาก';
        };

        uniqueUsers.forEach((u: any) => {
            const sex = u.gender ? u.gender.toLowerCase() : 'unknown';
            if (sex === 'male') gender.male++;
            else if (sex === 'female') gender.female++;
            else gender.unspecified++;

            const age = parseInt(u.age);
            if (isNaN(age) || age <= 0) ageGroups['ไม่ระบุ']++;
            else if (age < 18) ageGroups['ต่ำกว่า 18']++;
            else if (age >= 18 && age <= 29) ageGroups['18-29']++;
            else if (age >= 30 && age <= 39) ageGroups['30-39']++;
            else if (age >= 40 && age <= 49) ageGroups['40-49']++;
            else if (age >= 50 && age <= 59) ageGroups['50-59']++;
            else ageGroups['60+']++;

            const weight = parseFloat(u.weight);
            const height = parseFloat(u.height);
            if (weight > 0 && height > 0) {
                const hM = height / 100;
                const bmi = weight / (hM * hM);
                if (bmi < 18.5) bmiStats.under++;
                else if (bmi < 23) bmiStats.normal++;
                else if (bmi < 25) bmiStats.over++;
                else bmiStats.obese++;
            }

            const waist = parseFloat(u.waist);
            const hip = parseFloat(u.hip);
            if (waist > 0) {
                if (sex === 'male' && waist > 90) waistRiskDetail.male++;
                if (sex === 'female' && waist > 80) waistRiskDetail.female++;
            }
            if (waist > 0 && hip > 0) {
                const whr = waist / hip;
                if (sex === 'male' && whr >= 0.90) whrRiskDetail.male++;
                if (sex === 'female' && whr >= 0.85) whrRiskDetail.female++;
            }

            const condition = u.healthCondition;
            if (condition && condition !== 'ไม่มีโรคประจำตัว' && condition !== 'N/A' && condition !== '-') {
                ncdCount++;
                const disease = condition.trim();
                ncdBreakdown[disease] = (ncdBreakdown[disease] || 0) + 1;
            }

            const orgId = u.organization || 'general';
            orgStats[orgId] = (orgStats[orgId] || 0) + 1;

            const actLabel = getActivityLabel(u.activityLevel);
            activityStats[actLabel] = (activityStats[actLabel] || 0) + 1;

            const userGs = userGroupsMap.get(u.username);
            if (userGs && userGs.length > 0) {
                userGs.forEach(gid => {
                    groupStats[gid] = (groupStats[gid] || 0) + 1;
                });
            } else {
                groupStats['no_group'] = (groupStats['no_group'] || 0) + 1;
            }

            const userLogs = (bmiHistory || []).filter((b: any) => b.username === u.username);
            if (userLogs.length > 0) activeUsersCount++;
        });

        return { 
            totalN, gender, bmiStats, waistRiskDetail, whrRiskDetail, 
            ncdCount, ncdBreakdown, ageGroups, activeUsersCount,
            orgStats, groupStats, activityStats
        };

    }, [profiles, bmiHistory, groupMembers, filterOrg, filterGroup, startDate, endDate]);

    const genderData = [
        { name: 'ชาย', value: stats.gender.male },
        { name: 'หญิง', value: stats.gender.female },
        { name: 'ไม่ระบุ', value: stats.gender.unspecified }
    ].filter(d => d.value > 0);
    const GENDER_COLORS = ['#3B82F6', '#EC4899', '#9CA3AF'];

    const ageData = Object.entries(stats.ageGroups).map(([name, value]) => ({ name, value }));

    const bmiData = [
        { name: 'ผอม', value: stats.bmiStats.under },
        { name: 'สมส่วน', value: stats.bmiStats.normal },
        { name: 'ท้วม', value: stats.bmiStats.over },
        { name: 'อ้วน', value: stats.bmiStats.obese }
    ].filter(d => d.value > 0);
    const BMI_COLORS = ['#60A5FA', '#22C55E', '#FACC15', '#EF4444'];

    const ncdData = Object.entries(stats.ncdBreakdown)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const orgNameMap = (organizations || []).reduce((acc: any, o: any) => { acc[o.id] = o.name; return acc; }, {});
    const orgData = Object.entries(stats.orgStats)
        .map(([id, value]) => ({ name: orgNameMap[id] || id, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

    const groupNameMap = (groups || []).reduce((acc: any, g: any) => { 
        const id = g.id || g.GroupId || g.groupId;
        const name = g.name || g.Name;
        if (id) acc[String(id)] = name; 
        return acc; 
    }, {});
    const groupData = Object.entries(stats.groupStats)
        .map(([id, value]) => ({ name: groupNameMap[String(id)] || (String(id) === 'no_group' ? 'ไม่มีกลุ่ม' : String(id)), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded dark:bg-teal-900 dark:text-teal-300">Macro View</span>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">สถิติและผลลัพธ์สุขภาพ (Statistics & Outcomes)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="กลุ่มตัวอย่าง (N)" value={stats.totalN.toLocaleString()} subValue={`ชาย ${stats.gender.male} | หญิง ${stats.gender.female}`} icon={<UserGroupIcon />} color="text-blue-600" />
                <KPICard title="กลุ่มเสี่ยงโรค (NCDs)" value={stats.ncdCount.toLocaleString()} subValue={`คิดเป็น ${stats.totalN > 0 ? ((stats.ncdCount/stats.totalN)*100).toFixed(1) : 0}%`} icon={<HeartIcon />} color="text-rose-500" />
                <KPICard title="เสี่ยงรอบเอว (รวม)" value={(stats.waistRiskDetail.male + stats.waistRiskDetail.female).toLocaleString()} subValue={`ชาย ${stats.waistRiskDetail.male} | หญิง ${stats.waistRiskDetail.female}`} icon={<ScaleIcon />} color="text-orange-500" />
                <KPICard title="เสี่ยง WHR (รวม)" value={(stats.whrRiskDetail.male + stats.whrRiskDetail.female).toLocaleString()} subValue={`อัตราส่วนสะโพกเกินเกณฑ์`} icon={<ExclamationTriangleIcon />} color="text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-blue-500"/> ประชากรศาสตร์ (Gender)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={genderData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-indigo-500"/> ช่วงอายุ (Age Groups)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} name="จำนวน (คน)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ScaleIcon className="w-5 h-5 text-teal-500"/> ภาวะโภชนาการ (BMI)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={bmiData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                                    {bmiData.map((entry, index) => <Cell key={`cell-${index}`} fill={BMI_COLORS[index % BMI_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><HeartIcon className="w-5 h-5 text-rose-500"/> โรคประจำตัว (Top NCDs)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ncdData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Bar dataKey="value" fill="#F43F5E" radius={[0, 4, 4, 0]} name="จำนวน (คน)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[500px] flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><ClipboardListIcon className="w-5 h-5 text-indigo-500"/> แยกตามหน่วยงาน (Organizations)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orgData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} name="จำนวน (คน)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-[500px] flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><UserGroupIcon className="w-5 h-5 text-orange-500"/> แยกตามกลุ่ม (Groups)</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={groupData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                                <RechartsTooltip content={<CustomChartTooltip />} />
                                <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} name="จำนวน (คน)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Outcome Analysis Component (UPDATED FIX) ---

const OutcomeAnalysis: React.FC<{ 
    adminData: AllAdminData | null, 
    filterOrg: string, 
    filterGroup: string,
    startDate: string, 
    endDate: string 
}> = ({ adminData, filterOrg, filterGroup, startDate, endDate }) => {
    if (!adminData) return <div className="text-center py-10 text-gray-400">No Data Loaded</div>;

    const { profiles, bmiHistory, quizHistory, groupMembers, clinicalHistory, evaluationHistory } = adminData as any;

    const outcomes = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        // 1. Identify Target Users based on Filters
        const validUsernamesInGroup = new Set<string>();
        
        if (filterGroup && filterGroup !== 'all' && groupMembers) {
            groupMembers.forEach((m: any) => {
                if (m.GroupId === filterGroup || m.groupId === filterGroup) {
                    validUsernamesInGroup.add(m.Username || m.username);
                }
            });
        }

        const validUsernames = new Set<string>();
        (profiles || []).forEach((p: any) => {
            if (filterOrg !== 'all' && p.organization !== filterOrg) return;
            if (filterGroup !== 'all' && !validUsernamesInGroup.has(p.username)) return;
            validUsernames.add(p.username);
        });

        // --- Aggregated Clinical Progression Table ---
        const metrics = [
            { key: 'weight', label: 'น้ำหนัก (Weight)', unit: 'kg', goal: 'ลดลง', dir: 'desc' },
            { key: 'bmi', label: 'ดัชนีมวลกาย (BMI)', unit: 'kg/m²', goal: '18.5-22.9', dir: 'desc' },
            { key: 'systolic', label: 'ความดันตัวบน (SBP)', unit: 'mmHg', goal: '< 120', dir: 'desc' },
            { key: 'diastolic', label: 'ความดันตัวล่าง (DBP)', unit: 'mmHg', goal: '< 80', dir: 'desc' },
            { key: 'fbs', label: 'น้ำตาล (FBS)', unit: 'mg/dL', goal: '< 100', dir: 'desc' },
            { key: 'hba1c', label: 'น้ำตาลสะสม (HbA1c)', unit: '%', goal: '< 6.5', dir: 'desc' },
            { key: 'waist', label: 'รอบเอว (Waist)', unit: 'cm', goal: 'M<90, F<80', dir: 'desc' },
            { key: 'visceral_fat', label: 'ไขมันช่องท้อง', unit: 'Lv', goal: '< 10', dir: 'desc' },
            { key: 'muscle_mass', label: 'มวลกล้ามเนื้อ', unit: 'kg', goal: 'เพิ่มขึ้น', dir: 'asc' },
        ];

        const aggStats: Record<string, { 
            baseline: { sum: number, count: number },
            latest: { sum: number, count: number },
            comparison: { improved: number, worsened: number, same: number, total: number } 
        }> = {};

        metrics.forEach(m => {
            aggStats[m.key] = {
                baseline: { sum: 0, count: 0 },
                latest: { sum: 0, count: 0 },
                comparison: { improved: 0, worsened: 0, same: 0, total: 0 }
            };
        });

        validUsernames.forEach(username => {
            const userBmiLogs = (bmiHistory || [])
                .filter((b: any) => b.username === username)
                .map((b: any) => ({ ...b, type: 'bmi' }));
            
            const userClinicalLogs = (clinicalHistory || [])
                .filter((c: any) => c.username === username)
                .map((c: any) => ({ ...c, type: 'clinical' }));

            const allLogs = [...userBmiLogs, ...userClinicalLogs].sort((a, b) => new Date(a.date || a.timestamp).getTime() - new Date(b.date || b.timestamp).getTime());

            if (allLogs.length === 0) return;

            metrics.forEach(m => {
                const getValue = (log: any) => {
                    if (!log) return null;
                    if (m.key === 'bmi' && log.value) return parseFloat(log.value);
                    if (log[m.key]) return parseFloat(log[m.key]);
                    return null;
                };

                const validMetricLogs = allLogs.filter(l => getValue(l) !== null);
                
                if (validMetricLogs.length > 0) {
                    const firstLog = validMetricLogs[0];
                    const lastLog = validMetricLogs[validMetricLogs.length - 1];
                    const firstVal = getValue(firstLog);
                    const lastVal = getValue(lastLog);

                    if (firstVal !== null) {
                        aggStats[m.key].baseline.sum += firstVal;
                        aggStats[m.key].baseline.count++;
                    }
                    if (lastVal !== null) {
                        aggStats[m.key].latest.sum += lastVal;
                        aggStats[m.key].latest.count++;
                    }

                    if (validMetricLogs.length >= 2 && firstVal !== null && lastVal !== null) {
                        aggStats[m.key].comparison.total++;
                        if (firstVal === lastVal) {
                            aggStats[m.key].comparison.same++;
                        } else if (m.dir === 'asc') {
                            if (lastVal > firstVal) aggStats[m.key].comparison.improved++;
                            else aggStats[m.key].comparison.worsened++;
                        } else {
                            if (lastVal < firstVal) aggStats[m.key].comparison.improved++;
                            else aggStats[m.key].comparison.worsened++;
                        }
                    }
                }
            });
        });

        const clinicalTableData = metrics.map(m => {
            const s = aggStats[m.key];
            const avg = (d: {sum:number, count:number}) => d.count > 0 ? (d.sum / d.count).toFixed(1) : '-';
            const totalComp = s.comparison.total;
            const impPct = totalComp > 0 ? ((s.comparison.improved / totalComp) * 100).toFixed(0) : '0';
            const worPct = totalComp > 0 ? ((s.comparison.worsened / totalComp) * 100).toFixed(0) : '0';
            const samePct = totalComp > 0 ? ((s.comparison.same / totalComp) * 100).toFixed(0) : '0';

            return {
                label: m.label,
                unit: m.unit,
                goal: m.goal,
                baseline: { val: avg(s.baseline), n: s.baseline.count },
                latest: { val: avg(s.latest), n: s.latest.count },
                comparison: {
                    improved: { n: s.comparison.improved, pct: impPct },
                    worsened: { n: s.comparison.worsened, pct: worPct },
                    same: { n: s.comparison.same, pct: samePct },
                    total: totalComp
                }
            };
        });

        // --- Evaluation (Satisfaction & Outcomes) Analysis ---
        const validEvaluations = (evaluationHistory || []).filter((e: any) => {
            if (!validUsernames.has(e.username)) return false;
            const eDate = new Date(e.timestamp || e.date);
            return eDate >= start && eDate <= end;
        });

        const totalEvals = validEvaluations.length;
        const satKeys = ['usability', 'features', 'benefit', 'overall', 'recommend'];
        const satSums: Record<string, number> = {};
        satKeys.forEach(k => satSums[k] = 0);

        const outKeys = ['nutrition', 'activity', 'sleep', 'stress', 'risk', 'overall'];
        const outCounts: Record<string, { improved: number, same: number, worse: number }> = {};
        outKeys.forEach(k => outCounts[k] = { improved: 0, same: 0, worse: 0 });

        validEvaluations.forEach((e: any) => {
            let sat = e.satisfaction_json || e.satisfaction;
            if (typeof sat === 'string') { try { sat = JSON.parse(sat); } catch(err) { sat = {}; } }
            if (sat) {
                satKeys.forEach(k => {
                    const val = parseFloat(sat[k]);
                    if (!isNaN(val)) satSums[k] += val;
                });
            }

            let out = e.outcomes_json || e.outcomes;
            if (typeof out === 'string') { try { out = JSON.parse(out); } catch(err) { out = {}; } }
            if (out) {
                outKeys.forEach(k => {
                    const val = out[k];
                    if (val === 'much_better' || val === 'better') outCounts[k].improved++;
                    else if (val === 'same') outCounts[k].same++;
                    else if (val === 'worse') outCounts[k].worse++;
                });
            }
        });

        const satAverages = satKeys.map(k => ({
            key: k,
            avg: totalEvals > 0 ? (satSums[k] / totalEvals).toFixed(2) : '0.00'
        }));

        const outPercentages = outKeys.map(k => ({
            key: k,
            improved: totalEvals > 0 ? ((outCounts[k].improved / totalEvals) * 100).toFixed(1) : '0',
            same: totalEvals > 0 ? ((outCounts[k].same / totalEvals) * 100).toFixed(1) : '0',
            worse: totalEvals > 0 ? ((outCounts[k].worse / totalEvals) * 100).toFixed(1) : '0',
            n: totalEvals
        }));

        const evaluationStats = { totalEvals, satAverages, outPercentages };

        // ... (Literacy & BMI Migration Logic) ...
        const preScores: number[] = [];
        const postScores: number[] = [];
        const userQuizMap: Record<string, { pre: number | null, post: number | null }> = {};

        (quizHistory || []).forEach((q: any) => {
            if (!validUsernames.has(q.username)) return;
            
            // Fix: Use 'timestamp' if 'date' is undefined (Admin data vs User data structure)
            const dateStr = q.timestamp || q.date;
            if (!dateStr) return;

            const qDate = new Date(dateStr);
            if (isNaN(qDate.getTime())) return;
            if (qDate < start || qDate > end) return;

            if (q.type === 'pre-test') preScores.push(q.score);
            else if (q.type === 'post-test') postScores.push(q.score);

            if (!userQuizMap[q.username]) userQuizMap[q.username] = { pre: null, post: null };
            if (q.type === 'pre-test') userQuizMap[q.username].pre = q.score;
            else if (q.type === 'post-test') userQuizMap[q.username].post = q.score;
        });

        let totalImprovement = 0;
        let countImproved = 0;
        let totalPairs = 0;
        
        Object.values(userQuizMap).forEach((scores) => {
            if (scores.pre !== null && scores.post !== null) {
                totalPairs++;
                const diff = scores.post - scores.pre;
                totalImprovement += diff;
                if (diff > 0) countImproved++;
            }
        });

        const calculateStats = (scores: number[]) => {
            if (scores.length === 0) return { n: 0, pass: 0, passPct: 0, avg: 0, max: 0, min: 0 };
            const n = scores.length;
            const pass = scores.filter(s => s >= 80).length;
            const passPct = (pass / n) * 100;
            const sum = scores.reduce((a, b) => a + b, 0);
            const avg = sum / n;
            const max = Math.max(...scores);
            const min = Math.min(...scores);
            return { n, pass, passPct, avg, max, min };
        };

        const literacyStats = {
            totalPairs,
            avgImprovement: totalPairs > 0 ? (totalImprovement / totalPairs).toFixed(1) : 0,
            improvedPct: totalPairs > 0 ? (countImproved / totalPairs) * 100 : 0,
            detailed: {
                pre: calculateStats(preScores),
                post: calculateStats(postScores)
            }
        };

        // BMI Migration
        const getBmiScoreForFlow = (cat: string) => {
            if (!cat) return -1;
            if (cat.includes('ผอม') || cat.includes('Under')) return 0;
            if (cat.includes('สมส่วน') || cat.includes('Normal')) return 1;
            if (cat.includes('ท้วม') || cat.includes('Over')) return 2;
            if (cat.includes('อ้วน 1') || cat.includes('Obese 1')) return 3;
            if (cat.includes('อ้วน 2') || cat.includes('Obese 2')) return 4;
            return -1;
        };

        const bmiUserMap: Record<string, { start: any, end: any }> = {};
        (bmiHistory || []).forEach((b: any) => {
            if (!validUsernames.has(b.username)) return;
            const bDate = new Date(b.timestamp);
            if (bDate < start || bDate > end) return;

            if (!bmiUserMap[b.username]) {
                bmiUserMap[b.username] = { start: b, end: b };
            } else {
                if (new Date(b.timestamp) < new Date(bmiUserMap[b.username].start.timestamp)) {
                    bmiUserMap[b.username].start = b;
                }
                if (new Date(b.timestamp) > new Date(bmiUserMap[b.username].end.timestamp)) {
                    bmiUserMap[b.username].end = b;
                }
            }
        });

        const migrationFlow: string[] = [];
        Object.values(bmiUserMap).forEach(({ start, end }) => {
            if (start && end && start !== end) {
                const startScore = getBmiScoreForFlow(start.category);
                const endScore = getBmiScoreForFlow(end.category);
                if (startScore !== -1 && endScore !== -1) {
                    if (endScore < startScore && startScore > 1) {
                        migrationFlow.push(`${start.category} -> ${end.category}`);
                    }
                }
            }
        });

        const migrationFlows = migrationFlow.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { literacyStats, migrationFlows, clinicalTableData, evaluationStats };

    }, [profiles, quizHistory, bmiHistory, groupMembers, clinicalHistory, evaluationHistory, filterOrg, filterGroup, startDate, endDate]);

    const satLabels: Record<string, string> = {
        usability: 'ความง่ายในการใช้งาน',
        features: 'ความครบถ้วนของฟีเจอร์',
        benefit: 'ประโยชน์ที่ได้รับ',
        overall: 'ความพึงพอใจโดยรวม',
        recommend: 'การแนะนำบอกต่อ'
    };

    const outLabels: Record<string, string> = {
        nutrition: 'พฤติกรรมการกิน',
        activity: 'การเคลื่อนไหว',
        sleep: 'คุณภาพการนอน',
        stress: 'การจัดการความเครียด',
        risk: 'การลดพฤติกรรมเสี่ยง',
        overall: 'สุขภาพโดยรวม'
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">Outcomes</span>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">ผลลัพธ์และการเปลี่ยนแปลง (Impact Analysis)</h2>
            </div>

            {/* 1. Clinical Outcomes Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BeakerIcon className="w-6 h-6 text-orange-500" />
                        1. ผลลัพธ์ทางคลินิกเฉลี่ย (Average Clinical Progression)
                    </h3>
                </div>

                {/* Methodology Explanation */}
                <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                        <InformationCircleIcon className="w-4 h-4" /> วิธีการคำนวณ (Methodology):
                    </h4>
                    <ul className="text-xs text-indigo-600 dark:text-indigo-300 list-disc pl-5 space-y-1">
                        <li><strong>การประเมินผล:</strong> เปรียบเทียบค่า <em>"ครั้งแรกสุด (First)"</em> กับ <em>"ครั้งล่าสุด (Latest)"</em> ของผู้ใช้งานแต่ละคนที่มีข้อมูลอย่างน้อย 2 ครั้ง</li>
                        <li><strong>ดีขึ้น (Improved):</strong> ค่ามีการเปลี่ยนแปลงไปในทิศทางที่ดีขึ้นตามเป้าหมายทางการแพทย์</li>
                        <li><strong>แย่ลง (Worsened):</strong> ค่ามีการเปลี่ยนแปลงไปในทิศทางตรงกันข้ามกับเป้าหมาย</li>
                    </ul>
                </div>

                <div className="overflow-x-auto bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 rounded-tl-xl w-1/5 whitespace-nowrap">ตัวชี้วัด (Indicator)</th>
                                <th className="p-4 text-center">เฉลี่ยเริ่มต้น (Avg Start)</th>
                                <th className="p-4 text-center">เฉลี่ยล่าสุด (Avg Latest)</th>
                                <th className="p-4 text-center bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300">ดีขึ้น (Improved)</th>
                                <th className="p-4 text-center bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300">แย่ลง (Worsened)</th>
                                <th className="p-4 text-center text-gray-500">คงที่ (Same)</th>
                                <th className="p-4 text-center text-blue-600 dark:text-blue-400 rounded-tr-xl">เป้าหมาย (Goal)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {outcomes.clinicalTableData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.label}</td>
                                    <td className="p-4 text-center"><div className="font-bold text-gray-800 dark:text-white">{row.baseline.val}</div><div className="text-[9px] text-gray-400">N={row.baseline.n}</div></td>
                                    <td className="p-4 text-center"><div className={`font-bold ${row.latest.val !== '-' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>{row.latest.val}</div><div className="text-[9px] text-gray-400">N={row.latest.n}</div></td>
                                    <td className="p-4 text-center bg-green-50/50 dark:bg-green-900/10"><div className="font-bold text-green-600 dark:text-green-400">{row.comparison.improved.n}</div><div className="text-[9px] text-green-500">({row.comparison.improved.pct}%)</div></td>
                                    <td className="p-4 text-center bg-red-50/50 dark:bg-red-900/10"><div className="font-bold text-red-600 dark:text-red-400">{row.comparison.worsened.n}</div><div className="text-[9px] text-red-500">({row.comparison.worsened.pct}%)</div></td>
                                    <td className="p-4 text-center"><div className="font-bold text-gray-500 dark:text-gray-400">{row.comparison.same.n}</div><div className="text-[9px] text-gray-400">({row.comparison.same.pct}%)</div></td>
                                    <td className="p-4 text-center"><span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold border border-blue-200 dark:border-blue-800 whitespace-nowrap">{row.goal}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Health Literacy Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-teal-500" />
                        2. ความรอบรู้ทางสุขภาพ (Health Literacy Outcome)
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Pairs N = {outcomes.literacyStats.totalPairs}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase mb-1">Knowledge Improvement</p>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">คะแนนเฉลี่ยที่เพิ่มขึ้น</p>
                        </div>
                        <span className="text-3xl font-black text-gray-800 dark:text-white">+{outcomes.literacyStats.avgImprovement}%</span>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Improvement Rate</p>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">อัตราผู้ที่มีคะแนนดีขึ้น</p>
                        </div>
                        <span className="text-3xl font-black text-gray-800 dark:text-white">{outcomes.literacyStats.improvedPct.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="overflow-x-auto bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4 rounded-tl-xl">ตัวชี้วัด (Metric)</th>
                                <th className="p-4 text-center text-blue-600 dark:text-blue-400">Pre-test</th>
                                <th className="p-4 text-center text-teal-600 dark:text-teal-400 rounded-tr-xl">Post-test</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">คะแนนเฉลี่ย (Mean Score)</td>
                                <td className="p-4 text-center font-mono text-gray-600 dark:text-gray-300">{outcomes.literacyStats.detailed.pre.avg.toFixed(2)}</td>
                                <td className="p-4 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{outcomes.literacyStats.detailed.post.avg.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">ผ่านเกณฑ์ (≥ 80%)</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-300">{outcomes.literacyStats.detailed.pre.passPct.toFixed(1)}%</td>
                                <td className="p-4 text-center font-bold text-teal-600 dark:text-teal-400">{outcomes.literacyStats.detailed.post.passPct.toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">คะแนนสูงสุด (Max Score)</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-300">{outcomes.literacyStats.detailed.pre.max.toFixed(0)}</td>
                                <td className="p-4 text-center font-bold text-teal-600 dark:text-teal-400">{outcomes.literacyStats.detailed.post.max.toFixed(0)}</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">คะแนนต่ำสุด (Min Score)</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-300">{outcomes.literacyStats.detailed.pre.min.toFixed(0)}</td>
                                <td className="p-4 text-center font-bold text-teal-600 dark:text-teal-400">{outcomes.literacyStats.detailed.post.min.toFixed(0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. BMI Migration Flow */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <BoltIcon className="w-4 h-4 text-yellow-500" />
                    3. การเคลื่อนย้ายกลุ่ม BMI (Migration Flow)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(outcomes.migrationFlows).length > 0 ? (
                        Object.entries(outcomes.migrationFlows)
                            .sort(([,a]: any, [,b]: any) => (b as number) - (a as number))
                            .map(([flow, count]) => (
                            <div key={flow} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-green-500">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{flow}</span>
                                <span className="text-xs font-black text-green-600 dark:text-green-400">+{count} คน</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-4 col-span-full">ยังไม่มีข้อมูลการเปลี่ยนแปลงกลุ่ม BMI ในช่วงเวลานี้</p>
                    )}
                </div>
            </div>

            {/* 4. User Evaluation Analysis (NEW SECTION) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <HeartIcon className="w-6 h-6 text-pink-500" />
                        4. ผลประเมินความพึงพอใจและผลลัพธ์ (User Evaluation)
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        N = {outcomes.evaluationStats.totalEvals}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 4.1 Satisfaction Scores */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-600">
                            ความพึงพอใจ (Satisfaction Score 1-5)
                        </h4>
                        <div className="space-y-3">
                            {outcomes.evaluationStats.satAverages.map((item) => (
                                <div key={item.key} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <span>{satLabels[item.key] || item.key}</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.avg} / 5.00</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-indigo-500 h-2 rounded-full" 
                                            style={{ width: `${(parseFloat(item.avg as string) / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4.2 Self-reported Outcomes */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b pb-2 dark:border-gray-600">
                            ผลลัพธ์สุขภาพที่รายงานเอง (Self-Reported)
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="text-gray-500 dark:text-gray-400 border-b dark:border-gray-600">
                                    <tr>
                                        <th className="py-2">ด้าน (Aspect)</th>
                                        <th className="py-2 text-center text-green-600">ดีขึ้น</th>
                                        <th className="py-2 text-center text-gray-500">เท่าเดิม</th>
                                        <th className="py-2 text-center text-red-500">แย่ลง</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {outcomes.evaluationStats.outPercentages.map((item) => (
                                        <tr key={item.key}>
                                            <td className="py-2 font-medium text-gray-700 dark:text-gray-300">{outLabels[item.key] || item.key}</td>
                                            <td className="py-2 text-center font-bold text-green-600">{item.improved}%</td>
                                            <td className="py-2 text-center text-gray-500">{item.same}%</td>
                                            <td className="py-2 text-center text-red-500">{item.worse}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... DataManagementTab Component (unchanged) ...
const DataManagementTab: React.FC<{ adminData: AllAdminData | null }> = ({ adminData }) => {
    // ... [Same as before] ...
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTable, setActiveTable] = useState('profiles');
    const { scriptUrl, currentUser } = useContext(AppContext);

    const isSuperAdmin = currentUser?.organization === 'all';

    // Available tables configuration
    const tables = [
        { id: 'profiles', label: 'ผู้ใช้งาน (Users)' },
        { id: 'loginLogs', label: 'ประวัติการเข้าสู่ระบบ' },
        { id: 'bmiHistory', label: 'ประวัติ BMI' },
        { id: 'foodHistory', label: 'ประวัติอาหาร' },
        { id: 'activityHistory', label: 'ประวัติกิจกรรม' },
        { id: 'evaluationHistory', label: 'แบบประเมิน' },
        { id: 'groups', label: 'กลุ่ม (Groups)' },
    ];

    const currentData = useMemo(() => {
        if (!adminData) return [];
        // @ts-ignore
        return adminData[activeTable] || [];
    }, [adminData, activeTable]);

    const filteredData = useMemo(() => {
        let data = currentData;

        // --- Role-based Filtering ---
        if (!isSuperAdmin && currentUser) {
            const myOrg = currentUser.organization;
            
            if (activeTable === 'profiles') {
                data = data.filter((r: any) => r.organization === myOrg);
            } else if (activeTable === 'groups') {
                // Filter groups created by this admin
                data = data.filter((r: any) => r.AdminUsername === currentUser.username);
            } else if (activeTable === 'loginLogs') {
                data = data.filter((r: any) => r.organization === myOrg);
            } else {
                // For history logs, filter by users in my organization
                // Need list of my users
                // @ts-ignore
                const myUsers = new Set((adminData?.profiles || [])
                    .filter((p: any) => p.organization === myOrg)
                    .map((p: any) => p.username));
                
                data = data.filter((r: any) => r.username && myUsers.has(r.username));
            }
        }

        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter((row: any) => 
            Object.values(row).some(val => String(val).toLowerCase().includes(lowerTerm))
        );
    }, [currentData, searchTerm, isSuperAdmin, currentUser, activeTable, adminData]);

    const columns = useMemo(() => {
        if (filteredData.length === 0) return [];
        return Object.keys(filteredData[0]);
    }, [filteredData]);

    const handleResetUser = async (username: string) => {
        if (!window.confirm(`ต้องการรีเซ็ตข้อมูลผู้ใช้ ${username} ใช่หรือไม่?`)) return;
        if (scriptUrl && currentUser) {
            await resetUserData(scriptUrl, currentUser, username);
            alert('รีเซ็ตข้อมูลเรียบร้อย');
        }
    };

    if (!adminData) return <div className="text-center p-8 text-gray-500">ไม่พบข้อมูล (No Data)</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                {/* Table Selector */}
                <div className="w-full md:w-auto">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">เลือกตารางข้อมูล</label>
                    <div className="flex flex-wrap gap-2">
                        {tables.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTable(t.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    activeTable === t.id 
                                    ? 'bg-teal-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="w-full md:w-64">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">ค้นหาในตาราง</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            placeholder="ค้นหา..." 
                            className="w-full p-2.5 pl-9 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-white text-sm"
                        />
                        <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white font-bold uppercase text-xs">
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="p-3 whitespace-nowrap">{col}</th>
                                ))}
                                {activeTable === 'profiles' && <th className="p-3">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredData.slice(0, 100).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {columns.map(col => (
                                        <td key={col} className="p-3 whitespace-nowrap max-w-xs truncate">
                                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                        </td>
                                    ))}
                                    {activeTable === 'profiles' && (
                                        <td className="p-3">
                                            <button 
                                                onClick={() => handleResetUser(row.username)} 
                                                className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded"
                                            >
                                                Reset
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + (activeTable === 'profiles' ? 1 : 0)} className="p-8 text-center text-gray-400">
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    แสดงสูงสุด 100 รายการล่าสุด (จากทั้งหมด {filteredData.length} รายการ)
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { scriptUrl, currentUser, organizations, setActiveView } = useContext(AppContext);
    const [adminData, setAdminData] = useState<AllAdminData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'outcomes' | 'data'>('overview');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const isSuperAdmin = currentUser?.organization === 'all';

    // Filters - Initialize based on role
    const [selectedOrg, setSelectedOrg] = useState(isSuperAdmin ? 'all' : (currentUser?.organization || 'all'));
    const [selectedGroup, setSelectedGroup] = useState('all');
    
    // Default Date Range: Last 30 Days
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Update filters if currentUser changes
    useEffect(() => {
        if (currentUser) {
             const isSuper = currentUser.organization === 'all';
             if (!isSuper) {
                 setSelectedOrg(currentUser.organization || 'all');
             }
        }
    }, [currentUser]);

    const loadData = () => {
        if (scriptUrl && currentUser?.adminSecret) {
            setLoadingData(true);
            setFetchError(null);
            fetchAllAdminDataFromSheet(scriptUrl, currentUser.adminSecret).then(data => {
                if (data) {
                    setAdminData(data);
                } else {
                    setFetchError("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Connection Failed)");
                }
                setLoadingData(false);
            });
        }
    };

    useEffect(() => {
        loadData();
    }, [scriptUrl, currentUser]);

    // Filter Dropdowns
    const availableOrgs = useMemo(() => {
        if (isSuperAdmin) return organizations;
        return organizations.filter(o => o.id === currentUser?.organization);
    }, [organizations, isSuperAdmin, currentUser]);

    const availableGroups = useMemo(() => {
        const groups = adminData?.groups || [];
        if (isSuperAdmin) return groups;
        return groups.filter((g: any) => g.AdminUsername === currentUser?.username);
    }, [adminData, isSuperAdmin, currentUser]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('menu')} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="bg-gray-800 dark:bg-white text-white dark:text-gray-800 p-2 rounded-lg"><SquaresIcon className="w-6 h-6" /></span>
                    Research Dashboard
                </h1>
            </div>
            
            <div className="flex justify-end text-xs text-gray-500 mb-4">
                <div className="text-right">
                    <p className="font-bold">{currentUser?.displayName}</p>
                    <p>{currentUser?.organization === 'all' ? 'Super Admin' : currentUser?.organization}</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto mb-4">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ChartBarIcon className="w-4 h-4" /> ภาพรวมวิจัย
                </button>
                <button 
                    onClick={() => setActiveTab('outcomes')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'outcomes' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <TrophyIcon className="w-4 h-4" /> ผลลัพธ์
                </button>
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <SquaresIcon className="w-4 h-4" /> ฐานข้อมูลดิบ
                </button>
            </div>

            {/* Global Filter Bar (Show on Overview & Outcomes) */}
            {(activeTab === 'overview' || activeTab === 'outcomes') && (
                <FilterBar 
                    orgs={availableOrgs}
                    groups={availableGroups}
                    selectedOrg={selectedOrg} 
                    setSelectedOrg={setSelectedOrg}
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    onRefresh={loadData}
                />
            )}

            {/* Content Area */}
            {fetchError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">เกิดข้อผิดพลาด</h3>
                    <p className="text-gray-500 mb-6">{fetchError}</p>
                    <button onClick={loadData} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors">ลองใหม่อีกครั้ง</button>
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && (
                        loadingData ? <Spinner /> : <MacroOverview adminData={adminData} filterOrg={selectedOrg} filterGroup={selectedGroup} startDate={startDate} endDate={endDate} />
                    )}

                    {activeTab === 'outcomes' && (
                        loadingData ? <Spinner /> : <OutcomeAnalysis adminData={adminData} filterOrg={selectedOrg} filterGroup={selectedGroup} startDate={startDate} endDate={endDate} />
                    )}

                    {activeTab === 'data' && (
                        loadingData ? <Spinner /> : <DataManagementTab adminData={adminData} />
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
