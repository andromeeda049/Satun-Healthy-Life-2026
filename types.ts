
import React from 'react';

export interface FoodItem {
  name: string;
  calories: number;
}

export interface LifestyleAnalysis {
  nutrition: string;
  physicalActivity: string;
  sleep: string;
  stress: string;
  substance: string;
  social: string;
  overallRisk: 'Low' | 'Medium' | 'High';
}

export interface NutrientInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  description: string;
  healthImpact: string;
  lifestyleAnalysis?: LifestyleAnalysis;
  isHealthyChoice?: boolean;
  items: FoodItem[];
}

export type AppView = 'home' | 'menu' | 'profile' | 'dashboard' | 'community' | 'bmi' | 'tdee' | 'food' | 'coach' | 'planner' | 'literacy' | 'settings' | 'adminDashboard' | 'water' | 'assessment' | 'calorieTracker' | 'activityTracker' | 'wellness' | 'gamificationRules' | 'about' | 'evaluation' | 'quiz' | 'weeklyQuiz' | 'dailyQuiz' | 'hpHistory' | 'rewards';
export type Theme = 'light' | 'dark';

export interface User {
  username: string;
  displayName: string;
  profilePicture: string;
  role: 'user' | 'admin' | 'guest';
  email?: string;
  authProvider?: 'email' | 'google' | 'line' | 'telegram';
  organization?: string;
}

export interface Organization {
    id: string;
    name: string;
}

// --- NEW INTERFACE FOR GROUPS ---
export interface HealthGroup {
    id: string;
    name: string;
    code: string;
    description: string;
    lineLink: string;
    adminId: string;
    createdAt: string;
    image?: string; // Added image field
}

export interface PillarScore {
  nutrition: number;
  activity: number;
  sleep: number;
  stress: number;
  substance: number;
  social: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface UserProfile {
  gender: 'male' | 'female';
  age: string;
  birthDate?: string;
  weight: string;
  targetWeight?: string;
  height: string;
  waist: string;
  hip: string;
  activityLevel: number;
  healthCondition: string;
  pillarScores?: PillarScore;
  xp?: number;
  level?: number;
  badges?: string[];
  email?: string;
  lineUserId?: string;
  telegramUserId?: string; 
  receiveDailyReminders?: boolean;
  organization?: string;
  researchId?: string;
  pdpaAccepted?: boolean;
  pdpaAcceptedDate?: string;
  streak?: number;
  lastLogDate?: string;
  aiSystemInstruction?: string;
  deltaXp?: number;
}

export interface UserGamification {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    progress: number;
}

export interface BMIHistoryEntry {
  value: number;
  category: string;
  date: string;
}

export interface TDEEHistoryEntry {
  value: number;
  bmr: number;
  date: string;
}

export interface FoodHistoryEntry {
  id: string;
  date: string;
  analysis: NutrientInfo;
}

export interface WaterHistoryEntry {
    id: string;
    date: string;
    amount: number;
}

export interface CalorieHistoryEntry {
    id: string;
    date: string;
    name: string;
    calories: number;
    image?: string;
    imageHash?: string;
    isHealthyChoice?: boolean;
}

export interface ActivityHistoryEntry {
    id: string;
    date: string;
    name: string;
    caloriesBurned: number;
    duration?: string;
    distance?: string;
    image?: string;
    imageHash?: string;
}

export interface SleepEntry {
    id: string;
    date: string;
    bedTime: string;
    wakeTime: string;
    duration: number;
    quality: number;
    hygieneChecklist: string[];
}

export interface MoodEntry {
    id: string;
    date: string;
    moodEmoji: string;
    stressLevel: number;
    gratitude: string;
}

export interface HabitEntry {
    id: string;
    date: string;
    type: 'alcohol' | 'smoking' | 'chemicals' | 'accidents';
    amount: number;
    isClean: boolean;
}

export interface SocialEntry {
    id: string;
    date: string;
    interaction: string;
    feeling: 'energized' | 'neutral' | 'drained';
}

export interface EvaluationEntry {
    id: string;
    date: string;
    satisfaction: any;
    outcomes: any;
}

export interface QuizEntry {
    id: string;
    date: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    type: 'pre-test' | 'post-test' | 'practice' | 'weekly' | 'daily';
    weekNumber?: number;
}

export interface NotificationState {
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning';
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    category: string;
}

export interface LocalFoodSuggestion {
    name: string;
    description: string;
    calories: number;
}

export type SpecialistId = 'general' | 'nutritionist' | 'trainer' | 'psychologist' | 'sleep_expert' | 'ncd_doctor';

export interface MealPlanDay {
    day: string;
    breakfast: { menu: string; protein: number; carbohydrate: number; fat: number; calories: number; };
    lunch: { menu: string; protein: number; carbohydrate: number; fat: number; calories: number; };
    dinner: { menu: string; protein: number; carbohydrate: number; fat: number; calories: number; };
    activities: { activity: string; duration: string; benefit: string; caloriesBurned: number; }[];
    dailyTotal: { protein: number; carbohydrate: number; fat: number; calories: number; };
}

export type MealPlan = MealPlanDay[];

export interface PlannerResults {
    bmi: number;
    whr: number;
    whrRisk: string;
    bmr: number;
    tdee: number;
    proteinGoal: number;
    carbGoal: number;
    fatGoal: number;
}

export interface PlannerHistoryEntry {
    id: string;
    date: string;
    cuisine: string;
    diet: string;
    tdee: number;
    plan: MealPlan;
}

export interface SatisfactionData {
    usability: number;
    features: number;
    benefit: number;
    overall: number;
    recommend: number;
}

export interface OutcomeData {
    nutrition: string;
    activity: string;
    sleep: string;
    stress: string;
    risk: string;
    overall: string;
}

export interface AppContextType {
  activeView: AppView;
  setActiveView: React.Dispatch<React.SetStateAction<AppView>>;
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  bmiHistory: BMIHistoryEntry[];
  setBmiHistory: React.Dispatch<React.SetStateAction<BMIHistoryEntry[]>>;
  tdeeHistory: TDEEHistoryEntry[];
  setTdeeHistory: React.Dispatch<React.SetStateAction<TDEEHistoryEntry[]>>;
  foodHistory: FoodHistoryEntry[];
  setFoodHistory: React.Dispatch<React.SetStateAction<FoodHistoryEntry[]>>;
  plannerHistory: any[];
  setPlannerHistory: React.Dispatch<React.SetStateAction<any[]>>;
  waterHistory: WaterHistoryEntry[];
  setWaterHistory: React.Dispatch<React.SetStateAction<WaterHistoryEntry[]>>;
  calorieHistory: CalorieHistoryEntry[];
  setCalorieHistory: React.Dispatch<React.SetStateAction<CalorieHistoryEntry[]>>;
  activityHistory: ActivityHistoryEntry[];
  setActivityHistory: React.Dispatch<React.SetStateAction<ActivityHistoryEntry[]>>;
  
  sleepHistory: SleepEntry[];
  setSleepHistory: React.Dispatch<React.SetStateAction<SleepEntry[]>>;
  moodHistory: MoodEntry[];
  setMoodHistory: React.Dispatch<React.SetStateAction<MoodEntry[]>>;
  habitHistory: HabitEntry[];
  setHabitHistory: React.Dispatch<React.SetStateAction<HabitEntry[]>>;
  socialHistory: SocialEntry[];
  setSocialHistory: React.Dispatch<React.SetStateAction<SocialEntry[]>>;

  evaluationHistory: EvaluationEntry[];
  saveEvaluation: (satisfaction: any, outcomes: any) => void;
  quizHistory: QuizEntry[];
  saveQuizResult: (score: number, total: number, correct: number, type?: 'pre-test' | 'post-test' | 'practice' | 'weekly' | 'daily', weekNumber?: number) => void;

  waterGoal: number;
  setWaterGoal: React.Dispatch<React.SetStateAction<number>>;
  latestFoodAnalysis: NutrientInfo | null;
  setLatestFoodAnalysis: React.Dispatch<React.SetStateAction<NutrientInfo | null>>;
  userProfile: UserProfile;
  setUserProfile: (profileData: UserProfile, accountData: { displayName: string; profilePicture: string; }) => void;
  scriptUrl: string;
  setScriptUrl: React.Dispatch<React.SetStateAction<string>>;
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  isDataSynced: boolean;
  
  clearBmiHistory: () => void;
  clearTdeeHistory: () => void;
  clearFoodHistory: () => void;
  clearWaterHistory: () => void;
  clearCalorieHistory: () => void;
  clearActivityHistory: () => void;
  clearWellnessHistory: () => void;

  gainXP: (amount: number, category?: string) => void;
  showLevelUp: { type: 'level' | 'badge', data: any } | null;
  closeLevelUpModal: () => void;
  
  notification: NotificationState;
  closeNotification: () => void;

  isSOSOpen: boolean;
  openSOS: () => void;
  closeSOS: () => void;

  // --- NEW CONTEXT FOR GROUPS ---
  organizations: Organization[];
  myGroups: HealthGroup[];
  joinGroup: (code: string) => Promise<{ success: boolean; message: string }>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  refreshGroups: () => void;
}
