
import { User, UserProfile, BMIHistoryEntry, TDEEHistoryEntry, FoodHistoryEntry, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, RedemptionHistoryEntry, HealthGroup } from '../types';

export interface AllAdminData {
    profiles: any[];
    loginLogs: any[];
    bmiHistory: any[];
    tdeeHistory: any[];
    foodHistory: any[];
    activityHistory: any[];
    sleepHistory: any[];
    moodHistory: any[];
    habitHistory: any[];
    socialHistory: any[];
    evaluationHistory: any[];
    quizHistory: any[];
    groups?: any[];
    redemptionHistory?: any[];
    [key: string]: any[];
}

const fetchWithRetry = async (url: string, options: any, retries = 3, timeout = 30000): Promise<Response> => {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (err: any) {
        if (retries > 0) {
            console.log(`Retrying... attempts left: ${retries}`);
            await new Promise(res => setTimeout(res, 1000));
            return fetchWithRetry(url, options, retries - 1, timeout);
        }
        throw err;
    }
};

export const socialAuth = async (scriptUrl: string, payload: any) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'socialLogin', payload }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const adminLogin = async (scriptUrl: string, password: string): Promise<any> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return { status: 'error', message: 'Invalid URL' };
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'adminLogin', password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const fetchAllDataFromSheet = async (scriptUrl: string, user: User) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'fetchUserData', username: user.username }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        console.error("Fetch Data Error:", error);
        return null;
    }
};

export const saveDataToSheet = async (scriptUrl: string, type: string, data: any, user: User) => {
    try {
        const payload = {
            action: 'save', // CORRECTED ACTION NAME
            type: type,
            payload: data, // CORRECTED KEY: 'payload' instead of 'data'
            user: user     // CORRECTED KEY: 'user' instead of 'userProfile'
        };
        await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        }, 1, 10000);
    } catch (error) {
        console.error(`Save ${type} Error:`, error);
    }
};

export const clearHistoryInSheet = async (scriptUrl: string, type: string, user: User) => {
    try {
        await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'clear', 
                type, 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
    } catch (error) {
        console.error("Clear History Error:", error);
    }
};

export const fetchAllAdminDataFromSheet = async (scriptUrl: string, adminKey: string): Promise<AllAdminData | null> => {
    if (!scriptUrl || !scriptUrl.startsWith('http')) return null;
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAllAdminData', adminKey }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        }, 2, 60000); 
        const result = await response.json();
        return result.status === 'success' ? result.data : null;
    } catch (error) {
        console.error("Fetch Admin Data Error:", error);
        return null;
    }
};

export const getUserGroups = async (scriptUrl: string, user: User): Promise<HealthGroup[]> => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getUserGroups', 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) {
        return [];
    }
};

export const joinGroup = async (scriptUrl: string, user: User, code: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'joinGroup', 
                code: code, 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const leaveGroup = async (scriptUrl: string, user: User, groupId: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'leaveGroup', 
                groupId,
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const createGroup = async (scriptUrl: string, user: User, groupData: any) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'createGroup', 
                groupData, 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        return await response.json();
    } catch (error: any) {
        return { status: 'error', message: error.message };
    }
};

export const getAdminGroups = async (scriptUrl: string, user: User) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getAdminGroups', 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) {
        return [];
    }
};

export const fetchGroupMembers = async (scriptUrl: string, user: User, groupId: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getGroupMembers', 
                groupId, 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) {
        return [];
    }
};

export const fetchUserDataByAdmin = async (scriptUrl: string, user: User, targetUsername: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'getUserData', 
                targetUsername, 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        return null;
    }
};

export const fetchLeaderboard = async (scriptUrl: string, user?: User, groupId?: string) => {
    try {
        const payload: any = { action: 'getLeaderboard' };
        if (user) {
            payload.user = user; 
            payload.username = user.username;
        }
        if (groupId) payload.groupId = groupId;

        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        return null;
    }
};

export const sendTestNotification = async (scriptUrl: string, user: User) => {
    try {
        await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'testNotification', 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            redirect: 'follow'
        });
    } catch (error) {
        console.error(error);
    }
};
