
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, NotificationState, Organization, HealthGroup } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, LEVEL_THRESHOLDS, GAMIFICATION_LIMITS, XP_VALUES, DEFAULT_ORGANIZATIONS } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet, getUserGroups, joinGroup as joinGroupService, leaveGroup as leaveGroupService } from '../services/googleSheetService';

// HARDCODED URL (v14.0)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFZroUmo2RuQmMjWmjMTE9e_466wKnXbIJ7ezDzP3X5_AnUpZXTkU3CZZE2sm0m-eS/exec';

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
  const [plannerHistory, _setPlannerHistory] = useLocalStorage<any[]>('plannerHistory', []);
  const [waterHistory, _setWaterHistory] = useLocalStorage<WaterHistoryEntry[]>('waterHistory', []);
  const [calorieHistory, _setCalorieHistory] = useLocalStorage<CalorieHistoryEntry[]>('calorieHistory', []);
  const [activityHistory, _setActivityHistory] = useLocalStorage<ActivityHistoryEntry[]>('activityHistory', []);
  const [sleepHistory, _setSleepHistory] = useLocalStorage<SleepEntry[]>('sleepHistory', []);
  const [moodHistory, _setMoodHistory] = useLocalStorage<MoodEntry[]>('moodHistory', []);
  const [habitHistory, _setHabitHistory] = useLocalStorage<HabitEntry[]>('habitHistory', []);
  const [socialHistory, _setSocialHistory] = useLocalStorage<SocialEntry[]>('socialHistory', []);
  const [evaluationHistory, _setEvaluationHistory] = useLocalStorage<EvaluationEntry[]>('evaluationHistory', []);
  const [quizHistory, _setQuizHistory] = useLocalStorage<QuizEntry[]>('quizHistory', []);
  const [waterGoal, setWaterGoal] = useLocalStorage<number>('waterGoal', 2000);
  const [latestFoodAnalysis, setLatestFoodAnalysis] = useLocalStorage<NutrientInfo | null>('latestFoodAnalysis', null);
  const [userProfile, _setUserProfile] = useLocalStorage<UserProfile>('userProfile', defaultProfile);
  
  // Updated key to force refresh to new Hardcoded URL
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl_v14', DEFAULT_SCRIPT_URL);
  
  const [isDataSynced, setIsDataSynced] = useState(false); 
  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge', data: any } | null>(null);
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
    setCurrentUser(user);
    // Initial profile sync handled by useEffect
  };

  const logout = () => {
    // Set flag to prevent auto-login loop in Auth.tsx
    sessionStorage.setItem('isLoggedOut', 'true');
    
    setCurrentUser(null);
    _setUserProfile(defaultProfile);
    setIsDataSynced(false);
    setActiveView('home');
    // Clear sensitive history
    _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]); 
    _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
    _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]); _setQuizHistory([]);
  };

  const setBmiHistory = (val: any) => { _setBmiHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'BMI', val, currentUser); };
  const setTdeeHistory = (val: any) => { _setTdeeHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'TDEE', val, currentUser); };
  const setFoodHistory = (val: any) => { _setFoodHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'FOOD', val, currentUser); };
  const setPlannerHistory = (val: any) => { _setPlannerHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'PLANNER', val, currentUser); };
  const setWaterHistory = (val: any) => { _setWaterHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'WATER', val, currentUser); };
  const setCalorieHistory = (val: any) => { _setCalorieHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'CALORIE', val, currentUser); };
  const setActivityHistory = (val: any) => { _setActivityHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'ACTIVITY', val, currentUser); };
  const setSleepHistory = (val: any) => { _setSleepHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'SLEEP', val, currentUser); };
  const setMoodHistory = (val: any) => { _setMoodHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'MOOD', val, currentUser); };
  const setHabitHistory = (val: any) => { _setHabitHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'HABIT', val, currentUser); };
  const setSocialHistory = (val: any) => { _setSocialHistory(val); if(currentUser) saveDataToSheet(scriptUrl, 'SOCIAL', val, currentUser); };
  
  const setUserProfile = (profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
      const newProfile = { ...profileData };
      _setUserProfile(newProfile);
      if (currentUser) {
          const updatedUser = { ...currentUser, ...accountData, organization: newProfile.organization };
          setCurrentUser(updatedUser);
          saveDataToSheet(scriptUrl, 'profile', newProfile, updatedUser);
      }
  };

  const saveEvaluation = (satisfaction: any, outcomes: any) => {
      const entry = { id: Date.now().toString(), date: new Date().toISOString(), satisfaction, outcomes };
      _setEvaluationHistory(prev => [entry, ...prev]);
      if(currentUser) saveDataToSheet(scriptUrl, 'EVALUATION', entry, currentUser);
  };

  const saveQuizResult = (score: number, totalQuestions: number, correctAnswers: number, type: any = 'practice', weekNumber?: number) => {
      const entry: QuizEntry = { id: Date.now().toString(), date: new Date().toISOString(), score, totalQuestions, correctAnswers, type, weekNumber };
      _setQuizHistory(prev => [entry, ...prev]);
      if(currentUser) saveDataToSheet(scriptUrl, 'QuizHistory', entry, currentUser);
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, show: false }));
  
  const openSOS = () => setIsSOSOpen(true);
  const closeSOS = () => setIsSOSOpen(false);

  // Group Management Functions
  const refreshGroups = useCallback(async () => {
      if(!currentUser || !scriptUrl) return;
      const groups = await getUserGroups(scriptUrl, currentUser);
      setMyGroups(groups);
  }, [currentUser, scriptUrl]);

  const joinGroup = async (code: string) => {
      if (!currentUser) return { success: false, message: 'Not logged in' };
      
      const safeUser = {
          username: currentUser.username,
          displayName: currentUser.displayName,
          role: currentUser.role,
          profilePicture: currentUser.profilePicture
      };

      if (!safeUser.username) {
          console.error("Join Group Error: Username missing in currentUser", currentUser);
          return { success: false, message: 'ข้อมูลผู้ใช้ไม่สมบูรณ์ (Username missing)' };
      }

      const res = await joinGroupService(scriptUrl, safeUser as User, code);
      if (res.status === 'Joined') {
          refreshGroups();
          return { success: true, message: 'Joined' };
      }
      // FIX: Treat "Already member" as success to handle race conditions or double clicks
      if (res.message && (res.message.includes('already') || res.message.includes('เป็นสมาชิกกลุ่มนี้อยู่แล้ว'))) {
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

  // --- Gamification Logic ---
  const gainXP = (amount: number, category?: string) => {
      if (!currentUser || currentUser.role === 'guest') return;
      
      const todayStr = new Date().toDateString();
      if (category && GAMIFICATION_LIMITS[category]) {
          const limit = GAMIFICATION_LIMITS[category];
          const countKey = `daily_count_${category}_${todayStr}`;
          const currentCount = parseInt(localStorage.getItem(countKey) || '0');
          if (currentCount >= limit.maxPerDay) {
              return; // Cap reached, no XP
          }
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
      saveDataToSheet(scriptUrl, 'profile', updatedProfile, currentUser);
      
      if (!leveledUp) {
          setNotification({ show: true, message: `+${amount} HP!`, type: 'success' });
          setTimeout(closeNotification, 2000);
      }
  };

  const closeLevelUpModal = () => setShowLevelUp(null);

  const clearBmiHistory = () => { _setBmiHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'BMI', currentUser); };
  const clearTdeeHistory = () => { _setTdeeHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'TDEE', currentUser); };
  const clearFoodHistory = () => { _setFoodHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'FOOD', currentUser); };
  const clearWaterHistory = () => { _setWaterHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'WATER', currentUser); };
  const clearCalorieHistory = () => { _setCalorieHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'CALORIE', currentUser); };
  const clearActivityHistory = () => { _setActivityHistory([]); if(currentUser) clearHistoryInSheet(scriptUrl, 'ACTIVITY', currentUser); };
  const clearWellnessHistory = () => {
      _setSleepHistory([]); _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]);
      if(currentUser) {
          clearHistoryInSheet(scriptUrl, 'SLEEP', currentUser);
          clearHistoryInSheet(scriptUrl, 'MOOD', currentUser);
          clearHistoryInSheet(scriptUrl, 'HABIT', currentUser);
          clearHistoryInSheet(scriptUrl, 'SOCIAL', currentUser);
      }
  };

  useEffect(() => {
      if (currentUser && currentUser.role !== 'guest' && scriptUrl && !isDataSynced) {
          const syncData = async () => {
              if (currentUser.authProvider === 'line' && !currentUser.username) {
                  console.warn("User missing username, forcing logout to re-auth");
                  logout();
                  return;
              }

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
                  setIsDataSynced(true);
                  refreshGroups();
              }
          };
          syncData();
      }
  }, [currentUser, scriptUrl, isDataSynced, refreshGroups]);

  return (
    <AppContext.Provider value={{
      activeView, setActiveView, currentUser, login, logout, theme, setTheme,
      bmiHistory, setBmiHistory, tdeeHistory, setTdeeHistory, foodHistory, setFoodHistory,
      plannerHistory, setPlannerHistory, waterHistory, setWaterHistory, calorieHistory, setCalorieHistory,
      activityHistory, setActivityHistory, sleepHistory, setSleepHistory, moodHistory, setMoodHistory,
      habitHistory, setHabitHistory, socialHistory, setSocialHistory, evaluationHistory, saveEvaluation,
      quizHistory, saveQuizResult, waterGoal, setWaterGoal, latestFoodAnalysis, setLatestFoodAnalysis,
      userProfile, setUserProfile, scriptUrl, setScriptUrl, apiKey: '', setApiKey: () => {}, isDataSynced,
      clearBmiHistory, clearTdeeHistory, clearFoodHistory, clearWaterHistory, clearCalorieHistory,
      clearActivityHistory, clearWellnessHistory, gainXP, showLevelUp, closeLevelUpModal,
      notification, closeNotification, isSOSOpen, openSOS, closeSOS,
      organizations, myGroups, joinGroup, leaveGroup, refreshGroups
    }}>
      {children}
    </AppContext.Provider>
  );
};
