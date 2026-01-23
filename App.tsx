
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import BMICalculator from './components/BMICalculator';
import TDEECalculator from './components/TDEECalculator';
import FoodAnalyzer from './components/FoodAnalyzer';
import Dashboard from './components/Dashboard';
import AICoach from './components/AICoach';
import PersonalizedPlanner from './components/PersonalizedPlanner';
import HomeMenu from './components/HomeMenu';
import UserProfile from './components/UserProfile';
import NutritionLiteracy from './components/NutritionLiteracy';
import Settings from './components/Settings';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import WaterTracker from './components/WaterTracker';
import LifestyleAssessment from './components/LifestyleAssessment';
import CalorieTracker from './components/CalorieTracker';
import ActivityTracker from './components/ActivityTracker';
import WellnessCheckin from './components/WellnessCheckin';
import GamificationRules from './components/GamificationRules';
import AboutApp from './components/AboutApp';
import EvaluationForm from './components/EvaluationForm';
import HealthLiteracyQuiz from './components/HealthLiteracyQuiz';
import PDPAModal from './components/PDPAModal';
import OrganizationModal from './components/OrganizationModal';
import SOSModal from './components/SOSModal';
import LevelUpModal from './components/LevelUpModal';
import Community from './components/Community';
import XPHistory from './components/XPHistory'; 
import RewardsRedemption from './components/RewardsRedemption';
import MenuGridPage from './components/MenuGridPage';
import { AppProvider, AppContext } from './context/AppContext';
import { AppView, User, WaterHistoryEntry } from './types';
import { HomeIcon, CameraIcon, SparklesIcon, MenuIcon, XIcon, SquaresIcon, UserCircleIcon, WaterDropIcon, HeartIcon, BellIcon, UserGroupIcon, PhoneIcon, BeakerIcon, BoltIcon, ExclamationTriangleIcon } from './components/icons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useLocalStorage from './hooks/useLocalStorage';
import { XP_VALUES } from './constants';

const GOOGLE_CLIENT_ID = "968529250528-sp2uu4uu05peu6tvc2frpug7tfq3s5dg.apps.googleusercontent.com";

const SOSButton: React.FC = () => {
    const { openSOS } = useContext(AppContext);
    return (
        <button onClick={openSOS} className="fixed bottom-24 right-4 z-40 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 animate-pulse">
            <PhoneIcon className="w-6 h-6" />
        </button>
    );
};

const ToastNotification: React.FC = () => {
    const { notification, closeNotification } = useContext(AppContext);
    if (!notification.show) return null;
    const bgColors = { success: 'bg-green-600', info: 'bg-blue-600', warning: 'bg-orange-600' };
    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down w-[90%] max-w-sm">
            <div className={`${bgColors[notification.type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20`}>
                <span className="text-sm font-bold">{notification.message}</span>
                <button onClick={closeNotification} className="ml-4 text-white p-1 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

const DataSyncGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isSyncing, syncError, retrySync, useOfflineData, currentUser, isDataSynced } = useContext(AppContext);

    // Only guard logged in users who are NOT guests
    if (!currentUser || currentUser.role === 'guest') return <>{children}</>;

    // Case 1: Syncing - New Friendly Animation with Custom Image
    if (isSyncing) {
        return (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[999] flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                <div className="relative mb-6">
                    <img 
                        src="https://cdn.dribbble.com/userupload/32768031/file/original-a4e52e6c66a839f7967c349df387620c.gif" 
                        alt="Loading..." 
                        className="w-64 h-auto object-contain mx-auto rounded-2xl mix-blend-multiply dark:mix-blend-normal"
                    />
                </div>
                
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-3 tracking-tight">
                    ฮึบๆ... กำลังฟิตข้อมูล!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                    ระบบกำลังซิงค์ประวัติสุขภาพของคุณจาก Cloud <br/>
                    <span className="text-teal-600 dark:text-teal-400 text-xs mt-1 block font-bold">"สุขภาพดี เริ่มต้นที่ความสม่ำเสมอ"</span>
                </p>

                {/* Bouncing Dots */}
                <div className="mt-8 flex gap-2">
                    <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        );
    }

    // Case 2: Error
    if (syncError) {
        return (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[999] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">เชื่อมต่อล้มเหลว</h2>
                <p className="text-gray-500 text-sm mb-8">{syncError} <br/> คุณต้องการลองใหม่หรือใช้ข้อมูลเดิมในเครื่อง?</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={retrySync} className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all">ลองอีกครั้ง (Retry)</button>
                    <button onClick={useOfflineData} className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl active:scale-95 transition-all">ใช้งานแบบออฟไลน์ (Offline)</button>
                </div>
            </div>
        );
    }

    // Case 3: Initial State (Not synced, not syncing, no error) - Should be brief or covered by isSyncing
    if (!isDataSynced) {
         // Fallback loader if effect hasn't fired yet
         return (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[999] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
            </div>
         );
    }

    return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, setTheme, currentUser, logout, userProfile, setUserProfile, waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, setWaterHistory, gainXP, isSOSOpen, closeSOS, showLevelUp, closeLevelUpModal, isDataSynced } = useContext(AppContext);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showPDPA, setShowPDPA] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam) setActiveView(viewParam as AppView);
  }, [setActiveView]);

  // Combined Check for PDPA and Organization
  useEffect(() => {
      if (isDataSynced && currentUser && currentUser.role === 'user') {
          // Priority 1: PDPA
          if (userProfile && !userProfile.pdpaAccepted) { 
              setShowPDPA(true); 
              setShowOrgModal(false); 
          } 
          // Priority 2: Organization (Only if PDPA accepted)
          else if (userProfile && (!userProfile.organization || userProfile.organization === '')) { 
              setShowOrgModal(true); 
          } 
          else { 
              setShowOrgModal(false); 
          }
      }
  }, [currentUser, userProfile, isDataSynced]);

  // Handle click outside notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setIsNotificationOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePDPAAccept = () => {
      if (!currentUser) return;
      const updatedProfile = { ...userProfile, pdpaAccepted: true, pdpaAcceptedDate: new Date().toISOString() };
      setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
      setShowPDPA(false);
      
      // Chain Flow: Immediately prompt for Organization if missing
      if (!updatedProfile.organization) {
          setShowOrgModal(true);
      }
  };

  const handleOrgSelect = (orgId: string) => {
      if (!currentUser) return;
      const updatedProfile = { ...userProfile, organization: orgId };
      setUserProfile(updatedProfile, { displayName: currentUser.displayName, profilePicture: currentUser.profilePicture });
      setShowOrgModal(false);

      // Chain Flow: If basic profile info is missing, redirect to Profile page
      if (!updatedProfile.age || !updatedProfile.weight || !updatedProfile.height) {
          setActiveView('profile');
      }
  };

  const navigate = (view: AppView) => {
    setActiveView(view);
    setIsQuickActionOpen(false);
    setIsNotificationOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'home': return <HomeMenu />;
      case 'menu': return <MenuGridPage />;
      case 'profile': return <UserProfile />;
      case 'dashboard': return <Dashboard />;
      case 'community': return <Community />;
      case 'assessment': return <LifestyleAssessment />;
      case 'planner': return <PersonalizedPlanner />;
      case 'bmi': return <BMICalculator />;
      case 'tdee': return <TDEECalculator />;
      case 'food': return <FoodAnalyzer />;
      case 'coach': return <AICoach />;
      case 'literacy': return <NutritionLiteracy />;
      case 'water': return <WaterTracker />;
      case 'calorieTracker': return <CalorieTracker />;
      case 'activityTracker': return <ActivityTracker />;
      case 'wellness': return <WellnessCheckin />;
      case 'gamificationRules': return <GamificationRules />;
      case 'about': return <AboutApp />;
      case 'evaluation': return <EvaluationForm />;
      case 'quiz': return <HealthLiteracyQuiz />;
      case 'weeklyQuiz': return <HealthLiteracyQuiz />;
      case 'dailyQuiz': return <HealthLiteracyQuiz />;
      case 'settings': return <Settings />;
      case 'hpHistory': return <XPHistory />; 
      case 'rewards': return <RewardsRedemption />;
      case 'adminDashboard': return currentUser?.role === 'admin' ? <AdminDashboard /> : <HomeMenu />;
      default: return <HomeMenu />;
    }
  };

  const pendingTasks = useMemo(() => {
    if (!currentUser || currentUser.role === 'guest') return [];
    
    const isToday = (dateString: string) => {
      const d = new Date(dateString);
      const today = new Date();
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    };

    const tasks = [];
    if (!waterHistory.some(h => isToday(h.date))) tasks.push({ id: 'water', label: 'ดื่มน้ำยังไม่ครบ', view: 'water' as AppView, icon: <WaterDropIcon className="w-4 h-4 text-blue-500"/> });
    if (!calorieHistory.some(h => isToday(h.date))) tasks.push({ id: 'calorie', label: 'ยังไม่บันทึกอาหาร', view: 'calorieTracker' as AppView, icon: <BeakerIcon className="w-4 h-4 text-orange-500"/> });
    if (!activityHistory.some(h => isToday(h.date))) tasks.push({ id: 'activity', label: 'ขยับร่างกายกันเถอะ', view: 'activityTracker' as AppView, icon: <BoltIcon className="w-4 h-4 text-yellow-500"/> });
    if (!moodHistory.some(h => isToday(h.date)) && !sleepHistory.some(h => isToday(h.date))) {
         tasks.push({ id: 'wellness', label: 'เช็คอินสุขภาพใจ', view: 'wellness' as AppView, icon: <HeartIcon className="w-4 h-4 text-rose-500"/> });
    }
    return tasks;
  }, [waterHistory, calorieHistory, activityHistory, moodHistory, sleepHistory, currentUser]);

  const BottomNavigation = () => {
      if (!currentUser) return null;
      return (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-slate-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 z-40 pb-safe shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.08)]">
              <button onClick={() => navigate('home')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'home' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'}`}><HomeIcon className="w-6 h-6" /><span className="text-[10px] mt-1">หน้าหลัก</span></button>
              <button onClick={() => navigate('community')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'community' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'}`}><UserGroupIcon className="w-6 h-6" /><span className="text-[10px] mt-1">ชุมชน</span></button>
              <div className="relative -top-5"><button onClick={() => setIsQuickActionOpen(true)} className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_4px_15px_rgba(20,184,166,0.4)] border-4 border-white dark:border-gray-800 transform active:scale-90 transition-all hover:scale-105"><span className="text-3xl font-light mb-1">+</span></button></div>
              <button onClick={() => navigate('coach')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'coach' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'}`}><SparklesIcon className="w-6 h-6" /><span className="text-[10px] mt-1">โค้ช AI</span></button>
              <button onClick={() => navigate('menu')} className={`flex flex-col items-center justify-center w-full h-full ${activeView === 'menu' ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'}`}><MenuIcon className="w-6 h-6" /><span className="text-[10px] mt-1">เมนู</span></button>
          </div>
      );
  };

  const QuickActionModal = () => {
      if (!isQuickActionOpen) return null;
      return (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={() => setIsQuickActionOpen(false)}></div>
              <div className="bg-white dark:bg-gray-800 w-full max-w-md mx-auto rounded-t-[2.5rem] p-8 relative z-10 animate-slide-up shadow-[0_-15px_40px_rgba(0,0,0,0.2)] border-t border-white/20">
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-gray-600 rounded-full mx-auto mb-8"></div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 text-center">บันทึกด่วน (Quick Log)</h3>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                      <button onClick={() => { setWaterHistory(prev => [{ id: Date.now().toString(), date: new Date().toISOString(), amount: 250 }, ...prev]); gainXP(XP_VALUES.WATER, 'WATER'); setIsQuickActionOpen(false); }} className="flex flex-col items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl transition-all hover:bg-blue-100 active:scale-95"><div className="w-14 h-14 bg-white dark:bg-blue-800 rounded-full flex items-center justify-center text-2xl shadow-sm">💧</div><span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">ดื่มน้ำ</span></button>
                      <button onClick={() => navigate('food')} className="flex flex-col items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl transition-all hover:bg-purple-100 active:scale-95"><div className="w-14 h-14 bg-white dark:bg-purple-800 rounded-full flex items-center justify-center text-2xl shadow-sm">📸</div><span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">สแกนอาหาร</span></button>
                      <button onClick={() => navigate('calorieTracker')} className="flex flex-col items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl transition-all hover:bg-orange-100 active:scale-95"><div className="w-14 h-14 bg-white dark:bg-orange-800 rounded-full flex items-center justify-center text-2xl shadow-sm">🥗</div><span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">จดอาหาร</span></button>
                      <button onClick={() => navigate('wellness')} className="flex flex-col items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl transition-all hover:bg-rose-100 active:scale-95"><div className="w-14 h-14 bg-white dark:bg-rose-800 rounded-full flex items-center justify-center text-2xl shadow-sm">😊</div><span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">อารมณ์</span></button>
                  </div>
                  <button onClick={() => setIsQuickActionOpen(false)} className="w-full py-4 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-colors hover:bg-slate-200">ยกเลิก</button>
              </div>
          </div>
      );
  }

  // FIX: Helper to display profile picture or emoji
  const renderProfilePicture = (pic: string | undefined) => {
      if (!pic) return <div className={`p-1.5 rounded-xl transition-all group-hover:scale-105 ${activeView === 'profile' ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}><UserCircleIcon className="w-8 h-8" /></div>;
      
      const isImage = pic.startsWith('data:image/') || pic.startsWith('http');
      if (isImage) {
          return <img src={pic} alt="Profile" className={`w-10 h-10 rounded-xl object-cover border-2 shadow-sm transition-all group-hover:scale-105 ${activeView === 'profile' ? 'border-teal-500 shadow-teal-100' : 'border-white dark:border-gray-700'}`} />;
      }
      // It's an emoji or text
      return (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-sm transition-all group-hover:scale-105 bg-gray-100 dark:bg-gray-700 ${activeView === 'profile' ? 'border-teal-500' : 'border-white dark:border-gray-700'}`}>
              <span className="text-xl">{pic}</span>
          </div>
      );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-slate-100 text-slate-900'} font-sans pb-10`}>
      {currentUser ? (
        <DataSyncGuard>
          <header className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-md z-30 px-5 py-4 flex justify-between items-center transition-all duration-300 border-b border-slate-200/50 dark:border-gray-700/50">
             <div className="flex items-center gap-3" onClick={() => navigate('home')}>
                <div className="w-9 h-9 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg transform hover:rotate-6 transition-transform cursor-pointer">
                    <i className="fa-solid fa-heartbeat text-xl"></i>
                </div>
                <span className="font-black text-base cursor-pointer text-slate-900 dark:text-white tracking-tight">Satun Healthy Life</span>
             </div>
             <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`p-2 rounded-xl transition-all relative ${isNotificationOpen ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                    >
                        <BellIcon className="w-6 h-6" />
                        {pendingTasks.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-gray-800"></span>
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-gray-700 z-50 overflow-hidden animate-slide-up origin-top-right">
                            <div className="p-4 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">การแจ้งเตือน</span>
                                {pendingTasks.length > 0 && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black shadow-sm">{pendingTasks.length}</span>}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {pendingTasks.length > 0 ? (
                                    pendingTasks.map(task => (
                                        <button 
                                            key={task.id}
                                            onClick={() => navigate(task.view)}
                                            className="w-full p-5 text-left flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors border-b last:border-0 border-slate-50 dark:border-gray-700 group"
                                        >
                                            <div className="p-3 bg-slate-100 dark:bg-gray-600 rounded-xl group-hover:scale-110 transition-transform">{task.icon}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-gray-200">{task.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">บันทึกภารกิจวันนี้เพื่อสุขภาพที่ดี</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-10 text-center">
                                        <div className="text-4xl mb-4">🎉</div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-gray-200">เยี่ยมมาก!</p>
                                        <p className="text-xs text-slate-500 mt-1">คุณทำภารกิจครบถ้วนแล้ว</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Button */}
                <button onClick={() => navigate('profile')} className="relative flex items-center justify-center group">
                    {renderProfilePicture(currentUser?.profilePicture)}
                </button>
             </div>
          </header>
          <div className="h-20"></div>
          {/* UPDATED: Dynamic width for Admin Dashboard */}
          <main className={`p-4 mx-auto w-full pb-24 transition-all duration-300 ${activeView === 'adminDashboard' ? 'max-w-7xl' : 'max-w-3xl'}`}>{renderContent()}</main>
          <BottomNavigation />
          <ToastNotification />
          <QuickActionModal />
          {isDataSynced && showPDPA && <PDPAModal onAccept={handlePDPAAccept} />}
          {isDataSynced && showOrgModal && !showPDPA && <OrganizationModal onSelect={handleOrgSelect} />}
          {isSOSOpen && <SOSModal onClose={closeSOS} />}
          {showLevelUp && <LevelUpModal type={showLevelUp.type} data={showLevelUp.data} onClose={closeLevelUpModal} />}
        </DataSyncGuard>
      ) : (
        <Auth />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppProvider><AppContent /></AppProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
