
import { UserProfile, BMIHistoryEntry, TDEEHistoryEntry, FoodHistoryEntry, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User } from '../types';

export interface AllAdminData {
    profiles: any[];
    bmiHistory: any[];
    tdeeHistory: any[];
    foodHistory: any[];
    plannerHistory: any[];
    waterHistory: any[];
    calorieHistory: any[];
    activityHistory: any[];
    sleepHistory: any[];
    moodHistory: any[];
    habitHistory: any[];
    socialHistory: any[];
    evaluationHistory: any[];
    quizHistory: any[];
    loginLogs: any[];
}

interface AllData {
    profile: UserProfile | null;
    bmiHistory: BMIHistoryEntry[];
    tdeeHistory: TDEEHistoryEntry[];
    foodHistory: FoodHistoryEntry[];
    plannerHistory: PlannerHistoryEntry[];
    waterHistory: WaterHistoryEntry[];
    calorieHistory: CalorieHistoryEntry[];
    activityHistory: ActivityHistoryEntry[];
    sleepHistory: SleepEntry[];
    moodHistory: MoodEntry[];
    habitHistory: HabitEntry[];
    socialHistory: SocialEntry[];
    evaluationHistory: EvaluationEntry[];
    quizHistory: QuizEntry[];
}

export const fetchOrganizations = async (scriptUrl: string): Promise<any[]> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return [];
    try {
        const urlWithParams = `${scriptUrl}?action=getConfig&t=${Date.now()}`;
        const response = await fetch(urlWithParams, { 
            method: 'GET', 
            redirect: 'follow', 
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            return [];
        }
        
        return result.status === 'success' && result.data && result.data.organizations ? result.data.organizations : [];
    } catch (error) {
        console.warn("Fetch Config Warning:", error);
        return [];
    }
}

export const fetchAllDataFromSheet = async (scriptUrl: string, user: User): Promise<AllData | null> => {
    if (!scriptUrl || !user || !scriptUrl.startsWith('http')) return null;
    try {
        const urlWithParams = `${scriptUrl}?username=${encodeURIComponent(user.username)}&t=${Date.now()}`;
        const response = await fetch(urlWithParams, { 
            method: 'GET', 
            redirect: 'follow'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success') {
             const data = result.data;
             
             let parsedBadges = [];
             try {
                parsedBadges = data.profile && data.profile.badges ? (typeof data.profile.badges === 'string' ? JSON.parse(data.profile.badges) : data.profile.badges) : ['novice'];
             } catch (e) {
                parsedBadges = ['novice'];
             }

             const sanitizedProfile = data.profile ? {
                ...data.profile,
                age: String(data.profile.age || ''),
                weight: String(data.profile.weight || ''),
                height: String(data.profile.height || ''),
                waist: String(data.profile.waist || ''),
                hip: String(data.profile.hip || ''),
                activityLevel: Number(data.profile.activityLevel || 1.2),
                healthCondition: String(data.profile.healthCondition || 'ไม่มีโรคประจำตัว'),
                xp: Number(data.profile.xp || 0),
                level: Number(data.profile.level || 1),
                badges: parsedBadges,
                organization: String(data.profile.organization || 'general'),
                pdpaAccepted: String(data.profile.pdpaAccepted).toLowerCase() === 'true',
            } : null;

            const sortByDateDesc = (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime();

            return {
                profile: sanitizedProfile,
                bmiHistory: (data.bmiHistory || []).sort(sortByDateDesc),
                tdeeHistory: (data.tdeeHistory || []).sort(sortByDateDesc),
                foodHistory: (data.foodHistory || []).sort(sortByDateDesc),
                plannerHistory: (data.plannerHistory || []).sort(sortByDateDesc),
                waterHistory: (data.waterHistory || []).sort(sortByDateDesc),
                calorieHistory: (data.calorieHistory || []).sort(sortByDateDesc),
                activityHistory: (data.activityHistory || []).sort(sortByDateDesc),
                sleepHistory: (data.sleepHistory || []).sort(sortByDateDesc),
                moodHistory: (data.moodHistory || []).sort(sortByDateDesc),
                habitHistory: (data.habitHistory || []).sort(sortByDateDesc),
                socialHistory: (data.socialHistory || []).sort(sortByDateDesc),
                evaluationHistory: (data.evaluationHistory || []).sort(sortByDateDesc),
                quizHistory: (data.quizHistory || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            };
        }
        return null;
    } catch (error: any) {
        console.error("Fetch Data Error:", error);
        return null;
    }
};

export const saveDataToSheet = async (scriptUrl: string, type: string, payload: any, user: User): Promise<boolean> => {
    if (!scriptUrl || !user || !scriptUrl.startsWith('http')) return false;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'save', type, payload, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        console.error("Save Data Error:", error);
        return false;
    }
};

export const clearHistoryInSheet = async (scriptUrl: string, type: string, user: User): Promise<boolean> => {
    if (!scriptUrl || !user || !scriptUrl.startsWith('http')) return false;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'clear', type, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const result = await response.json();
        return result.status === 'success';
    } catch (error: any) {
        return false;
    }
};

export const socialAuth = async (scriptUrl: string, profile: any): Promise<any> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return { success: false, message: 'Invalid URL' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'socialAuth', profile }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const sendTestNotification = async (scriptUrl: string, user: User): Promise<any> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return { success: false, message: 'Invalid URL' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'sendTestLine', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const sendTelegramTestNotification = async (scriptUrl: string, user: User): Promise<any> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return { success: false, message: 'Invalid URL' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'sendTestTelegram', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

export const fetchAllAdminDataFromSheet = async (scriptUrl: string, adminKey: string): Promise<AllAdminData | null> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return null;
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAllAdminData', adminKey }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const result = await response.json();
        return result.status === 'success' ? result.data : null;
    } catch (error) {
        console.error("Fetch Admin Data Error:", error);
        return null;
    }
};

export const fetchLeaderboard = async (scriptUrl: string, user?: User): Promise<any> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
        throw new Error("Invalid Web App URL");
    }
    
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getLeaderboard', user: user || { username: 'guest' } }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`Network Error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            return result.data;
        } else {
            throw new Error(result.message || "API returned error status");
        }
    } catch (e: any) {
        console.error("Fetch Leaderboard Error:", e);
        throw e; 
    }
};

// --- GROUP MANAGEMENT SERVICES ---

export const createGroup = async (scriptUrl: string, user: User, groupData: any): Promise<any> => {
    if (!scriptUrl || !user) return { success: false, message: 'Invalid config' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'createGroup', user, groupData }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const joinGroup = async (scriptUrl: string, user: User, code: string): Promise<any> => {
    if (!scriptUrl || !user) return { success: false, message: 'Invalid config' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'joinGroup', user, code }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const getUserGroups = async (scriptUrl: string, user: User): Promise<any> => {
    if (!scriptUrl || !user) return [];
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getUserGroups', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) { return []; }
};

export const getAdminGroups = async (scriptUrl: string, user: User): Promise<any> => {
    if (!scriptUrl || !user) return [];
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAdminGroups', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) { return []; }
};

export const leaveGroup = async (scriptUrl: string, user: User, groupId: string): Promise<any> => {
    if (!scriptUrl || !user) return { status: 'error' };
    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'leaveGroup', user, groupId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error) { return { status: 'error' }; }
};
