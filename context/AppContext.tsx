
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, NotificationState, Organization, HealthGroup, RedemptionHistoryEntry, PlannerHistoryEntry, HealthGoal, ClinicalHistoryEntry } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, LEVEL_THRESHOLDS, GAMIFICATION_LIMITS, XP_VALUES, DEFAULT_ORGANIZATIONS } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet, getUserGroups, joinGroup as joinGroupService, leaveGroup as leaveGroupService, resetUserData, deleteDataFromSheet } from '../services/googleSheetService';

// HARDCODED URL (v17.0) - Updated Verified URL
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaH1AGEMnL0FAuvGKynIT-s-A06zGg73YYG3l6CgUwwiPBXhQrLCHOMlb01fANkxTx_w/exec';

const defaultProfile: UserProfile = {
  gender: 'male',
  age: '',
  weight: '',
  height: '',
  waist: '',
  hip: '',
  activityLevel: PLANNER_ACTIVITY_LEVELS[2].value,
  healthCondition: HEALTH_CONDITIONS[0],
  xp: 0,
  level: 1,
  badges: ['novice'],
  receiveDailyReminders: true,
  organization: '', 
  streak: 0,
  lastLogDate: '',
  aiSystemInstruction: ''
};

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('theme');
        if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialUrlParams = useRef(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''));

  const [activeView, setActiveView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getInitialTheme());
  const [bmiHistory, _setBmiHistory] = useLocalStorage<BMIHistoryEntry[]>('bmiHistory', []);
  const [tdeeHistory, _setTdeeHistory] = useLocalStorage<TDEEHistoryEntry[]>('tdeeHistory', []);
  const [foodHistory, _setFoodHistory] = useLocalStorage<FoodHistoryEntry[]>('foodHistory', []);
  const [plannerHistory, _setPlannerHistory] = useLocalStorage<PlannerHistoryEntry[]>('plannerHistory', []);
  const [waterHistory, _setWaterHistory] = useLocalStorage<WaterHistoryEntry[]>('waterHistory', []);
  const [calorieHistory, _setCalorieHistory] = useLocalStorage<CalorieHistoryEntry[]>('calorieHistory', []);
  const [activityHistory, _setActivityHistory] = useLocalStorage<ActivityHistoryEntry[]>('activityHistory', []);
  const [sleepHistory, _setSleepHistory] = useLocalStorage<SleepEntry[]>('sleepHistory', []);
  const [moodHistory, _setMoodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [habitHistory, _setHabitHistory] = useLocalStorage<HabitEntry[]>('habitHistory', []);
  const [socialHistory, _setSocialHistory] = useLocalStorage<SocialEntry[]>('socialHistory', []);
  const [evaluationHistory, _setEvaluationHistory] = useLocalStorage<EvaluationEntry[]>('evaluationHistory', []);
  const [quizHistory, _setQuizHistory] = useLocalStorage<QuizEntry[]>('quizHistory', []);
  const [redemptionHistory, _setRedemptionHistory] = useLocalStorage<RedemptionHistoryEntry[]>('redemptionHistory', []);
  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  
  // New States for Goals & Clinical
  const [goals, setGoals] = useLocalStorage<HealthGoal[]>('goals', []);
  const [clinicalHistory, setClinicalHistory] = useLocalStorage<ClinicalHistoryEntry[]>('clinicalHistory', []);

  // Updated key to force refresh to new Hardcoded URL (v17)
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl_v17', DEFAULT_SCRIPT_URL);
  
  const [isDataSynced, setIsDataSynced] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge' | 'group_join', data: any } | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [organizations, setOrganizations] = useLocalStorage<Organization[]>('organizations', DEFAULT_ORGANIZATIONS);
  
  const [myGroups, setMyGroups] = useState<HealthGroup[]>([]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Ensure Script URL is always correct (Self-Healing)
  useEffect(() => {
      if (!scriptUrl || scriptUrl !== DEFAULT_SCRIPT_URL) {
          setScriptUrl(DEFAULT_SCRIPT_URL);
      }
  }, []);

  const login = (user: User) => {
    const lastLogonUser = localStorage.getItem('lastLogonUser');
    
    if (lastLogonUser && lastLogonUser !== user.username) {
        console.log("User switch detected. Clearing previous user data.");
        _setUserProfile(defaultProfile);
        _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]); 
        _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
        _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]); _setQuizHistory([]); _setRedemptionHistory([]);
        setGoals([]); setClinicalHistory([]);
        setMyGroups([]);
    }

    localStorage.setItem('lastLogonUser', user.username);
    setCurrentUser(user);
    setIsDataSynced(false);
    setIsSyncing(false);
    setSyncError(null);
  };

  const logout = () => {
    sessionStorage.setItem('isLoggedOut', 'true');
    setCurrentUser(null);
    setIsDataSynced(false);
    setIsSyncing(false);
    setActiveView('home');
    setMyGroups([]);
  };

  const handleHistoryUpdate = (setter: any, currentVal: any, newVal: any, type: string) => {
      const valueToSave = newVal instanceof Function ? newVal(currentVal) : newVal;
      setter(valueToSave);
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, type, valueToSave, currentUser);
      }
  };

  const setBmiHistory = (val: any) => handleHistoryUpdate(_setBmiHistory, bmiHistory, val, 'BMI');
  const setTdeeHistory = (val: any) => handleHistoryUpdate(_setTdeeHistory, tdeeHistory, val, 'TDEE');
  const setFoodHistory = (val: any) => handleHistoryUpdate(_setFoodHistory, foodHistory, val, 'FOOD');
  const setPlannerHistory = (val: any) => { _setPlannerHistory(val); }; 
  const setWaterHistory = (val: any) => handleHistoryUpdate(_setWaterHistory, waterHistory, val, 'WATER');
  const setCalorieHistory = (val: any) => handleHistoryUpdate(_setCalorieHistory, calorieHistory, val, 'CALORIE');
  const setActivityHistory = (val: any) => handleHistoryUpdate(_setActivityHistory, activityHistory, val, 'ACTIVITY');
  const setSleepHistory = (val: any) => handleHistoryUpdate(_setSleepHistory, sleepHistory, val, 'SLEEP');
  const setMoodHistory = (val: any) => handleHistoryUpdate(_setMoodHistory, moodHistory, val, 'MOOD');
  const setHabitHistory = (val: any) => handleHistoryUpdate(_setHabitHistory, habitHistory, val, 'HABIT');
  const setSocialHistory = (val: any) => handleHistoryUpdate(_setSocialHistory, socialHistory, val, 'SOCIAL');
  const setRedemptionHistory = (val: any) => handleHistoryUpdate(_setRedemptionHistory, redemptionHistory, val, 'REDEMPTION');
  
  const setUserProfile = (profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
      const newProfile = { ...profileData };
      _setUserProfile(newProfile);
      if (currentUser && isDataSynced) {
          const updatedUser = { ...currentUser, ...accountData, organization: newProfile.organization };
          setCurrentUser(updatedUser);
          saveDataToSheet(scriptUrl, 'profile', newProfile, updatedUser);
      }
  };

  const saveEvaluation = (satisfaction: any, outcomes: any) => {
      const entry = { id: Date.now().toString(), date: new Date().toISOString(), satisfaction, outcomes };
      _setEvaluationHistory(prev => [entry, ...prev]);
      if(currentUser && isDataSynced) saveDataToSheet(scriptUrl, 'EVALUATION', entry, currentUser);
  };

  const saveQuizResult = (score: number, totalQuestions: number, correctAnswers: number, type: any = 'practice', weekNumber?: number) => {
      const entry: QuizEntry = { id: Date.now().toString(), date: new Date().toISOString(), score, totalQuestions, correctAnswers, type, weekNumber };
      _setQuizHistory(prev => [entry, ...prev]);
      if(currentUser && isDataSynced) saveDataToSheet(scriptUrl, 'QuizHistory', entry, currentUser);
  };

  const savePlannerEntry = (entry: PlannerHistoryEntry) => {
      _setPlannerHistory(prev => [entry, ...prev].slice(0, 10));
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, 'PLANNER', entry, currentUser);
      }
  };

  const saveFeedback = (data: { category: string; message: string; rating: number }) => {
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, 'feedback', data, currentUser);
      }
  };

  // --- GOAL & CLINICAL FUNCTIONS ---
  const saveGoal = (goal: HealthGoal) => {
      setGoals(prev => {
          // If update existing, replace it. Else add new.
          const existingIdx = prev.findIndex(g => g.id === goal.id);
          if (existingIdx >= 0) {
              const newGoals = [...prev];
              newGoals[existingIdx] = goal;
              return newGoals;
          }
          return [goal, ...prev];
      });
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, 'goal', goal, currentUser);
      }
  };

  const deleteGoal = (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      if (currentUser && isDataSynced) {
          deleteDataFromSheet(scriptUrl, 'goal', id, currentUser);
      }
  };

  const saveClinicalEntry = (entry: ClinicalHistoryEntry) => {
      setClinicalHistory(prev => [entry, ...prev]);
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, 'clinical', entry, currentUser);
      }
  };

  const resetData = async (): Promise<boolean> => {
      if (!currentUser || !scriptUrl) return false;
      try {
          const success = await resetUserData(scriptUrl, currentUser);
          if (success) {
              _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]); 
              _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
              _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]); 
              _setQuizHistory([]); _setRedemptionHistory([]);
              setGoals([]); setClinicalHistory([]);
              
              const resetProfile = { ...userProfile, xp: 0, level: 1, badges: ['novice'], deltaXp: 0 };
              _setUserProfile(resetProfile);
              setNotification({ show: true, message: 'รีเซ็ตข้อมูลสำเร็จ! เริ่มต้นใหม่กันเถอะ', type: 'success' });
              return true;
          } else {
              setNotification({ show: true, message: 'การรีเซ็ตข้อมูลล้มเหลว', type: 'warning' });
              return false;
          }
      } catch (e) {
          console.error(e);
          return false;
      }
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, show: false }));
  const openSOS = () => setIsSOSOpen(true);
  const closeSOS = () => setIsSOSOpen(false);

  const refreshGroups = useCallback(async () => {
      if(!currentUser || !scriptUrl) return;
      try {
          const groups = await getUserGroups(scriptUrl, currentUser);
          setMyGroups(groups);
      } catch (e) {
          console.error("Failed to refresh groups", e);
      }
  }, [currentUser, scriptUrl]);

  const joinGroup = async (code: string) => {
      if (!currentUser) return { success: false, message: 'Not logged in' };
      const safeUser = { username: currentUser.username, displayName: currentUser.displayName, role: currentUser.role, profilePicture: currentUser.profilePicture };
      if (!safeUser.username) return { success: false, message: 'ข้อมูลผู้ใช้ไม่สมบูรณ์' };

      const res = await joinGroupService(scriptUrl, safeUser as User, code);
      if (res.status === 'success' && res.data?.status === 'Joined') {
          refreshGroups();
          return { success: true, message: 'Joined', data: res.data.group };
      }
      if (res.status === 'Joined') {
          refreshGroups();
          return { success: true, message: 'Joined', data: res.group };
      }
      if (res.message && (res.message.includes('already') || res.message.includes('เป็นสมาชิก'))) {
          refreshGroups();
          return { success: true, message: 'คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว (Success)' };
      }
      return { success: false, message: res.message || 'Failed' };
  };

  const leaveGroup = async (groupId: string) => {
      if (!currentUser) return false;
      const res = await leaveGroupService(scriptUrl, currentUser, groupId);
      if (res.status === 'Left') {
          refreshGroups();
          return true;
      }
      return false;
  };

  const gainXP = (amount: number, category?: string) => {
      if (!currentUser || currentUser.role === 'guest') return;
      const todayStr = new Date().toDateString();
      if (category && GAMIFICATION_LIMITS[category]) {
          const limit = GAMIFICATION_LIMITS[category];
          const countKey = `daily_count_${category}_${todayStr}`;
          const currentCount = parseInt(localStorage.getItem(countKey) || '0');
          if (currentCount >= limit.maxPerDay) return; 
          localStorage.setItem(countKey, (currentCount + 1).toString());
      }

      let newXP = (userProfile.xp || 0) + amount;
      let newLevel = userProfile.level || 1;
      let leveledUp = false;
      const nextThreshold = LEVEL_THRESHOLDS[newLevel];
      
      if (nextThreshold && newXP >= nextThreshold) {
          newLevel++;
          leveledUp = true;
          setShowLevelUp({ type: 'level', data: newLevel });
      }

      const updatedProfile = { ...userProfile, xp: newXP, level: newLevel, deltaXp: amount };
      _setUserProfile(updatedProfile);
      if (isDataSynced) {
          saveDataToSheet(scriptUrl, 'profile', updatedProfile, currentUser);
      }
      
      if (!leveledUp) {
          setNotification({ show: true, message: `+${amount} HP!`, type: 'success' });
          setTimeout(closeNotification, 2000);
      }
  };

  const showCelebration = (type: 'level' | 'badge' | 'group_join', data: any) => {
      setShowLevelUp({ type, data });
  };

  const closeLevelUpModal = () => setShowLevelUp(null);

  const clearBmiHistory = () => { _setBmiHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'BMI', currentUser); };
  const clearTdeeHistory = () => { _setTdeeHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'TDEE', currentUser); };
  const clearFoodHistory = () => { _setFoodHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'FOOD', currentUser); };
  const clearWaterHistory = () => { _setWaterHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'WATER', currentUser); };
  const clearCalorieHistory = () => { _setCalorieHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'CALORIE', currentUser); };
  const clearActivityHistory = () => { _setActivityHistory([]); if(currentUser && isDataSynced) clearHistoryInSheet(scriptUrl, 'ACTIVITY', currentUser); };
  const clearWellnessHistory = () => {
      _setSleepHistory([]); _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]);
      if(currentUser && isDataSynced) {
          clearHistoryInSheet(scriptUrl, 'SLEEP', currentUser);
          clearHistoryInSheet(scriptUrl, 'MOOD', currentUser);
          clearHistoryInSheet(scriptUrl, 'HABIT', currentUser);
          clearHistoryInSheet(scriptUrl, 'SOCIAL', currentUser);
      }
  };

  const syncData = useCallback(async () => {
      if (!currentUser || currentUser.role === 'guest' || !scriptUrl) {
          setIsDataSynced(true);
          return;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
          const data = await fetchAllDataFromSheet(scriptUrl, currentUser);
          if (data) {
              if (data.profile) _setUserProfile(data.profile);
              if (data.bmiHistory) _setBmiHistory(data.bmiHistory);
              if (data.tdeeHistory) _setTdeeHistory(data.tdeeHistory);
              if (data.foodHistory) _setFoodHistory(data.foodHistory);
              if (data.plannerHistory) _setPlannerHistory(data.plannerHistory);
              if (data.waterHistory) _setWaterHistory(data.waterHistory);
              if (data.calorieHistory) _setCalorieHistory(data.calorieHistory);
              if (data.activityHistory) _setActivityHistory(data.activityHistory);
              if (data.sleepHistory) _setSleepHistory(data.sleepHistory);
              if (data.moodHistory) _setMoodHistory(data.moodHistory);
              if (data.habitHistory) _setHabitHistory(data.habitHistory);
              if (data.socialHistory) _setSocialHistory(data.socialHistory);
              if (data.evaluationHistory) _setEvaluationHistory(data.evaluationHistory);
              if (data.quizHistory) _setQuizHistory(data.quizHistory);
              if (data.redemptionHistory) _setRedemptionHistory(data.redemptionHistory);
              if (data.goals) setGoals(data.goals); // Sync Goals
              if (data.clinicalHistory) setClinicalHistory(data.clinicalHistory); // Sync Clinical
              
              setIsDataSynced(true);
              refreshGroups();
          } else {
              throw new Error("ไม่ได้รับข้อมูลจากเซิร์ฟเวอร์");
          }
      } catch (e: any) {
          console.error("Sync Error:", e);
          setSyncError(e.message || "การเชื่อมต่อขัดข้อง");
          setIsDataSynced(false);
      } finally {
          setIsSyncing(false);
      }
  }, [currentUser, scriptUrl, refreshGroups]);

  useEffect(() => {
      if (currentUser && currentUser.role !== 'guest' && !isDataSynced && !isSyncing && !syncError) {
          syncData();
      }
  }, [currentUser, isDataSynced, isSyncing, syncError, syncData]);

  const retrySync = () => {
      setSyncError(null);
      syncData();
  };

  const useOfflineData = () => {
      setSyncError(null);
      setIsDataSynced(true);
  };

  return (
    <AppContext.Provider value={{
      activeView, setActiveView, currentUser, login, logout, theme, setTheme,
      bmiHistory, setBmiHistory, tdeeHistory, setTdeeHistory, foodHistory, setFoodHistory,
      plannerHistory, setPlannerHistory, savePlannerEntry, waterHistory, setWaterHistory, calorieHistory, setCalorieHistory,
      activityHistory, setActivityHistory, sleepHistory, setSleepHistory, moodHistory, setMoodHistory,
      habitHistory, setHabitHistory, socialHistory, setSocialHistory, evaluationHistory, saveEvaluation,
      quizHistory, saveQuizResult, waterGoal, setWaterGoal, latestFoodAnalysis, setLatestFoodAnalysis,
      userProfile, setUserProfile, scriptUrl, setScriptUrl, apiKey: '', setApiKey: () => {}, isDataSynced,
      clearBmiHistory, clearTdeeHistory, clearFoodHistory, clearWaterHistory, clearCalorieHistory,
      clearActivityHistory, clearWellnessHistory, gainXP, showLevelUp, closeLevelUpModal, showCelebration,
      notification, closeNotification, isSOSOpen, openSOS, closeSOS,
      organizations, myGroups, joinGroup, leaveGroup, refreshGroups,
      redemptionHistory, setRedemptionHistory,
      isSyncing, syncError, retrySync: retrySync, useOfflineData: useOfflineData,
      resetData,
      saveFeedback,
      // GOALS & CLINICAL EXPORTS
      goals, setGoals, saveGoal, deleteGoal,
      clinicalHistory, setClinicalHistory, saveClinicalEntry
    }}>
      {children}
    </AppContext.Provider>
  );
};
