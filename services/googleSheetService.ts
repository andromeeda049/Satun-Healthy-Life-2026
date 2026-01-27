
import { User, UserProfile, BMIHistoryEntry, TDEEHistoryEntry, FoodHistoryEntry, PlannerHistoryEntry, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, RedemptionHistoryEntry, HealthGroup } from '../types';

export interface AllAdminData {
    profiles?: any[];
    groups?: any[];
    groupMembers?: any[];
    bmiHistory?: any[];
    tdeeHistory?: any[];
    foodHistory?: any[];
    activityHistory?: any[];
    loginLogs?: any[];
    evaluationHistory?: any[];
    quizHistory?: any[];
    stats?: any;
    [key: string]: any;
}

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
};

export const fetchAllDataFromSheet = async (scriptUrl: string, user: User) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'fetchUserData', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        if (res.status === 'success') return res.data;
        return null;
    } catch (error) {
        console.error("Fetch Data Error:", error);
        return null;
    }
};

export const saveDataToSheet = async (scriptUrl: string, type: string, data: any, user: User) => {
    try {
        // Non-blocking save attempt
        fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveData', type, data, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        }).catch(e => console.error("Save Data BG Error:", e));
    } catch (error) {
        console.error("Save Data Error:", error);
    }
};

export const deleteDataFromSheet = async (scriptUrl: string, type: string, id: string, user: User) => {
    try {
        await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteData', type, id, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
    } catch (error) {
        console.error("Delete Data Error:", error);
    }
};

export const clearHistoryInSheet = async (scriptUrl: string, type: string, user: User) => {
    try {
        await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'clearHistory', type, user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
    } catch (error) {
        console.error("Clear History Error:", error);
    }
};

export const getUserGroups = async (scriptUrl: string, user: User): Promise<HealthGroup[]> => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getUserGroups', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) {
        console.error("Get User Groups Error:", error);
        return [];
    }
};

export const joinGroup = async (scriptUrl: string, user: User, groupCode: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'joinGroup', user, groupCode }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: String(error) };
    }
};

export const leaveGroup = async (scriptUrl: string, user: User, groupId: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'leaveGroup', user, groupId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: String(error) };
    }
};

export const socialAuth = async (scriptUrl: string, payload: any) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'socialLogin', ...payload }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: String(error) };
    }
};

export const adminLogin = async (scriptUrl: string, token: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'adminLogin', token }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: String(error) };
    }
};

export const fetchLeaderboard = async (scriptUrl: string, user?: User, groupId?: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'fetchLeaderboard', user, groupId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        console.error("Fetch Leaderboard Error:", error);
        return null;
    }
};

export const createGroup = async (scriptUrl: string, user: User, groupData: any) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'createGroup', user, groupData }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: String(error) };
    }
};

export const getAdminGroups = async (scriptUrl: string, user: User) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAdminGroups', user }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
            body: JSON.stringify({ action: 'fetchGroupMembers', user, groupId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : [];
    } catch (error) {
        return [];
    }
};

export const fetchAllAdminDataFromSheet = async (scriptUrl: string, adminKey: string): Promise<AllAdminData | null> => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'getAllAdminData', adminKey }), 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        console.error("Fetch Admin Data Error:", error);
        return null;
    }
};

export const fetchUserDataByAdmin = async (scriptUrl: string, user: User, targetUsername: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'fetchUserDataByAdmin', user, targetUsername }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success' ? res.data : null;
    } catch (error) {
        return null;
    }
};

export const resetUserData = async (scriptUrl: string, user: User, targetUsername?: string) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'resetUser', 
                user: user,
                targetUsername: targetUsername 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success';
    } catch (error) {
        console.error("Reset User Data Error:", error);
        return false;
    }
};

export const systemFactoryReset = async (scriptUrl: string, user: User) => {
    try {
        const response = await fetchWithRetry(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'systemFactoryReset', 
                user: user 
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        });
        const res = await response.json();
        return res.status === 'success';
    } catch (error) {
        console.error("System Factory Reset Error:", error);
        return false;
    }
};

export const sendTestNotification = async (scriptUrl: string, user: User) => {
    console.log("Sending test notification for", user.username);
};
