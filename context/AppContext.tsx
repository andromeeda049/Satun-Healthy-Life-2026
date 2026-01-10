
import React, { createContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { AppView, BMIHistoryEntry, TDEEHistoryEntry, NutrientInfo, FoodHistoryEntry, UserProfile, Theme, WaterHistoryEntry, CalorieHistoryEntry, ActivityHistoryEntry, SleepEntry, MoodEntry, HabitEntry, SocialEntry, EvaluationEntry, QuizEntry, User, AppContextType, NotificationState, Organization, HealthGroup } from '../types';
import { PLANNER_ACTIVITY_LEVELS, HEALTH_CONDITIONS, LEVEL_THRESHOLDS, GAMIFICATION_LIMITS, XP_VALUES, DEFAULT_ORGANIZATIONS } from '../constants';
import { fetchAllDataFromSheet, saveDataToSheet, clearHistoryInSheet, getUserGroups, joinGroup, leaveGroup } from '../services/googleSheetService';

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
      if (scriptUrl !== DEFAULT_SCRIPT_URL) {
          console.warn("URL mismatch detected, resetting to hardcoded default.");
          setScriptUrl(DEFAULT_SCRIPT_URL);
      }
  }, []);

  const login = (user: User) => {
    const lastUser = localStorage.getItem('last_login_user');
    if (lastUser && lastUser !== user.username) {
        _setUserProfile(defaultProfile);
        _setBmiHistory([]); _setTdeeHistory([]); _setFoodHistory([]); _setPlannerHistory([]);
        _setWaterHistory([]); _setCalorieHistory([]); _setActivityHistory([]); _setSleepHistory([]);
        _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); _setEvaluationHistory([]);
        _setQuizHistory([]); setLatestFoodAnalysis(null); 
        setMyGroups([]);
    }
    
    localStorage.setItem('last_login_user', user.username);
    setCurrentUser(user);
    setIsDataSynced(false); 
    
    const currentParams = new URLSearchParams(window.location.search);
    let viewParam = currentParams.get('view');
    if (!viewParam) viewParam = initialUrlParams.current.get('view');
    if (viewParam) setActiveView(viewParam as AppView);
    else setActiveView('home');
  };

  const logout = () => { 
      setCurrentUser(null); 
      setActiveView('home'); 
      setIsDataSynced(false);
      setMyGroups([]);
      sessionStorage.removeItem('dismiss_profile_alert');
  };

  // Function to refresh groups
  const refreshGroups = useCallback(async () => {
      if (currentUser && scriptUrl) {
          const groups = await getUserGroups(scriptUrl, currentUser);
          setMyGroups(groups);
      }
  }, [currentUser, scriptUrl]);

  // Join Group Wrapper
  const handleJoinGroup = async (code: string) => {
      if(!currentUser) return { success: false, message: "Not logged in" };
      const result = await joinGroup(scriptUrl, currentUser, code);
      if(result.status === 'success') {
          refreshGroups();
          return { success: true, message: "เข้าร่วมกลุ่มสำเร็จ" };
      }
      return { success: false, message: result.message || "เกิดข้อผิดพลาด" };
  };

  // Leave Group Wrapper
  const handleLeaveGroup = async (groupId: string) => {
      if(!currentUser) return false;
      const result = await leaveGroup(scriptUrl, currentUser, groupId);
      if(result.status === 'success') {
          refreshGroups();
          return true;
      }
      return false;
  };

  useEffect(() => {
    const loadAllData = async () => {
      if (scriptUrl && currentUser && currentUser.role === 'user') {
        const fetchedData = await fetchAllDataFromSheet(scriptUrl, currentUser);
        if (fetchedData) {
          _setUserProfile(prev => {
              if (!fetchedData.profile) return prev;
              const cloud = fetchedData.profile;
              const merge = (cloudVal: any, prevVal: any) => {
                  return (cloudVal && cloudVal !== "0" && cloudVal !== "") ? cloudVal : prevVal;
              };

              return {
                  ...prev,
                  gender: cloud.gender || prev.gender,
                  age: merge(cloud.age, prev.age),
                  weight: merge(cloud.weight, prev.weight),
                  height: merge(cloud.height, prev.height),
                  waist: merge(cloud.waist, prev.waist),
                  hip: merge(cloud.hip, prev.hip),
                  activityLevel: cloud.activityLevel || prev.activityLevel,
                  healthCondition: cloud.healthCondition && cloud.healthCondition !== "ไม่มีโรคประจำตัว" ? cloud.healthCondition : prev.healthCondition,
                  xp: Math.max(cloud.xp || 0, prev.xp || 0),
                  level: Math.max(cloud.level || 1, prev.level || 1),
                  badges: cloud.badges?.length ? cloud.badges : prev.badges,
                  organization: cloud.organization || prev.organization,
                  pdpaAccepted: cloud.pdpaAccepted || prev.pdpaAccepted,
                  pdpaAcceptedDate: cloud.pdpaAcceptedDate || prev.pdpaAcceptedDate,
                  researchId: cloud.researchId || prev.researchId,
                  aiSystemInstruction: cloud.aiSystemInstruction || prev.aiSystemInstruction
              };
          });
          
          if (fetchedData.bmiHistory?.length) _setBmiHistory(fetchedData.bmiHistory);
          if (fetchedData.tdeeHistory?.length) _setTdeeHistory(fetchedData.tdeeHistory);
          if (fetchedData.foodHistory?.length) _setFoodHistory(fetchedData.foodHistory);
          if (fetchedData.plannerHistory?.length) _setPlannerHistory(fetchedData.plannerHistory);
          if (fetchedData.waterHistory?.length) _setWaterHistory(fetchedData.waterHistory);
          if (fetchedData.calorieHistory?.length) _setCalorieHistory(fetchedData.calorieHistory);
          if (fetchedData.activityHistory?.length) _setActivityHistory(fetchedData.activityHistory);
          if (fetchedData.sleepHistory?.length) _setSleepHistory(fetchedData.sleepHistory);
          if (fetchedData.moodHistory?.length) _setMoodHistory(fetchedData.moodHistory);
          if (fetchedData.habitHistory?.length) _setHabitHistory(fetchedData.habitHistory);
          if (fetchedData.socialHistory?.length) _setSocialHistory(fetchedData.socialHistory);
          if (fetchedData.evaluationHistory?.length) _setEvaluationHistory(fetchedData.evaluationHistory);
          if (fetchedData.quizHistory?.length) _setQuizHistory(fetchedData.quizHistory);
        }
        // Fetch Groups
        refreshGroups();
        setIsDataSynced(true);
      } else {
        setIsDataSynced(true);
      }
    };
    loadAllData();
  }, [scriptUrl, currentUser?.username]);

  const setUserProfile = useCallback((profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, displayName: accountData.displayName, profilePicture: accountData.profilePicture };
    if (profileData.organization) updatedUser.organization = profileData.organization;
    setCurrentUser(updatedUser); 
    _setUserProfile(profileData);
    if (scriptUrl) saveDataToSheet(scriptUrl, 'profile', profileData, updatedUser).catch(e => console.error(e));
  }, [scriptUrl, currentUser, setCurrentUser, _setUserProfile]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning') => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const saveQuizResult = (score: number, total: number, correct: number, type: 'pre-test' | 'post-test' | 'practice' | 'weekly' = 'practice', weekNumber?: number) => {
    if (!currentUser) return;
    const newEntry: QuizEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        score,
        totalQuestions: total,
        correctAnswers: correct,
        type,
        weekNumber
    };
    _setQuizHistory(prev => [...prev, newEntry]);
    if (scriptUrl) saveDataToSheet(scriptUrl, 'QuizHistory', newEntry, currentUser).catch(e => console.error(e));
  };

  const gainXP = useCallback((amount: number, category?: string) => {
    if (!currentUser || currentUser.role === 'guest') return;
    let finalAmount = amount;
    
    _setUserProfile(currentProfile => {
        let currentXP = currentProfile.xp || 0; 
        let currentLevel = currentProfile.level || 1;
        let currentBadges = currentProfile.badges || ['novice']; 
        let currentStreak = currentProfile.streak || 0;
        const todayStr = new Date().toDateString();
        
        if (currentProfile.lastLogDate !== todayStr) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            const isConsecutive = (currentProfile.lastLogDate === yesterday.toDateString());
            currentStreak = isConsecutive ? currentStreak + 1 : 1;
        }
        
        let newXP = currentXP + finalAmount; 
        let newLevel = currentLevel;
        while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) newLevel++;
        
        const newBadges = [...currentBadges];
        if (newLevel >= 5 && !newBadges.includes('level5')) newBadges.push('level5');
        if (newLevel >= 10 && !newBadges.includes('master')) newBadges.push('master');
        if (newLevel > currentLevel) setShowLevelUp({ type: 'level', data: newLevel });
        
        let updatedProfile: UserProfile = { ...currentProfile, xp: newXP, level: newLevel, badges: newBadges, streak: currentStreak, lastLogDate: todayStr };
        
        if (scriptUrl) {
            const payload = { ...updatedProfile, deltaXp: finalAmount };
            saveDataToSheet(scriptUrl, 'profile', payload, currentUser);
        }
        
        if (finalAmount > 0) showToast(`+${finalAmount} HP! (รวม ${updatedProfile.xp})`, 'success');
        return updatedProfile;
    });
  }, [currentUser, scriptUrl]);

  return (
    <AppContext.Provider value={{ 
        activeView, setActiveView, currentUser, login, logout, theme, setTheme,
        bmiHistory, setBmiHistory: _setBmiHistory, tdeeHistory, setTdeeHistory: _setTdeeHistory,
        foodHistory, setFoodHistory: _setFoodHistory, plannerHistory, setPlannerHistory: _setPlannerHistory,
        waterHistory, setWaterHistory: _setWaterHistory, calorieHistory, setCalorieHistory: _setCalorieHistory,
        activityHistory, setActivityHistory: _setActivityHistory, sleepHistory, setSleepHistory: _setSleepHistory,
        moodHistory, setMoodHistory: _setMoodHistory, habitHistory, setHabitHistory: _setHabitHistory,
        socialHistory, setSocialHistory: _setSocialHistory, evaluationHistory, saveEvaluation: (s, o) => {}, quizHistory, saveQuizResult,
        waterGoal, setWaterGoal, latestFoodAnalysis, setLatestFoodAnalysis, userProfile, setUserProfile,
        scriptUrl, setScriptUrl, apiKey: '', setApiKey: () => {}, isDataSynced,
        clearBmiHistory: () => { _setBmiHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'bmiHistory', currentUser); },
        clearTdeeHistory: () => { _setTdeeHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'tdeeHistory', currentUser); },
        clearFoodHistory: () => { _setFoodHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'foodHistory', currentUser); },
        clearWaterHistory: () => { _setWaterHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'waterHistory', currentUser); },
        clearCalorieHistory: () => { _setCalorieHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'calorieHistory', currentUser); },
        clearActivityHistory: () => { _setActivityHistory([]); if (scriptUrl && currentUser) clearHistoryInSheet(scriptUrl, 'activityHistory', currentUser); },
        clearWellnessHistory: () => { _setSleepHistory([]); _setMoodHistory([]); _setHabitHistory([]); _setSocialHistory([]); },
        gainXP, showLevelUp, closeLevelUpModal: () => setShowLevelUp(null),
        isSOSOpen, openSOS: () => setIsSOSOpen(true), closeSOS: () => setIsSOSOpen(false),
        notification, closeNotification: () => setNotification(prev => ({ ...prev, show: false })),
        organizations,
        myGroups, joinGroup: handleJoinGroup, leaveGroup: handleLeaveGroup, refreshGroups
    }}>
      {children}
    </AppContext.Provider>
  );
};
