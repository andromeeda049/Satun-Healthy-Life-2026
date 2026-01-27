
/**
 * Satun Smart Life - Backend Script (Production v20.9.2)
 * Features: 
 * - Leaderboard Category Aggregation Fix
 * - Detailed Group Member Info
 * - Accurate Group Member Counting
 * - Dynamic Group XP Calculation
 * - Robust Data Reset & Factory Reset
 * - Fix: Allow Admins in Group Leaderboard
 * - Fix: Ensure RedemptionHistory sheet setup
 * - Feature: Feedback Form Support
 */

// --- 1. CONFIGURATION ---

const ADMIN_KEY = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || "ADMIN1234!"; 
const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

// Admin mapping for specific organizations
const ORG_ADMIN_KEYS = {
    "PHO@SATUN": "pho_satun",
    "ADMIN@PHO": "pho_satun",
    "HOSP@SATUN": "hosp_satun",
    "ADMIN@HOSP_SATUN": "hosp_satun",
    "ADMIN@HOSP_KHUANDON": "hosp_khuandon",
    "ADMIN@HOSP_LANGU": "hosp_la-ngu",
    "ADMIN@HOSP_THUNGWA": "hosp_thungwa",
    "ADMIN@HOSP_MANANG": "hosp_manang",
    "ADMIN@HOSP_KK": "hosp_khuan-kalong",
    "ADMIN@HOSP_TP": "hosp_tha-phae",
    "DHO@MUANG": "dho_muang",
    "ADMIN@DHO_MUANG": "dho_muang",
    "ADMIN@DHO_KHUANDON": "dho_khuandon",
    "ADMIN@DHO_LANGU": "dho_la-ngu",
    "ADMIN@DHO_THUNGWA": "dho_thungwa",
    "ADMIN@DHO_MANANG": "dho_manang",
    "ADMIN@DHO_KK": "dho_khuan-kalong",
    "ADMIN@DHO_TP": "dho_tha-phae",
    "ADMIN@GENERAL": "general",
    "SUPER@ADMIN": "all" // Special key for Super Admin
};

const SHEET_NAMES = {
  PROFILE: "Profile",
  USERS: "Users",
  BMI: "BMIHistory",
  TDEE: "TDEEHistory",
  FOOD: "FoodHistory",
  PLANNER: "PlannerHistory",
  WATER: "WaterHistory",
  CALORIE: "CalorieHistory",
  ACTIVITY: "ActivityHistory",
  LOGIN_LOGS: "LoginLogs",
  SLEEP: "SleepHistory",
  MOOD: "MoodHistory",
  HABIT: "HabitHistory",
  SOCIAL: "SocialHistory",
  EVALUATION: "EvaluationHistory",
  CATEGORY_RANKINGS: "CategoryRankings", 
  ORGANIZATIONS: "Organization",
  GROUPS: "Groups",
  GROUP_MEMBERS: "GroupMembers",
  REDEMPTION: "RedemptionHistory",
  FEEDBACK: "Feedback"
};

// --- 2. CORE UTILITIES & LOCK SERVICE ---

function withLock(callback) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds
    return callback();
  } catch (e) {
    return createErrorResponse("System Busy: ระบบกำลังบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง (Lock Timeout)");
  } finally {
    lock.releaseLock();
  }
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  const message = (typeof error === 'string') ? error : (error.message || error.toString());
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- 3. HTTP HANDLERS ---

function doGet(e) {
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
      return ContentService.createTextOutput("Satun Smart Life API v20.9.2 is Online").setMimeType(ContentService.MimeType.TEXT);
  }
  return handleRequest(e, 'GET');
}

function doPost(e) {
  var output = ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  
  try {
    if (!e || !e.postData || !e.postData.contents) return output;
    
    const contents = JSON.parse(e.postData.contents);

    // LINE Webhook Handling
    if (contents.events) {
      if (contents.events.length > 0) {
        const replyToken = contents.events[0].replyToken;
        if (replyToken === '00000000000000000000000000000000' || replyToken === 'ffffffffffffffffffffffffffffffff') {
           return output; 
        }
      }
      handleLineWebhook(contents.events);
      return output;
    }

    // App Logic Handling
    return handleRequest(e, 'POST');

  } catch (error) {
    if (e.postData && e.postData.contents && !e.postData.contents.includes('"events":')) {
        return createErrorResponse(error);
    }
    return output;
  }
}

// --- 4. REQUEST ROUTER ---

function handleRequest(e, method) {
  try {
    const params = method === 'POST' ? JSON.parse(e.postData.contents) : e.parameter;
    const action = params.action;
    const user = params.user;
    
    // --- READ OPERATIONS (No Lock needed) ---
    if (action === 'getAllData' || action === 'getAllAdminData') {
       if (params.adminKey === ADMIN_KEY || ORG_ADMIN_KEYS[params.adminKey]) return handleAdminFetch();
       else return createErrorResponse("Invalid Admin Key");
    }
    if (action === 'adminLogin') return handleAdminLogin(params.token || params.password);
    if (action === 'verifyUser') return handleVerifyUser(params.email, params.password);
    if (action === 'fetchLeaderboard') return handleGetLeaderboardJS(params.groupId);
    if (action === 'fetchUserData') return createSuccessResponse(getUserFullData(params.username || user?.username));
    
    // --- USER CONTEXT OPERATIONS ---
    if (user) {
        // Read
        if (action === 'getUserGroups') return handleGetUserGroups(user);
        if (action === 'getAdminGroups') return handleGetAdminGroups(user);
        if (action === 'fetchGroupMembers') return handleGetGroupMembers(params.groupId, user);
        if (action === 'fetchUserDataByAdmin') return handleGetUserDataForAdmin(params.targetUsername);
        if (action === 'testNotification') return handleTestNotification(user);
        if (action === 'notifyComplete') return handleNotifyComplete(user);
        
        // Write (REQUIRE LOCK)
        if (action === 'createGroup') return withLock(() => handleCreateGroup(params.groupData, user));
        if (action === 'joinGroup') return withLock(() => handleJoinGroup(params.groupCode, user));
        if (action === 'leaveGroup') return withLock(() => handleLeaveGroup(params.groupId, user));
        if (action === 'saveData') return withLock(() => handleSave(params.type, params.data, user));
        if (action === 'clearHistory') return withLock(() => handleClear(params.type, user));
        
        // --- RESET ACTIONS ---
        if (action === 'resetUser') return withLock(() => handleResetUser(user, params.targetUsername));
        if (action === 'systemFactoryReset') return withLock(() => handleSystemFactoryReset(user));
    }

    // --- AUTH WRITES (REQUIRE LOCK) ---
    if (action === 'register') return withLock(() => handleRegisterUser(params.user, params.password));
    if (action === 'socialLogin') return withLock(() => handleSocialAuth(params));

    throw new Error("Invalid Action: " + action);

  } catch (error) {
    return createErrorResponse(error);
  }
}

// --- 5. LOGIC IMPLEMENTATION ---

// --- Group Management Logic ---

function handleCreateGroup(groupData, adminUser) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.GROUPS);
    
    const data = sheet.getDataRange().getValues();
    const newCode = String(groupData.code).trim().toUpperCase();
    
    // Check Duplicate Code
    for(let i=1; i<data.length; i++) {
        if(String(data[i][2]).trim().toUpperCase() === newCode) return createErrorResponse("รหัสเข้ากลุ่มนี้ถูกใช้งานแล้ว");
    }
    
    const id = 'GRP_' + Date.now();
    sheet.appendRow([id, groupData.name, newCode, groupData.description, groupData.lineLink, adminUser.username, new Date(), groupData.image || ""]);
    
    // Auto-join admin
    handleJoinGroup(newCode, adminUser); 
    
    return createSuccessResponse({ status: "Created", group: { ...groupData, id } });
}

function handleJoinGroup(code, user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    let memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    if (!memberSheet) { memberSheet = ss.insertSheet(SHEET_NAMES.GROUP_MEMBERS); memberSheet.appendRow(["GroupId", "Username", "JoinedAt"]); }

    if (!groupSheet) return createErrorResponse("System Error: Group Sheet Missing");

    const groups = groupSheet.getDataRange().getValues();
    let targetGroup = null;
    const searchCode = String(code).trim().toUpperCase();
    
    for(let i=1; i<groups.length; i++) {
        if(String(groups[i][2]).trim().toUpperCase() === searchCode) { 
            targetGroup = { id: groups[i][0], name: groups[i][1], code: groups[i][2] };
            break;
        }
    }
    
    if(!targetGroup) return createErrorResponse("ไม่พบกลุ่มที่ระบุ (Invalid Code)");

    const members = memberSheet.getDataRange().getValues();
    for(let i=1; i<members.length; i++) {
        if(String(members[i][0]) === String(targetGroup.id) && String(members[i][1]) === String(user.username)) {
            return createSuccessResponse({ status: "Joined", message: "คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว" });
        }
    }

    memberSheet.appendRow([targetGroup.id, user.username, new Date()]);
    return createSuccessResponse({ status: "Joined", group: targetGroup });
}

function handleLeaveGroup(groupId, user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    if (!sheet) return createErrorResponse("Sheet not found");
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === String(groupId) && String(data[i][1]) === String(user.username)) {
            sheet.deleteRow(i + 1);
            return createSuccessResponse({ status: "Left" });
        }
    }
    return createErrorResponse("Not a member");
}

function handleGetUserGroups(user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    if(!groupSheet || !memberSheet) return createSuccessResponse([]);
    
    const members = memberSheet.getDataRange().getValues();
    const joinedIds = new Set();
    for(let i=1; i<members.length; i++) { 
        if(String(members[i][1]) === String(user.username)) joinedIds.add(String(members[i][0])); 
    }
    
    const groups = groupSheet.getDataRange().getValues();
    const result = [];
    for(let i=1; i<groups.length; i++) {
        if(joinedIds.has(String(groups[i][0]))) {
            result.push({ 
                id: groups[i][0], name: groups[i][1], code: groups[i][2], 
                description: groups[i][3], lineLink: groups[i][4], 
                adminId: groups[i][5], createdAt: groups[i][6], image: groups[i][7] || "" 
            });
        }
    }
    return createSuccessResponse(result);
}

function handleGetAdminGroups(user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    let memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    
    if(!groupSheet) return createSuccessResponse([]);
    
    // Count Members Robustly
    const memberCounts = {};
    if (memberSheet && memberSheet.getLastRow() > 1) {
        const mData = memberSheet.getDataRange().getValues();
        for(let i=1; i<mData.length; i++) {
            const gId = String(mData[i][0]).trim(); // Convert to string and trim
            if(gId) memberCounts[gId] = (memberCounts[gId] || 0) + 1;
        }
    }

    const groups = groupSheet.getDataRange().getValues();
    const result = [];
    
    // Check if Super Admin
    const isSuperAdmin = (user.role === 'admin' && user.organization === 'all');

    for(let i=1; i<groups.length; i++) {
        const adminUsername = String(groups[i][5]);
        // If Super Admin -> Show All
        // If Org Admin -> Show Only Created by them
        if(isSuperAdmin || adminUsername === user.username) { 
            const gId = String(groups[i][0]).trim();
            result.push({ 
                id: gId, 
                name: groups[i][1], 
                code: groups[i][2], 
                description: groups[i][3], 
                lineLink: groups[i][4], 
                adminId: groups[i][5], 
                createdAt: groups[i][6], 
                image: groups[i][7] || "",
                memberCount: memberCounts[gId] || 0 // Use the count we calculated
            });
        }
    }
    return createSuccessResponse(result);
}

function handleGetGroupMembers(groupId, user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
    if(!memberSheet || !profileSheet) return createSuccessResponse([]);
    
    // 1. Map Group Members and Join Dates
    const memberData = memberSheet.getDataRange().getValues();
    const groupMemberJoinDates = new Map();
    for(let i=1; i<memberData.length; i++) { 
        if(String(memberData[i][0]).trim() === String(groupId).trim()) {
            // Trim username to match profile correctly
            const memberUsername = String(memberData[i][1]).trim();
            groupMemberJoinDates.set(memberUsername, memberData[i][2] ? new Date(memberData[i][2]) : new Date(0)); 
        }
    }
    
    if (groupMemberJoinDates.size === 0) return createSuccessResponse([]);

    // 2. Fetch Profile Data (All History)
    const profileData = profileSheet.getDataRange().getValues();
    const users = {}; 
    
    // Iterate all rows to sum up XP since join date
    for (let i = 1; i < profileData.length; i++) {
        const row = profileData[i];
        const uName = String(row[1] || '').trim(); // Trim profile username
        
        if (uName && groupMemberJoinDates.has(uName)) {
             const timestamp = new Date(row[0]);
             const joinDate = groupMemberJoinDates.get(uName);
             // Ensure we access deltaXp safely (column 25, index 24)
             const deltaXp = (row.length > 24) ? Number(row[24] || 0) : 0;
             
             if (!users[uName]) {
                 users[uName] = { 
                     username: uName, 
                     displayName: row[2], 
                     profilePicture: row[3],
                     gender: row[4], // New
                     age: row[5], 
                     weight: row[6], // New
                     height: row[7], // New
                     waist: row[8],  // New
                     hip: row[9],    // New
                     activityLevel: row[10], // New
                     xp: 0, // This will store GROUP XP (Calculated from deltaXp)
                     level: Number(row[13] || 1), 
                     healthCondition: row[17] || 'N/A' 
                 };
             }
             
             // Update to latest profile info found in row
             users[uName].displayName = row[2];
             users[uName].profilePicture = row[3];
             users[uName].gender = row[4];
             users[uName].age = row[5];
             users[uName].weight = row[6];
             users[uName].height = row[7];
             users[uName].waist = row[8];
             users[uName].hip = row[9];
             users[uName].activityLevel = row[10];
             users[uName].level = Number(row[13] || 1);
             users[uName].healthCondition = row[17] || 'N/A';

             // Accumulate XP only if activity happened ON or AFTER joining
             if (timestamp >= joinDate) {
                 users[uName].xp += deltaXp;
             }
        }
    }
    
    return createSuccessResponse(Object.values(users));
}

// --- Leaderboard & Ranking ---

function handleGetLeaderboardJS(groupId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
  if (!profileSheet || profileSheet.getLastRow() < 2) return createSuccessResponse({ leaderboard: [], trending: [], categories: {water:[], food:[], activity:[]} });

  let groupMemberJoinDates = null; 
  if (groupId) {
      const memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
      if (memberSheet) {
          groupMemberJoinDates = new Map();
          const mData = memberSheet.getDataRange().getValues();
          for(let i=1; i<mData.length; i++) {
              if(String(mData[i][0]).trim() === String(groupId).trim()) {
                  // Trim username to ensure match
                  const memberUsername = String(mData[i][1]).trim();
                  groupMemberJoinDates.set(memberUsername, mData[i][2] ? new Date(mData[i][2]) : new Date(0));
              }
          }
      } else { return createSuccessResponse({ leaderboard: [] }); }
  }

  // Load Profile Data to build User Map
  const data = profileSheet.getRange(2, 1, profileSheet.getLastRow() - 1, 25).getValues();
  const users = {}; 
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); 

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const username = String(row[1] || '').trim(); // Normalized username
    if (!username) continue; 
    
    // If viewing group leaderboard, skip non-members
    if (groupId && (!groupMemberJoinDates || !groupMemberJoinDates.has(username))) continue;

    // Filter out Admins from leaderboard
    const role = String(row[11] || '').toLowerCase(); 
    // FIX: Only filter admins if NOT viewing a specific group (Global View)
    // This allows admins to see themselves in "My Group" leaderboard
    if (!groupId && role === 'admin') continue;

    const timestamp = new Date(row[0]);
    const xp = Number(row[12] || 0); // Total XP in this row (Snapshot)
    const deltaXp = isNaN(Number(row[24])) ? 0 : Number(row[24]); // Delta XP added in this row

    if (!users[username]) {
      users[username] = { username: username, displayName: row[2], profilePicture: row[3], organization: row[23], xp: 0, level: 1, weeklyXp: 0, groupXp: 0 };
    }
    // Update latest profile info
    users[username].displayName = row[2];
    users[username].profilePicture = row[3];
    users[username].organization = row[23];
    
    // Update Max XP found (Total XP)
    if (xp > users[username].xp) {
      users[username].xp = xp;
      users[username].level = Number(row[13] || 1);
    }
    
    // Calculate Weekly XP Trend
    if (timestamp >= oneWeekAgo) users[username].weeklyXp += deltaXp; 
    
    // Calculate Group XP (XP earned since joining)
    if (groupId && groupMemberJoinDates) {
        const joinDate = groupMemberJoinDates.get(username);
        if (timestamp >= joinDate) users[username].groupXp += deltaXp;
    }
  }

  const userArray = Object.values(users);
  
  if (groupId) {
      // Return specific group leaderboard sorted by Group XP
      return createSuccessResponse({ apiVersion: "v20.9-GROUP", leaderboard: [...userArray].sort((a, b) => b.groupXp - a.groupXp) });
  }

  // --- GLOBAL CATEGORY AGGREGATION ---
  const catWater = {};
  const catFood = {};
  const catActivity = {};

  const aggregate = (sheetName, type, colIndex, isCount) => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 1) {
          // Read all data from sheet
          const vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
          for (let r of vals) {
              const u = String(r[1] || '').trim(); // Normalize username from history row
              
              // Skip if user not found in profile list (e.g. admin or deleted)
              if (!users[u]) continue; 
              
              if (isCount) {
                  if (type === 'food') catFood[u] = (catFood[u] || 0) + 1;
              } else {
                  const val = Number(r[colIndex]) || 0;
                  if (type === 'water') catWater[u] = (catWater[u] || 0) + val;
                  if (type === 'activity') catActivity[u] = (catActivity[u] || 0) + val;
              }
          }
      }
  };

  aggregate(SHEET_NAMES.WATER, 'water', 4, false); // Col E (Index 4) = Amount
  aggregate(SHEET_NAMES.FOOD, 'food', 0, true); // Count Rows (FoodHistory)
  aggregate(SHEET_NAMES.CALORIE, 'food', 0, true); // Count Rows (CalorieHistory)
  aggregate(SHEET_NAMES.ACTIVITY, 'activity', 5, false); // Col F (Index 5) = Calories

  const formatCat = (mapObj) => {
      return Object.keys(mapObj).map(u => ({
          username: u,
          displayName: users[u] ? users[u].displayName : u,
          profilePicture: users[u] ? users[u].profilePicture : '',
          organization: users[u] ? users[u].organization : '',
          score: mapObj[u],
          xp: users[u] ? users[u].xp : 0
      })).sort((a,b) => b.score - a.score).slice(0, 50);
  };

  let categories = {
      water: formatCat(catWater),
      food: formatCat(catFood),
      activity: formatCat(catActivity)
  };

  const leaderboard = [...userArray].sort((a, b) => b.xp - a.xp).slice(0, 50);
  const trending = [...userArray].sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 50);

  return createSuccessResponse({ apiVersion: "v20.9-GLOBAL", leaderboard, trending, categories });
}

// --- Data Persistence & Reset ---

function handleSave(type, payload, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetName = "";
  if (type === 'profile') sheetName = SHEET_NAMES.PROFILE;
  else if (type === 'loginLog') sheetName = SHEET_NAMES.LOGIN_LOGS; 
  else if (Object.values(SHEET_NAMES).includes(type)) sheetName = type;
  else if (type === 'feedback') sheetName = SHEET_NAMES.FEEDBACK;
  else {
      const key = Object.keys(SHEET_NAMES).find(k => k.toLowerCase() === type.toLowerCase().replace('history',''));
      if (key) sheetName = SHEET_NAMES[key];
      else sheetName = type.charAt(0).toUpperCase() + type.slice(1);
  }

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const timestamp = new Date();
  const item = Array.isArray(payload) ? payload[0] : payload;
  const commonPrefix = [timestamp, user.username, user.displayName, user.profilePicture];
  let newRow = [];

  switch (sheetName) {
    case SHEET_NAMES.PROFILE:
      newRow = [ 
          timestamp, user.username, item.displayName || user.displayName, item.profilePicture || user.profilePicture,
          item.gender || '', item.age || '', item.weight || '', item.height || '',
          item.waist || '', item.hip || '', item.activityLevel || '',
          user.role || 'user', item.xp || 0, item.level || 1, JSON.stringify(item.badges || []),
          item.email || user.email || '', '', item.healthCondition || '', item.lineUserId || '',
          item.receiveDailyReminders !== undefined ? item.receiveDailyReminders : true,
          item.researchId || '', item.pdpaAccepted || false, item.pdpaAcceptedDate || '',
          item.organization || 'general', item.deltaXp || 0
      ];
      break;
    case SHEET_NAMES.LOGIN_LOGS: newRow = [timestamp, user.username, user.displayName, user.role, user.organization || 'general']; break;
    case SHEET_NAMES.BMI: newRow = [...commonPrefix, item.value, item.category]; break;
    case SHEET_NAMES.TDEE: newRow = [...commonPrefix, item.value, item.bmr]; break;
    case SHEET_NAMES.FOOD: newRow = [...commonPrefix, item.analysis.description, item.analysis.calories, JSON.stringify(item.analysis)]; break;
    case SHEET_NAMES.WATER: newRow = [...commonPrefix, item.amount]; break;
    case SHEET_NAMES.CALORIE: newRow = [...commonPrefix, item.name, item.calories, item.image || '', item.imageHash || '']; break;
    case SHEET_NAMES.ACTIVITY: newRow = [...commonPrefix, item.name, item.caloriesBurned, item.duration || '', item.distance || '', item.image || '', item.imageHash || '']; break;
    case SHEET_NAMES.SLEEP: newRow = [...commonPrefix, item.bedTime, item.wakeTime, item.duration, item.quality, JSON.stringify(item.hygieneChecklist)]; break;
    case SHEET_NAMES.MOOD: newRow = [...commonPrefix, item.moodEmoji, item.stressLevel, item.gratitude]; break;
    case SHEET_NAMES.HABIT: newRow = [...commonPrefix, item.type, item.amount, item.isClean]; break;
    case SHEET_NAMES.SOCIAL: newRow = [...commonPrefix, item.interaction, item.feeling]; break;
    case SHEET_NAMES.PLANNER: newRow = [...commonPrefix, item.cuisine, item.diet, item.tdee, JSON.stringify(item.plan)]; break;
    case SHEET_NAMES.EVALUATION: newRow = [timestamp, user.username, user.displayName, user.role, JSON.stringify(item.satisfaction || {}), JSON.stringify(item.outcomes || {})]; break;
    case 'QuizHistory': newRow = [timestamp, user.username, item.score, item.totalQuestions, item.correctAnswers, item.type, item.weekNumber]; break;
    case SHEET_NAMES.REDEMPTION: newRow = [...commonPrefix, item.rewardId, item.rewardName, item.cost]; break;
    case SHEET_NAMES.FEEDBACK: newRow = [timestamp, user.username, user.displayName, item.category, item.message, item.rating, 'Pending']; break;
    default: newRow = [timestamp, user.username, JSON.stringify(item)];
  }
  
  sheet.appendRow(newRow);
  return createSuccessResponse({ status: "Saved" });
}

function handleClear(type, user) {
  let sheetName = Object.values(SHEET_NAMES).includes(type) ? type : (SHEET_NAMES[type.toUpperCase()] || type);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return createSuccessResponse({ status: "Sheet not found" });
  
  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = [];
  for (let i = 1; i < data.length; i++) { if (data[i][1] === user.username) rowsToDelete.push(i + 1); }
  for (let i = rowsToDelete.length - 1; i >= 0; i--) { sheet.deleteRow(rowsToDelete[i]); }
  return createSuccessResponse({ status: "Cleared" });
}

function handleResetUser(user, targetUsername) {
    let usernameToReset = user.username;
    if (targetUsername && targetUsername !== user.username) {
        if (user.role === 'admin' && user.organization === 'all') {
            usernameToReset = targetUsername;
        } else {
            return createErrorResponse("Permission Denied: คุณไม่มีสิทธิ์รีเซตข้อมูลผู้ใช้อื่น");
        }
    }

    if (!usernameToReset || String(usernameToReset).trim() === "") {
        return createErrorResponse("Security Error: ไม่พบข้อมูลผู้ใช้เป้าหมาย (Invalid Target)");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Reset Stats in Profile Sheet
    const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
    if (profileSheet) {
        const data = profileSheet.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
            if (data[i][1] === usernameToReset) { 
                const rowIdx = i + 1;
                profileSheet.getRange(rowIdx, 13).setValue(0); // XP
                profileSheet.getRange(rowIdx, 14).setValue(1); // Level
                profileSheet.getRange(rowIdx, 15).setValue('["novice"]'); // Badges
                profileSheet.getRange(rowIdx, 25).setValue(0); // Delta XP
                // Keep personal data (age, height, weight, org)
                break;
            }
        }
    }

    // 2. Delete History in other sheets
    const sheetsToClear = [
        SHEET_NAMES.BMI, SHEET_NAMES.TDEE, SHEET_NAMES.FOOD, SHEET_NAMES.PLANNER,
        SHEET_NAMES.WATER, SHEET_NAMES.CALORIE, SHEET_NAMES.ACTIVITY, SHEET_NAMES.SLEEP,
        SHEET_NAMES.MOOD, SHEET_NAMES.HABIT, SHEET_NAMES.SOCIAL, SHEET_NAMES.EVALUATION,
        "QuizHistory", SHEET_NAMES.REDEMPTION, SHEET_NAMES.FEEDBACK
    ];

    sheetsToClear.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (sheet && sheet.getLastRow() > 1) {
            const data = sheet.getDataRange().getValues();
            for (let i = data.length - 1; i >= 1; i--) {
                if (data[i][1] === usernameToReset) {
                    sheet.deleteRow(i + 1);
                }
            }
        }
    });

    return createSuccessResponse({ status: "Reset Complete", target: usernameToReset });
}

function handleSystemFactoryReset(adminUser) {
    if (adminUser.role !== 'admin' || adminUser.organization !== 'all') {
        return createErrorResponse("CRITICAL: Permission Denied. Super Admin only.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Reset ALL Profiles (Reset XP/Level only, keep accounts)
    const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
    if (profileSheet && profileSheet.getLastRow() > 1) {
        const lastRow = profileSheet.getLastRow();
        const numRows = lastRow - 1;
        profileSheet.getRange(2, 13, numRows, 1).setValue(0); // XP
        profileSheet.getRange(2, 14, numRows, 1).setValue(1); // Level
        profileSheet.getRange(2, 15, numRows, 1).setValue('["novice"]'); // Badges
        profileSheet.getRange(2, 25, numRows, 1).setValue(0); // Delta
    }

    // 2. Clear ALL History Sheets completely
    const sheetsToClear = [
        SHEET_NAMES.BMI, SHEET_NAMES.TDEE, SHEET_NAMES.FOOD, SHEET_NAMES.PLANNER,
        SHEET_NAMES.WATER, SHEET_NAMES.CALORIE, SHEET_NAMES.ACTIVITY, SHEET_NAMES.SLEEP,
        SHEET_NAMES.MOOD, SHEET_NAMES.HABIT, SHEET_NAMES.SOCIAL, SHEET_NAMES.EVALUATION,
        "QuizHistory", SHEET_NAMES.REDEMPTION, SHEET_NAMES.FEEDBACK
    ];

    sheetsToClear.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (sheet) {
            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
                sheet.deleteRows(2, lastRow - 1);
            }
        }
    });

    return createSuccessResponse({ status: "System Factory Reset Complete" });
}

// --- Auth & Data Fetching ---

function handleSocialAuth(payload) {
    const userInfo = payload;
    if (!userInfo) return createErrorResponse("Missing user info");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    let foundRowIndex = -1;
    let userData = null;
    
    for (let i = 1; i < data.length; i++) {
        let json = {};
        try { json = JSON.parse(data[i][3]); } catch(e) {}
        if (data[i][0] === userInfo.email || json.userId === userInfo.userId) {
            foundRowIndex = i + 1;
            userData = json;
            break;
        }
    }
    if (userData) {
        if (userInfo.picture && userData.profilePicture !== userInfo.picture) {
            userData.profilePicture = userInfo.picture;
            sheet.getRange(foundRowIndex, 4).setValue(JSON.stringify(userData));
        }
        logLogin(userData);
        return createSuccessResponse({ success: true, user: userData });
    } else {
        const username = (userInfo.provider || 'social') + '_' + Date.now();
        userData = { username, displayName: userInfo.name, profilePicture: userInfo.picture, role: 'user', email: userInfo.email, organization: 'general', authProvider: userInfo.provider, userId: userInfo.userId };
        sheet.appendRow([userInfo.email, 'SOCIAL_LOGIN', username, JSON.stringify(userData), new Date()]);
        handleSave('profile', { xp: 0, level: 1, badges: ['novice'], receiveDailyReminders: true, lineUserId: userInfo.userId, organization: 'general' }, userData);
        logLogin(userData);
        return createSuccessResponse({ success: true, user: userData });
    }
}

function handleVerifyUser(email, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) return createErrorResponse({ message: "Users sheet missing" });
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === email && String(data[i][1]) === String(password)) {
            const user = JSON.parse(data[i][3]);
            logLogin(user);
            return createSuccessResponse({ success: true, user: user });
        }
    }
    return createErrorResponse("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
}

function handleRegisterUser(user, password) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === user.email) return createErrorResponse("อีเมลนี้มีในระบบแล้ว");
    }
    const safeUser = { ...user, role: user.role || 'user' };
    sheet.appendRow([user.email, password, user.username, JSON.stringify(safeUser), new Date()]);
    handleSave('profile', { displayName: user.displayName, xp: 0, level: 1, badges: ['novice'], receiveDailyReminders: true, organization: user.organization || 'general' }, safeUser);
    return createSuccessResponse({ status: "Registered" });
}

function logLogin(user) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.LOGIN_LOGS) || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAMES.LOGIN_LOGS);
    sheet.appendRow([new Date(), user.username, user.displayName, user.role, user.organization || 'general']);
}

function handleAdminLogin(token) {
    if (token === ADMIN_KEY) return createSuccessResponse({ username: "admin_super", displayName: "Super Admin", role: "admin", organization: "all", profilePicture: "🛡️" });
    const orgId = ORG_ADMIN_KEYS[token];
    if (orgId) return createSuccessResponse({ username: "admin_" + orgId, displayName: "Admin: " + orgId, role: "admin", organization: orgId, profilePicture: "👨‍💼" });
    return createErrorResponse("รหัสผ่านไม่ถูกต้อง");
}

// --- Data Fetching Helpers ---

function getUserFullData(username) {
    return {
      profile: getLatestProfileForUser(username),
      bmiHistory: getAllHistoryForUser(SHEET_NAMES.BMI, username),
      tdeeHistory: getAllHistoryForUser(SHEET_NAMES.TDEE, username),
      foodHistory: getAllHistoryForUser(SHEET_NAMES.FOOD, username),
      plannerHistory: getAllHistoryForUser(SHEET_NAMES.PLANNER, username),
      waterHistory: getAllHistoryForUser(SHEET_NAMES.WATER, username),
      calorieHistory: getAllHistoryForUser(SHEET_NAMES.CALORIE, username),
      activityHistory: getAllHistoryForUser(SHEET_NAMES.ACTIVITY, username),
      sleepHistory: getAllHistoryForUser(SHEET_NAMES.SLEEP, username),
      moodHistory: getAllHistoryForUser(SHEET_NAMES.MOOD, username),
      habitHistory: getAllHistoryForUser(SHEET_NAMES.HABIT, username),
      socialHistory: getAllHistoryForUser(SHEET_NAMES.SOCIAL, username),
      evaluationHistory: getAllHistoryForUser(SHEET_NAMES.EVALUATION, username),
      quizHistory: getAllHistoryForUser('QuizHistory', username),
      redemptionHistory: getAllHistoryForUser(SHEET_NAMES.REDEMPTION, username)
    };
}

function getLatestProfileForUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROFILE);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const userRows = data.filter(row => row[1] === username);
  if (userRows.length === 0) return null;
  const lastEntry = userRows[userRows.length - 1];
  let badges = [];
  try { badges = JSON.parse(lastEntry[14] || '["novice"]'); } catch(e) { badges = ['novice']; }
  return { 
      username: lastEntry[1], displayName: lastEntry[2], profilePicture: lastEntry[3],
      gender: lastEntry[4], age: lastEntry[5], weight: lastEntry[6], height: lastEntry[7], 
      waist: lastEntry[8], hip: lastEntry[9], activityLevel: lastEntry[10], 
      xp: Number(lastEntry[12] || 0), level: Number(lastEntry[13] || 1), badges: badges, 
      email: lastEntry[15], healthCondition: lastEntry[17], lineUserId: lastEntry[18], 
      receiveDailyReminders: String(lastEntry[19]).toLowerCase() !== 'false', 
      researchId: lastEntry[20], pdpaAccepted: lastEntry[21], pdpaAcceptedDate: lastEntry[22], 
      organization: lastEntry[23] || 'general', birthDate: lastEntry[25], targetWeight: lastEntry[26] 
  };
}

function getAllHistoryForUser(sheetName, username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const rows = data.filter(row => row[1] === username);
  try {
    if (sheetName === SHEET_NAMES.BMI) return rows.map(r => ({ date: new Date(r[0]).toISOString(), value: r[4], category: r[5] }));
    if (sheetName === SHEET_NAMES.TDEE) return rows.map(r => ({ date: new Date(r[0]).toISOString(), value: r[4], bmr: r[5] }));
    if (sheetName === SHEET_NAMES.WATER) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], amount: r[4] }));
    if (sheetName === SHEET_NAMES.CALORIE) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], name: r[4], calories: r[5], image: r[6], imageHash: r[7] }));
    if (sheetName === SHEET_NAMES.ACTIVITY) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], name: r[4], caloriesBurned: r[5], duration: r[6], distance: r[7], image: r[8], imageHash: r[9] }));
    if (sheetName === SHEET_NAMES.FOOD) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], analysis: JSON.parse(r[6]) }));
    if (sheetName === SHEET_NAMES.SLEEP) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], bedTime: r[4], wakeTime: r[5], duration: r[6], quality: r[7], hygieneChecklist: JSON.parse(r[8] || "[]") }));
    if (sheetName === SHEET_NAMES.MOOD) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], moodEmoji: r[4], stressLevel: r[5], gratitude: r[6] }));
    if (sheetName === SHEET_NAMES.HABIT) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], type: r[4], amount: r[5], isClean: r[6] }));
    if (sheetName === SHEET_NAMES.SOCIAL) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], interaction: r[4], feeling: r[5] }));
    if (sheetName === SHEET_NAMES.PLANNER) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], cuisine: r[4], diet: r[5], tdee: r[6], plan: JSON.parse(r[7]) }));
    if (sheetName === SHEET_NAMES.EVALUATION) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], satisfaction: JSON.parse(r[4]||'{}'), outcomes: JSON.parse(r[5]||'{}') }));
    if (sheetName === 'QuizHistory') return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], score: r[4], totalQuestions: r[5], correctAnswers: r[6], type: r[7], weekNumber: r[8] }));
    if (sheetName === SHEET_NAMES.REDEMPTION) return rows.map(r => ({ date: new Date(r[0]).toISOString(), id: r[0], rewardId: r[4], rewardName: r[5], cost: r[6] })); 
    return [];
  } catch(e) { return []; }
}

function handleGetUserDataForAdmin(targetUsername) {
    if(!targetUsername) return createErrorResponse("Target username required");
    return createSuccessResponse(getUserFullData(targetUsername));
}

function handleAdminFetch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = { stats: {} };
  
  const fetchConfig = [
      { name: SHEET_NAMES.PROFILE, key: 'profiles', limit: null },
      { name: SHEET_NAMES.GROUPS, key: 'groups', limit: null },
      { name: SHEET_NAMES.GROUP_MEMBERS, key: 'groupMembers', limit: null }, // Add Group Members
      { name: SHEET_NAMES.FOOD, key: 'foodHistory', limit: 500 },
      { name: SHEET_NAMES.ACTIVITY, key: 'activityHistory', limit: 500 },
      { name: SHEET_NAMES.BMI, key: 'bmiHistory', limit: 500 },
      { name: SHEET_NAMES.EVALUATION, key: 'evaluationHistory', limit: 500 },
      { name: SHEET_NAMES.LOGIN_LOGS, key: 'loginLogs', limit: 100 }
  ];

  fetchConfig.forEach(conf => {
      const sheet = ss.getSheetByName(conf.name);
      if (!sheet || sheet.getLastRow() < 2) {
          result[conf.key] = [];
          result.stats[conf.key] = 0;
      } else {
          const lastRow = sheet.getLastRow();
          const count = lastRow - 1;
          result.stats[conf.key] = count;
          
          let dataRange;
          if (conf.limit && count > conf.limit) {
              const startRow = lastRow - conf.limit + 1;
              dataRange = sheet.getRange(startRow, 1, conf.limit, sheet.getLastColumn());
          } else {
              dataRange = sheet.getRange(2, 1, count, sheet.getLastColumn());
          }
          
          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          const values = dataRange.getValues();
          
          result[conf.key] = values.map(row => {
              let obj = {};
              headers.forEach((h, i) => obj[h] = row[i]);
              return obj;
          });
          
          if (conf.limit) {
              result[conf.key].reverse();
          }
      }
  });

  return createSuccessResponse(result);
}

// --- LINE Integration ---

function handleLineWebhook(events) {
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.type === 'message' && event.message.type === 'text') {
      var userMessage = event.message.text.trim();
      if (userMessage.includes("ชีวิตดี...ที่สตูล")) {
        replyFlexMessage(event.replyToken);
      }
    }
  }
}

function replyFlexMessage(replyToken) {
  var url = 'https://api.line.me/v2/bot/message/reply';
  var flexMessage = getDailyFlexMessage();
  var payload = { replyToken: replyToken, messages: [flexMessage] };
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {}
}

function handleTestNotification(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        sendLinePush(profile.lineUserId, [{ type: 'text', text: '✅ ทดสอบการแจ้งเตือนจาก Satun Smart Life สำเร็จ!' }]);
        return createSuccessResponse({ status: "Sent" });
    }
    return createErrorResponse("ไม่พบ LINE ID หรือไม่เคย Login ด้วย LINE");
}

function handleNotifyComplete(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        sendLinePush(profile.lineUserId, [{ type: 'text', text: '🎉 ภารกิจวันนี้สำเร็จแล้ว! ยอดเยี่ยมมากครับ' }]);
        return createSuccessResponse({ status: "Sent" });
    }
    return createSuccessResponse({ status: "No ID" });
}

function sendLinePush(userId, messages) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return;
    try {
        UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
            method: 'post',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
            payload: JSON.stringify({ to: userId, messages: messages }),
            muteHttpExceptions: true
        });
    } catch (e) {}
}

function getDailyFlexMessage() {
  const date = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateString = date.toLocaleDateString('th-TH', options);
  return {
    "type": "flex",
    "altText": "อรุณสวัสดิ์! ถึงเวลาดูแลสุขภาพกับ Satun Smart Life",
    "contents": {
      "type": "bubble",
      "size": "giga",
      "header": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "SATUN HEALTHY LIFE", "weight": "bold", "color": "#1F2937", "size": "xs", "align": "center" },
          { "type": "text", "text": "อรุณสวัสดิ์ชาวสตูล! ☀️", "weight": "bold", "size": "xl", "margin": "md", "align": "center", "color": "#0D9488" },
          { "type": "text", "text": dateString, "size": "xs", "color": "#6B7280", "align": "center", "margin": "sm" }
        ],
        "backgroundColor": "#F0FDFA", "paddingTop": "20px", "paddingBottom": "20px"
      },
      "hero": {
        "type": "image", "url": "https://images.unsplash.com/photo-1540206395-688085723adb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "size": "full", "aspectRatio": "20:13", "aspectMode": "cover"
      },
      "body": {
        "type": "box", "layout": "vertical",
        "contents": [
          { "type": "text", "text": "เริ่มต้นวันใหม่ด้วยสุขภาพที่ดี", "weight": "bold", "size": "md", "align": "center" },
          { "type": "text", "text": "อย่าลืมดื่มน้ำสะอาด 1 แก้วหลังตื่นนอน และบันทึกข้อมูลสุขภาพของคุณวันนี้นะคะ 💪", "size": "sm", "color": "#6B7280", "align": "center", "wrap": true, "margin": "md" },
          { "type": "separator", "margin": "xl" },
          {
            "type": "box", "layout": "horizontal", "margin": "lg", "spacing": "sm",
            "contents": [
              { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "🍎", "align": "center", "size": "xl" }, { "type": "text", "text": "โภชนาการ", "align": "center", "size": "xxs", "color": "#9CA3AF" }] },
              { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "💧", "align": "center", "size": "xl" }, { "type": "text", "text": "ดื่มน้ำ", "align": "center", "size": "xxs", "color": "#9CA3AF" }] },
              { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "🏃", "align": "center", "size": "xl" }, { "type": "text", "text": "ขยับกาย", "align": "center", "size": "xxs", "color": "#9CA3AF" }] },
              { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "😊", "align": "center", "size": "xl" }, { "type": "text", "text": "อารมณ์", "align": "center", "size": "xxs", "color": "#9CA3AF" }] }
            ]
          }
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "spacing": "sm",
        "contents": [
          { "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "เปิดแอปเพื่อบันทึกข้อมูล", "uri": LIFF_URL }, "color": "#0D9488" },
          {
            "type": "box", "layout": "horizontal", "spacing": "sm", "margin": "sm",
            "contents": [
               { "type": "button", "style": "secondary", "height": "sm", "action": { "type": "uri", "label": "คำนวณ BMI", "uri": LIFF_URL + "?view=bmi" }, "color": "#F472B6" },
               { "type": "button", "style": "secondary", "height": "sm", "action": { "type": "uri", "label": "คำนวณ TDEE", "uri": LIFF_URL + "?view=tdee" }, "color": "#FBBF24" }
            ]
          },
          { "type": "box", "layout": "vertical", "contents": [], "margin": "sm" }
        ],
        "paddingAll": "20px"
      }
    }
  };
}

// --- Setup ---

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ensureSheet = (name, headers) => {
      let sheet = ss.getSheetByName(name);
      if (!sheet) {
          sheet = ss.insertSheet(name);
          if (headers) {
              sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
              sheet.setFrozenRows(1);
          }
      }
      return sheet;
  };

  ensureSheet(SHEET_NAMES.PROFILE, ["timestamp", "username", "displayName", "profilePicture", "gender", "age", "weight", "height", "waist", "hip", "activityLevel", "role", "xp", "level", "badges", "email", "password", "healthCondition", "lineUserId", "receiveDailyReminders", "researchId", "pdpaAccepted", "pdpaAcceptedDate", "organization", "deltaXp"]);
  ensureSheet(SHEET_NAMES.USERS, ["email", "password", "username", "userDataJson", "timestamp"]);
  ensureSheet(SHEET_NAMES.LOGIN_LOGS, ["timestamp", "username", "displayName", "role", "organization"]);
  ensureSheet(SHEET_NAMES.GROUPS, ["GroupId", "Name", "Code", "Description", "LineLink", "AdminUsername", "CreatedAt", "Image"]);
  ensureSheet(SHEET_NAMES.GROUP_MEMBERS, ["GroupId", "Username", "JoinedAt"]);
  
  // History Sheets
  const common = ["timestamp", "username", "displayName", "profilePicture"];
  ensureSheet(SHEET_NAMES.BMI, [...common, "value", "category"]);
  ensureSheet(SHEET_NAMES.TDEE, [...common, "value", "bmr"]);
  ensureSheet(SHEET_NAMES.FOOD, [...common, "description", "calories", "analysis_json"]);
  ensureSheet(SHEET_NAMES.WATER, [...common, "amount"]);
  ensureSheet(SHEET_NAMES.CALORIE, [...common, "name", "calories", "image", "imageHash"]);
  ensureSheet(SHEET_NAMES.ACTIVITY, [...common, "name", "caloriesBurned", "duration", "distance", "image", "imageHash"]);
  ensureSheet(SHEET_NAMES.SLEEP, [...common, "bedTime", "wakeTime", "duration", "quality", "hygieneChecklist"]);
  ensureSheet(SHEET_NAMES.MOOD, [...common, "moodEmoji", "stressLevel", "gratitude"]);
  ensureSheet(SHEET_NAMES.HABIT, [...common, "type", "amount", "isClean"]);
  ensureSheet(SHEET_NAMES.SOCIAL, [...common, "interaction", "feeling"]);
  ensureSheet(SHEET_NAMES.EVALUATION, ["timestamp", "username", "displayName", "role", "satisfaction_json", "outcomes_json"]);
  ensureSheet(SHEET_NAMES.REDEMPTION, [...common, "rewardId", "rewardName", "cost"]); 
  ensureSheet(SHEET_NAMES.FEEDBACK, ["timestamp", "username", "displayName", "category", "message", "rating", "status"]); // ADDED FEEDBACK SHEET
  
  return "Setup Complete (v20.9.2) - Ready for Production";
}
