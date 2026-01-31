
// ... existing imports ...
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, NotificationState, Organization, HealthGroup, RedemptionHistoryEntry, PlannerHistoryEntry, HealthGoal, ClinicalHistoryEntry, RiskHistoryEntry } from '../types';
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
  
  // New States for Goals, Clinical, and Risk
  const [goals, setGoals] = useLocalStorage<HealthGoal[]>('goals', []);
  const [clinicalHistory, setClinicalHistory] = useLocalStorage<ClinicalHistoryEntry[]>('clinicalHistory', []);
  const [riskHistory, setRiskHistory] = useLocalStorage<RiskHistoryEntry[]>('riskHistory', []);

  // Updated key to force refresh to new Hardcoded URL (v17)
  const [scriptUrl, setScriptUrl] = useLocalStorage<string>('googleScriptUrl_v17', DEFAULT_SCRIPT_URL);
  
  // CACHE-FIRST STRATEGY: 
  // If we have a currentUser and matching profile data in localStorage, assume synced initially.
  // This allows the app to open INSTANTLY. The syncData will run in background to update.
  const [isDataSynced, setIsDataSynced] = useState(() => {
      if (typeof window !== 'undefined') {
          // Check if we have essential data cached
          const hasUser = !!localStorage.getItem('currentUser');
          const hasProfile = !!localStorage.getItem('userProfile');
          return hasUser && hasProfile;
      }
      return false;
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [showLevelUp, setShowLevelUp] = useState<{ type: 'level' | 'badge' | 'group_join', data: any } | null>(null);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [organizations, setOrganizations] = useLocalStorage<Organization[]>('organizations', DEFAULT_ORGANIZATIONS);
  
  const [myGroups, setMyGroups] = useState<HealthGroup[]>([]);

  // --- PIN SECURITY STATE ---
  const [userPin, setUserPin] = useLocalStorage<string | null>('user_pin', null);
  
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
      try {
          if (typeof window === 'undefined') return true;
          const storedPinRaw = window.localStorage.getItem('user_pin');
          if (!storedPinRaw) return true; // No PIN = Verified
          const parsedPin = JSON.parse(storedPinRaw);
          if (typeof parsedPin === 'string' && parsedPin.length === 4) {
              return false; // Locked
          }
          return true;
      } catch (e) {
          return true; 
      }
  });

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

  useEffect(() => {
      if (!userPin) {
          setIsPinVerified(true);
      }
  }, [userPin]);

  const login = (user: User) => {
    const lastLogonUser = localStorage.getItem('lastLogonUser');
    
    // Check if switching users
    if (lastLogonUser && lastLogonUser !== user.username) {
        console.log("User switch detected. Clearing previous user data.");
        _setUserProfile(defaultProfile);
        _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]); 
        _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
        _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]); _setQuizHistory([]); _setRedemptionHistory([]);
        setGoals([]); setClinicalHistory([]); setRiskHistory([]);
        setMyGroups([]);
        setUserPin(null);
        setIsPinVerified(true);
        // User changed, force sync blocking
        setIsDataSynced(false);
    } else {
        // Same user, assume cached data is good enough for start
        setIsDataSynced(true);
    }

    localStorage.setItem('lastLogonUser', user.username);
    setCurrentUser(user);
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
    setIsPinVerified(false);
  };

  // ... (Update Helpers remain unchanged) ...
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
          const isSuperAdmin = currentUser.organization === 'all' || currentUser.originalOrganization === 'all';
          const orgToSet = isSuperAdmin ? 'all' : newProfile.organization;

          const updatedUser = { 
              ...currentUser, 
              ...accountData, 
              organization: orgToSet 
          };
          
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

  const saveGoal = (goal: HealthGoal) => {
      setGoals(prev => {
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

  const saveRiskEntry = (entry: RiskHistoryEntry) => {
      setRiskHistory(prev => [entry, ...prev]);
      if (currentUser && isDataSynced) {
          saveDataToSheet(scriptUrl, 'risk', entry, currentUser);
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
              setGoals([]); setClinicalHistory([]); setRiskHistory([]);
              
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

  const setPin = (pin: string | null) => {
      setUserPin(pin);
      setIsPinVerified(true);
  };

  const verifyPin = (pin: string): boolean => {
      if (userPin === pin) {
          setIsPinVerified(true);
          return true;
      }
      return false;
  };

  const unlockApp = () => setIsPinVerified(true);
  const lockApp = () => setIsPinVerified(false);

  const syncData = useCallback(async () => {
      if (!currentUser || currentUser.role === 'guest' || !scriptUrl) {
          setIsDataSynced(true);
          return;
      }

      // DO NOT set isDataSynced(false) here. 
      // We want to keep the UI interactive with cached data while we fetch in background.
      setIsSyncing(true);
      setSyncError(null);

      try {
          const data = await fetchAllDataFromSheet(scriptUrl, currentUser);
          if (data) {
              if (data.profile) {
                  let riskProfile: any = {};
                  if (data.riskHistory && data.riskHistory.length > 0) {
                      const sortedHistory = [...data.riskHistory].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      sortedHistory.forEach((entry: any) => {
                          if (entry.cvdRiskLevel && entry.cvdRiskLevel !== '') { riskProfile.cvdRiskLevel = entry.cvdRiskLevel; riskProfile.cvdScore = entry.cvdScore; }
                          if (entry.depressionSeverity && entry.depressionSeverity !== '') { riskProfile.depressionRisk = entry.depressionRisk; riskProfile.depressionScore = entry.depressionScore; riskProfile.depressionSeverity = entry.depressionSeverity; }
                          if (entry.sleepApneaRisk && entry.sleepApneaRisk !== '') { riskProfile.sleepApneaRisk = entry.sleepApneaRisk; }
                          riskProfile.lastAssessmentDate = entry.date;
                      });
                  }
                  
                  const fullProfile = { ...data.profile, riskAssessment: riskProfile };
                  // Smart Merge: Only update if server has meaningful data, or force update to sync state
                  _setUserProfile(fullProfile);
              }

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
              if (data.goals) setGoals(data.goals);
              if (data.clinicalHistory) setClinicalHistory(data.clinicalHistory);
              if (data.riskHistory) setRiskHistory(data.riskHistory);
              
              setIsDataSynced(true); // Ensure synced state is true after success
              refreshGroups();
          }
      } catch (e: any) {
          console.error("Background Sync Error:", e);
          // Silent failure is okay for background sync, user still has cached data
          // But if it was the *first* load (isDataSynced is false), show error
          if (!isDataSynced) {
             setSyncError(e.message || "การเชื่อมต่อขัดข้อง");
          }
      } finally {
          setIsSyncing(false);
      }
  }, [currentUser, scriptUrl, refreshGroups]); // Removed dependencies that cause loops

  useEffect(() => {
      // Trigger sync only if logged in and not currently syncing
      if (currentUser && currentUser.role !== 'guest' && !isSyncing) {
          syncData();
      }
  }, [currentUser, syncData]);

  const retrySync = () => {
      setSyncError(null);
      syncData();
  };

  const useOfflineData = () => {
      setSyncError(null);
      setIsDataSynced(true);
  };

  const simulateUserMode = () => {
      if (currentUser && currentUser.role === 'admin') {
          const updatedUser: User = { ...currentUser, role: 'user', originalRole: 'admin', originalOrganization: currentUser.organization };
          setCurrentUser(updatedUser);
          setActiveView('home');
          setNotification({ show: true, message: 'เข้าสู่โหมดจำลองผู้ใช้งาน (User View)', type: 'info' });
      }
  };

  const exitSimulationMode = () => {
      if (currentUser && currentUser.originalRole) {
          const restoredOrg = currentUser.originalOrganization || currentUser.organization;
          const updatedUser: User = { ...currentUser, role: currentUser.originalRole as 'admin' | 'user' | 'guest', organization: restoredOrg };
          delete updatedUser.originalRole;
          delete updatedUser.originalOrganization;
          setCurrentUser(updatedUser);
          setNotification({ show: true, message: 'กลับสู่โหมดผู้ดูแลระบบ', type: 'success' });
          setActiveView('settings');
      }
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
      isSyncing, syncError, retrySync, useOfflineData,
      resetData, saveFeedback,
      goals, setGoals, saveGoal, deleteGoal,
      clinicalHistory, setClinicalHistory, saveClinicalEntry,
      riskHistory, saveRiskEntry,
      simulateUserMode, exitSimulationMode,
      userPin, isPinVerified, setPin, verifyPin, unlockApp, lockApp
    }}>
      {children}
    </AppContext.Provider>
  );
};
