
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchAllAdminDataFromSheet, resetUserData, AllAdminData } from '../services/googleSheetService';
import { ChartBarIcon, UserGroupIcon, FireIcon, HeartIcon, ScaleIcon, SquaresIcon, ClipboardListIcon, ExclamationTriangleIcon, SearchIcon, ArrowLeftIcon, ClipboardCheckIcon, BoltIcon, TrophyIcon, StarIcon, BookOpenIcon } from './icons';

// --- Helper Components ---

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-12 h-12 border-4 border-t-teal-500 border-gray-200 dark:border-gray-600 rounded-full animate-spin"></div>
        <p className="text-teal-600 dark:text-teal-400 font-medium">กำลังประมวลผลข้อมูล...</p>
    </div>
);

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
                            {groups && groups.map((g, i) => <option key={i} value={g.GroupId || g.id}>{g.Name || g.name}</option>)}
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

const StatBar: React.FC<{ label: string, count: number, total: number, color: string }> = ({ label, count, total, color }) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
                <span className="text-gray-800 dark:text-white font-bold">{count} ({percent.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

// --- Macro View Logic ---

const MacroOverview: React.FC<{ 
    adminData: AllAdminData | null, 
    filterOrg: string, 
    filterGroup: string,
    startDate: string, 
    endDate: string 
}> = ({ adminData, filterOrg, filterGroup, startDate, endDate }) => {
    if (!adminData) return <div className="text-center py-10 text-gray-400">No Data Loaded</div>;

    const { profiles, bmiHistory, groupMembers } = adminData as any;

    const stats = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const validUsernamesInGroup = new Set();
        if (filterGroup && filterGroup !== 'all' && groupMembers) {
            groupMembers.forEach((m: any) => {
                if (m.GroupId === filterGroup || m.groupId === filterGroup) {
                    validUsernamesInGroup.add(m.Username || m.username);
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
        
        // Waist & WHR separated by gender
        let waistRiskDetail = { male: 0, female: 0 }; // Male > 90, Female > 80
        let whrRiskDetail = { male: 0, female: 0 }; // Male >= 0.90, Female >= 0.85
        
        let ncdCount = 0; // Total people with NCDs
        let ncdBreakdown: Record<string, number> = {}; // Breakdown by disease type
        
        let ageGroups = { 'ต่ำกว่า 18': 0, '18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0, 'ไม่ระบุ': 0 };
        let activeUsersCount = 0;

        uniqueUsers.forEach((u: any) => {
            // 1. Gender Logic
            const sex = u.gender ? u.gender.toLowerCase() : 'unknown';
            if (sex === 'male') gender.male++;
            else if (sex === 'female') gender.female++;
            else gender.unspecified++;

            // 2. Age Logic
            const age = parseInt(u.age);
            if (isNaN(age) || age <= 0) ageGroups['ไม่ระบุ']++;
            else if (age < 18) ageGroups['ต่ำกว่า 18']++;
            else if (age >= 18 && age <= 29) ageGroups['18-29']++;
            else if (age >= 30 && age <= 39) ageGroups['30-39']++;
            else if (age >= 40 && age <= 49) ageGroups['40-49']++;
            else if (age >= 50 && age <= 59) ageGroups['50-59']++;
            else ageGroups['60+']++;

            // 3. BMI Logic
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

            // 4. Waist & WHR Risk Logic (Gender Specific)
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

            // 5. NCDs Breakdown
            const condition = u.healthCondition;
            if (condition && condition !== 'ไม่มีโรคประจำตัว' && condition !== 'N/A' && condition !== '-') {
                ncdCount++;
                // Sometimes condition might be comma separated if multiple selected, but assuming single for now based on UI
                // Standardize keys
                const disease = condition.trim();
                ncdBreakdown[disease] = (ncdBreakdown[disease] || 0) + 1;
            }

            // Check Activity Log overlap
            const userLogs = (bmiHistory || []).filter((b: any) => b.username === u.username);
            if (userLogs.length > 0) activeUsersCount++;
        });

        return { 
            totalN, 
            gender, 
            bmiStats, 
            waistRiskDetail, 
            whrRiskDetail, 
            ncdCount, 
            ncdBreakdown, 
            ageGroups, 
            activeUsersCount
        };

    }, [profiles, bmiHistory, groupMembers, filterOrg, filterGroup, startDate, endDate]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded dark:bg-teal-900 dark:text-teal-300">Macro View</span>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">สถิติและผลลัพธ์สุขภาพ (Statistics & Outcomes)</h2>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    title="กลุ่มตัวอย่าง (N)" 
                    value={stats.totalN.toLocaleString()} 
                    subValue={`ชาย ${stats.gender.male} | หญิง ${stats.gender.female}`} 
                    icon={<UserGroupIcon />} 
                    color="text-blue-600" 
                />
                <KPICard 
                    title="กลุ่มเสี่ยงโรค (NCDs)" 
                    value={stats.ncdCount.toLocaleString()} 
                    subValue={`คิดเป็น ${stats.totalN > 0 ? ((stats.ncdCount/stats.totalN)*100).toFixed(1) : 0}%`} 
                    icon={<HeartIcon />} 
                    color="text-rose-500" 
                />
                <KPICard 
                    title="เสี่ยงรอบเอว (รวม)" 
                    value={(stats.waistRiskDetail.male + stats.waistRiskDetail.female).toLocaleString()} 
                    subValue={`ชาย ${stats.waistRiskDetail.male} | หญิง ${stats.waistRiskDetail.female}`} 
                    icon={<ScaleIcon />} 
                    color="text-orange-500" 
                />
                <KPICard 
                    title="เสี่ยง WHR (รวม)" 
                    value={(stats.whrRiskDetail.male + stats.whrRiskDetail.female).toLocaleString()} 
                    subValue={`อัตราส่วนสะโพกเกินเกณฑ์`} 
                    icon={<ExclamationTriangleIcon />} 
                    color="text-red-600" 
                />
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Demographics (Gender & Age) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5 text-blue-500"/> 
                            ประชากรศาสตร์ (Demographics)
                        </h3>
                        <div className="space-y-1">
                            <StatBar label="ชาย (Male)" count={stats.gender.male} total={stats.totalN} color="bg-blue-500" />
                            <StatBar label="หญิง (Female)" count={stats.gender.female} total={stats.totalN} color="bg-pink-500" />
                            <StatBar label="ไม่ระบุ (Unspecified)" count={stats.gender.unspecified} total={stats.totalN} color="bg-gray-400" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase">ช่วงอายุ (Age Groups)</h4>
                        <div className="space-y-2">
                            {Object.entries(stats.ageGroups).map(([range, count]) => {
                                if (count === 0) return null;
                                return (
                                    <div key={range} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{range} ปี</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{count} คน</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. Health Status (BMI & NCDs) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <ScaleIcon className="w-5 h-5 text-teal-500"/> 
                            ภาวะโภชนาการ (BMI)
                        </h3>
                        <div className="space-y-1">
                            <StatBar label="ผอม (Underweight)" count={stats.bmiStats.under} total={stats.totalN} color="bg-blue-400" />
                            <StatBar label="สมส่วน (Normal)" count={stats.bmiStats.normal} total={stats.totalN} color="bg-green-500" />
                            <StatBar label="ท้วม (Overweight)" count={stats.bmiStats.over} total={stats.totalN} color="bg-yellow-400" />
                            <StatBar label="โรคอ้วน (Obese)" count={stats.bmiStats.obese} total={stats.totalN} color="bg-red-500" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase">โรคประจำตัว (NCDs Breakdown)</h4>
                        {Object.keys(stats.ncdBreakdown).length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {Object.entries(stats.ncdBreakdown)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([disease, count]) => (
                                    <div key={disease} className="flex items-center justify-between p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                        <span className="text-xs font-medium text-rose-800 dark:text-rose-200 truncate max-w-[70%]">{disease}</span>
                                        <div className="text-xs font-bold text-rose-600 dark:text-rose-300">
                                            {count} <span className="opacity-70 text-[9px]">({((count/stats.totalN)*100).toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-2">ไม่มีข้อมูลกลุ่มเสี่ยง</p>
                        )}
                    </div>
                </div>

                {/* 3. Metabolic Risk (Waist & WHR) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 text-indigo-500"/> 
                        ความเสี่ยงเมตาบอลิก (Metabolic Risk)
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-2">รอบเอวเกินเกณฑ์ (Waist Risk)</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">ชาย (&gt;90 ซม.)</span>
                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                        {stats.waistRiskDetail.male} <span className="text-[10px] opacity-70">({stats.gender.male > 0 ? ((stats.waistRiskDetail.male/stats.gender.male)*100).toFixed(1) : 0}%)</span>
                                    </span>
                                </div>
                                <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-1.5">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.gender.male > 0 ? (stats.waistRiskDetail.male/stats.gender.male)*100 : 0}%` }}></div>
                                </div>

                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">หญิง (&gt;80 ซม.)</span>
                                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                                        {stats.waistRiskDetail.female} <span className="text-[10px] opacity-70">({stats.gender.female > 0 ? ((stats.waistRiskDetail.female/stats.gender.female)*100).toFixed(1) : 0}%)</span>
                                    </span>
                                </div>
                                <div className="w-full bg-orange-200 dark:bg-orange-900 rounded-full h-1.5">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.gender.female > 0 ? (stats.waistRiskDetail.female/stats.gender.female)*100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-2">WHR เกินเกณฑ์ (Waist-Hip Ratio)</p>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">ชาย (&ge; 0.90)</span>
                                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                                        {stats.whrRiskDetail.male} <span className="text-[10px] opacity-70">({stats.gender.male > 0 ? ((stats.whrRiskDetail.male/stats.gender.male)*100).toFixed(1) : 0}%)</span>
                                    </span>
                                </div>
                                <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-1.5">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.gender.male > 0 ? (stats.whrRiskDetail.male/stats.gender.male)*100 : 0}%` }}></div>
                                </div>

                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-300">หญิง (&ge; 0.85)</span>
                                    <span className="text-sm font-bold text-red-700 dark:text-red-300">
                                        {stats.whrRiskDetail.female} <span className="text-[10px] opacity-70">({stats.gender.female > 0 ? ((stats.whrRiskDetail.female/stats.gender.female)*100).toFixed(1) : 0}%)</span>
                                    </span>
                                </div>
                                <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-1.5">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.gender.female > 0 ? (stats.whrRiskDetail.female/stats.gender.female)*100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Outcome Analysis Component (New) ---

const OutcomeAnalysis: React.FC<{ 
    adminData: AllAdminData | null, 
    filterOrg: string, 
    filterGroup: string,
    startDate: string, 
    endDate: string 
}> = ({ adminData, filterOrg, filterGroup, startDate, endDate }) => {
    if (!adminData) return <div className="text-center py-10 text-gray-400">No Data Loaded</div>;

    const { profiles, bmiHistory, quizHistory, groupMembers } = adminData as any;

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

        // 2. Health Literacy Outcome (Separated Pre & Post)
        // Store scores for calculation
        const preScores: number[] = [];
        const postScores: number[] = [];
        
        // Also keep Paired logic for Improvement Rate (still useful)
        const userQuizMap: Record<string, { pre: number | null, post: number | null }> = {};

        (quizHistory || []).forEach((q: any) => {
            if (!validUsernames.has(q.username)) return;
            const qDate = new Date(q.date);
            if (qDate < start || qDate > end) return;

            // Independent Arrays for detailed stats
            if (q.type === 'pre-test') preScores.push(q.score);
            else if (q.type === 'post-test') postScores.push(q.score);

            // Paired Mapping
            if (!userQuizMap[q.username]) userQuizMap[q.username] = { pre: null, post: null };
            if (q.type === 'pre-test') userQuizMap[q.username].pre = q.score;
            else if (q.type === 'post-test') userQuizMap[q.username].post = q.score;
        });

        // Calculate Paired Improvement Stats
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

        // Helper to calculate Stats (N, Pass, %, Avg, Max, Min)
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

        const detailedStats = {
            pre: calculateStats(preScores),
            post: calculateStats(postScores)
        };

        const literacyStats = {
            totalPairs,
            avgImprovement: totalPairs > 0 ? (totalImprovement / totalPairs).toFixed(1) : 0,
            improvedPct: totalPairs > 0 ? (countImproved / totalPairs) * 100 : 0,
            detailed: detailedStats
        };

        // 3. Clinical Outcome (BMI Migration) - Same as before
        const getBmiScore = (cat: string) => {
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

        let successMigration = 0;
        let maintainedNormal = 0;
        let totalBmiUsers = 0;
        const migrationFlow: string[] = [];

        Object.values(bmiUserMap).forEach(({ start, end }) => {
            if (start && end && start !== end) {
                const startScore = getBmiScore(start.category);
                const endScore = getBmiScore(end.category);
                if (startScore !== -1 && endScore !== -1) {
                    totalBmiUsers++;
                    if (endScore < startScore && startScore > 1) {
                        successMigration++;
                        migrationFlow.push(`${start.category} -> ${end.category}`);
                    } else if (startScore === 1 && endScore === 1) {
                        maintainedNormal++;
                    }
                }
            }
        });

        const bmiStats = {
            totalUsers: totalBmiUsers,
            successRate: totalBmiUsers > 0 ? ((successMigration + maintainedNormal) / totalBmiUsers) * 100 : 0,
            improvedCount: successMigration,
            maintainedCount: maintainedNormal,
            flows: migrationFlow.reduce((acc, curr) => {
                acc[curr] = (acc[curr] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return { literacyStats, bmiStats };

    }, [profiles, quizHistory, bmiHistory, groupMembers, filterOrg, filterGroup, startDate, endDate]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">Outcomes</span>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">ผลลัพธ์และการเปลี่ยนแปลง (Impact Analysis)</h2>
            </div>

            {/* 1. Health Literacy Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-teal-500" />
                        ความรอบรู้ทางสุขภาพ (Health Literacy Outcome)
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Pairs N = {outcomes.literacyStats.totalPairs}
                    </span>
                </div>

                {/* Summary Cards */}
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

                {/* Detailed Comparison Table */}
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
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">จำนวนผู้ทำแบบทดสอบ (N)</td>
                                <td className="p-4 text-center font-bold text-gray-800 dark:text-white">{outcomes.literacyStats.detailed.pre.n}</td>
                                <td className="p-4 text-center font-bold text-gray-800 dark:text-white">{outcomes.literacyStats.detailed.post.n}</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">จำนวนผู้ที่ผ่านเกณฑ์ (≥ 80%)</td>
                                <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                                    {outcomes.literacyStats.detailed.pre.pass} 
                                    <span className="text-xs ml-1 text-gray-400">({outcomes.literacyStats.detailed.pre.passPct.toFixed(1)}%)</span>
                                </td>
                                <td className="p-4 text-center font-bold text-teal-600 dark:text-teal-400">
                                    {outcomes.literacyStats.detailed.post.pass} 
                                    <span className="text-xs ml-1">({outcomes.literacyStats.detailed.post.passPct.toFixed(1)}%)</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">คะแนนเฉลี่ย (Mean Score)</td>
                                <td className="p-4 text-center font-mono text-gray-600 dark:text-gray-300">{outcomes.literacyStats.detailed.pre.avg.toFixed(2)}</td>
                                <td className="p-4 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{outcomes.literacyStats.detailed.post.avg.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium text-gray-700 dark:text-gray-300">คะแนนสูงสุด / ต่ำสุด (Max/Min)</td>
                                <td className="p-4 text-center text-xs text-gray-500">
                                    Max: {outcomes.literacyStats.detailed.pre.max} / Min: {outcomes.literacyStats.detailed.pre.min}
                                </td>
                                <td className="p-4 text-center text-xs text-gray-500">
                                    Max: {outcomes.literacyStats.detailed.post.max} / Min: {outcomes.literacyStats.detailed.post.min}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Clinical Outcomes Section (BMI) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ScaleIcon className="w-6 h-6 text-orange-500" />
                        ผลลัพธ์ทางคลินิก: BMI Migration
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        N = {outcomes.bmiStats.totalUsers} คน (ที่มีการเปลี่ยนแปลง)
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Summary KPIs */}
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 text-center">
                                <TrophyIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-3xl font-black text-gray-800 dark:text-white">{outcomes.bmiStats.successRate.toFixed(1)}%</p>
                                <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase mt-1">Success Rate</p>
                                <p className="text-[10px] text-gray-500 mt-1">ลดระดับความเสี่ยง หรือ รักษาสมส่วน</p>
                            </div>
                            <div className="flex-1 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 text-center flex flex-col justify-center">
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{outcomes.bmiStats.improvedCount}</p>
                                <p className="text-xs text-gray-500">คน ที่ลดระดับความอ้วนได้</p>
                                <div className="h-[1px] bg-orange-200 w-full my-2"></div>
                                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{outcomes.bmiStats.maintainedCount}</p>
                                <p className="text-xs text-gray-500">คน ที่รักษารูปร่างสมส่วนไว้ได้</p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 italic">
                            * Success Rate คำนวณจากผู้ที่ลดระดับ BMI ลงมาสู่เกณฑ์ที่ดีขึ้น (เช่น อ้วน &rarr; ท้วม) หรือผู้ที่รักษาระดับสมส่วนไว้ได้
                        </div>
                    </div>

                    {/* Right: Migration Flow List */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            <BoltIcon className="w-4 h-4 text-yellow-500" />
                            การเคลื่อนย้ายกลุ่ม (Migration Flow)
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {Object.entries(outcomes.bmiStats.flows).length > 0 ? (
                                Object.entries(outcomes.bmiStats.flows)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([flow, count]) => (
                                    <div key={flow} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-green-500">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{flow}</span>
                                        <span className="text-xs font-black text-green-600 dark:text-green-400">+{count} คน</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีข้อมูลการเปลี่ยนแปลงกลุ่ม BMI ในช่วงเวลานี้</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DataManagementTab: React.FC<{ adminData: AllAdminData | null }> = ({ adminData }) => {
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

// --- Main Dashboard Container ---

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
                 // Default group stays 'all' (meaning all my groups)
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
