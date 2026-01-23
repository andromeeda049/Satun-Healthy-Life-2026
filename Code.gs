
/**
 * Satun Smart Life - Backend Script (Full Version)
 * รวม Database Logic และ LINE Notification ไว้ในไฟล์เดียว
 */

// --- CONFIGURATION ---

// อ่านค่า ADMIN_KEY (Super Admin) จาก Script Properties
const ADMIN_KEY = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');

// อ่านค่า Token จาก Script Properties
const LINE_CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');

// รหัสผ่านสำหรับหน่วยงานต่างๆ (ย้ายมาจาก Frontend เพื่อความปลอดภัย)
// สามารถเพิ่ม/ลบ ได้ที่นี่โดยตรง
const ORG_ADMIN_KEYS = {
    // Provincial Health Office
    "PHO@SATUN": "pho_satun",
    "ADMIN@PHO": "pho_satun",

    // Hospitals (รพ.)
    "HOSP@SATUN": "hosp_satun",
    "ADMIN@HOSP_SATUN": "hosp_satun",
    "ADMIN@HOSP_KHUANDON": "hosp_khuandon",
    "ADMIN@HOSP_LANGU": "hosp_la-ngu",
    "ADMIN@HOSP_THUNGWA": "hosp_thungwa",
    "ADMIN@HOSP_MANANG": "hosp_manang",
    "ADMIN@HOSP_KK": "hosp_khuan-kalong",
    "ADMIN@HOSP_TP": "hosp_tha-phae",

    // District Health Offices (สสอ.)
    "DHO@MUANG": "dho_muang",
    "ADMIN@DHO_MUANG": "dho_muang",
    "ADMIN@DHO_KHUANDON": "dho_khuandon",
    "ADMIN@DHO_LANGU": "dho_la-ngu",
    "ADMIN@DHO_THUNGWA": "dho_thungwa",
    "ADMIN@DHO_MANANG": "dho_manang",
    "ADMIN@DHO_KK": "dho_khuan-kalong",
    "ADMIN@DHO_TP": "dho_tha-phae",

    // General
    "ADMIN@GENERAL": "general"
};

const LIFF_URL = "https://liff.line.me/2008705690-V5wrjpTX";

// ใส่ User ID หรือ Group ID ที่ต้องการทดสอบ (Hardcoded ตามคำขอ)
const TEST_USER_ID = "Cdb8b546cd472f54247f723964826da43"; 

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
  REDEMPTION: "RedemptionHistory"
};

// --- 1. CORE HANDLERS (DoGet / DoPost) ---

function doGet(e) {
  // ใช้สำหรับตรวจสอบว่า Web App ทำงานอยู่หรือไม่
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
      return ContentService.createTextOutput("Satun Smart Life API is Running...").setMimeType(ContentService.MimeType.TEXT);
  }
  return handleRequest(e, 'GET');
}

function doPost(e) {
  // ตอบ 200 OK เสมอ เพื่อให้ LINE Verify ผ่านและไม่เกิด Error สีแดงใน Console
  var output = ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);

  try {
    if (!e || !e.postData || !e.postData.contents) return output;

    const contents = JSON.parse(e.postData.contents);

    // A. กรณีเป็น LINE Webhook (มี events)
    if (contents.events) {
      // ตรวจสอบว่าเป็น Verify Event หรือไม่ (ReplyToken เป็น 0000... หรือ ffff...)
      if (contents.events.length > 0) {
        const replyToken = contents.events[0].replyToken;
        if (replyToken === '00000000000000000000000000000000' || replyToken === 'ffffffffffffffffffffffffffffffff') {
           Logger.log("Verify Event Received - Skipping Logic");
           return output; // จบการทำงานทันทีถ้าเป็น Verify Event
        }
      }
      
      handleLineWebhook(contents.events);
      return output;
    }

    // B. กรณีเป็น API เรียกจาก React App (มี action)
    return handleRequest(e, 'POST');

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    // ถ้าเป็น API React ให้ส่ง Error กลับไปให้ Frontend รู้
    if (e.postData && e.postData.contents && !e.postData.contents.includes('"events":')) {
        return createErrorResponse(error);
    }
    // ถ้าเป็น LINE ให้เงียบไว้และส่ง 200 OK
    return output;
  }
}

// --- 2. LINE WEBHOOK LOGIC ---

function handleLineWebhook(events) {
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    
    // Log User ID เพื่อนำไปใส่ใน TEST_USER_ID
    if (event.source && event.source.userId) {
        Logger.log("User ID: " + event.source.userId);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      var userMessage = event.message.text.trim();
      
      // Logic การตอบกลับ Keyword (แก้ไขตามคำขอ: เอาเฉพาะ "ชีวิตดี...ที่สตูล")
      if (userMessage.includes("ชีวิตดี...ที่สตูล")) {
        replyFlexMessage(event.replyToken);
      }
    }
  }
}

function replyFlexMessage(replyToken) {
  var url = 'https://api.line.me/v2/bot/message/reply';
  var flexMessage = getDailyFlexMessage();
  
  var payload = {
    replyToken: replyToken,
    messages: [flexMessage]
  };

  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log("Error replying to LINE: " + e.toString());
  }
}

// --- 3. TEST FUNCTION (Run this manually) ---

function testLinePush() {
  if (!TEST_USER_ID) {
    Logger.log("❌ กรุณาใส่ User ID ของคุณในตัวแปร TEST_USER_ID ด้านบนก่อนกด Run (ดู ID จาก Logger)");
    return;
  }
  
  var flexMessage = getDailyFlexMessage();
  sendLinePush(TEST_USER_ID, [flexMessage]);
  Logger.log("✅ ทดสอบส่งข้อความไปยัง " + TEST_USER_ID + " แล้ว");
}

function sendLinePush(userId, messages) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) return;
    try {
        var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
            method: 'post',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
            payload: JSON.stringify({ to: userId, messages: messages }),
            muteHttpExceptions: true
        });
        Logger.log("Push Response: " + response.getContentText());
    } catch (e) { Logger.log("Push Error: " + e.toString()); }
}

// --- 4. FLEX MESSAGE TEMPLATE ---

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
        "backgroundColor": "#F0FDFA",
        "paddingTop": "20px",
        "paddingBottom": "20px"
      },
      "hero": {
        "type": "image",
        "url": "https://images.unsplash.com/photo-1540206395-688085723adb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "เริ่มต้นวันใหม่ด้วยสุขภาพที่ดี", "weight": "bold", "size": "md", "align": "center" },
          { "type": "text", "text": "อย่าลืมดื่มน้ำสะอาด 1 แก้วหลังตื่นนอน และบันทึกข้อมูลสุขภาพของคุณวันนี้นะคะ 💪", "size": "sm", "color": "#6B7280", "align": "center", "wrap": true, "margin": "md" },
          { "type": "separator", "margin": "xl" },
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "lg",
            "spacing": "sm",
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
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "style": "primary",
            "height": "sm",
            "action": { "type": "uri", "label": "เปิดแอปเพื่อบันทึกข้อมูล", "uri": LIFF_URL },
            "color": "#0D9488"
          },
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "sm",
            "margin": "sm",
            "contents": [
               {
                 "type": "button",
                 "style": "secondary",
                 "height": "sm",
                 "action": { "type": "uri", "label": "คำนวณ BMI", "uri": LIFF_URL + "?view=bmi" },
                 "color": "#F472B6"
               },
               {
                 "type": "button",
                 "style": "secondary",
                 "height": "sm",
                 "action": { "type": "uri", "label": "คำนวณ TDEE", "uri": LIFF_URL + "?view=tdee" },
                 "color": "#FBBF24"
               }
            ]
          },
          { "type": "box", "layout": "vertical", "contents": [], "margin": "sm" }
        ],
        "paddingAll": "20px"
      }
    }
  };
}

// --- 5. APP LOGIC HANDLERS (Database) ---

function handleRequest(e, method) {
  try {
    const params = method === 'POST' ? JSON.parse(e.postData.contents) : e.parameter;
    const action = params.action;
    const user = params.user;
    
    // 1. PUBLIC ACTIONS
    if (action === 'getConfig') return handleGetConfig();
    
    // ตรวจสอบ ADMIN_KEY ทั้งจาก Params และ Environment Variables
    if (action === 'getAllData' || action === 'getAllAdminData') {
       const requestAdminKey = params.adminKey;
       // ตรวจสอบว่าเป็น Super Admin Key หรือ Org Admin Key ที่ถูกต้อง
       if (requestAdminKey === ADMIN_KEY || ORG_ADMIN_KEYS[requestAdminKey]) {
           return handleAdminFetch();
       } else {
           return createErrorResponse("Invalid Admin Key");
       }
    }

    if (action === 'adminLogin') return handleAdminLogin(params.password);
    if (action === 'verifyUser') return handleVerifyUser(params.email, params.password);
    if (action === 'register') return handleRegisterUser(params.user, params.password);
    if (action === 'socialAuth') return handleSocialAuth(params.payload || params.profile);
    if (action === 'getLeaderboard') return handleGetLeaderboardJS(params.groupId); 

    // 2. ACTIONS REQUIRING USER
    if (user) {
        if (action === 'createGroup') return handleCreateGroup(params.groupData, user);
        if (action === 'joinGroup') return handleJoinGroup(params.code, user);
        if (action === 'leaveGroup') return handleLeaveGroup(params.groupId, user);
        if (action === 'getUserGroups') return handleGetUserGroups(user);
        if (action === 'getAdminGroups') return handleGetAdminGroups(user);
        if (action === 'getGroupMembers') return handleGetGroupMembers(params.groupId, user); 
        
        if (action === 'getUserData') {
           return handleGetUserDataForAdmin(params.targetUsername);
        }
    
        if (action === 'notifyComplete') return handleNotifyComplete(user);
        if (action === 'testNotification' || action === 'sendTestLine') return handleTestNotification(user);
    }

    // 3. FALLBACK ACTIONS
    switch (action) {
      case 'save': 
        if (!user || !user.username) throw new Error("User required for save");
        return handleSave(params.type, params.payload, user);
      case 'clear': 
        if (!user || !user.username) throw new Error("User required for clear");
        return handleClear(params.type, user);
      case 'fetchUserData': // FIX: Handle fetchUserData via POST
         if (!params.username) throw new Error("Username required");
         return createSuccessResponse(getUserFullData(params.username));
      default: 
        if (method === 'GET' && params.username) {
             const username = params.username;
             return createSuccessResponse(getUserFullData(username));
        }
        throw new Error("Invalid action or missing user information.");
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

// ... (Functions below are Database Logic) ...

function handleAdminLogin(password) {
    // 1. Check Super Admin (Script Property)
    if (password === ADMIN_KEY) {
        return createSuccessResponse({
            username: "admin_super",
            displayName: "Super Admin",
            role: "admin",
            organization: "all",
            profilePicture: "🛡️"
        });
    }

    // 2. Check Org Admins (Code Constant)
    const orgId = ORG_ADMIN_KEYS[password];
    if (orgId) {
        return createSuccessResponse({
            username: "admin_" + orgId,
            displayName: "Admin: " + orgId,
            role: "admin",
            organization: orgId,
            profilePicture: "👨‍💼"
        });
    }

    return createErrorResponse("รหัสผ่านไม่ถูกต้อง");
}

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

function handleGetUserDataForAdmin(targetUsername) {
    if(!targetUsername) return createErrorResponse("Target username required");
    return createSuccessResponse(getUserFullData(targetUsername));
}

function handleCreateGroup(groupData, adminUser) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.GROUPS);
    
    const data = sheet.getDataRange().getValues();
    const newCode = String(groupData.code).trim().toUpperCase();

    for(let i=1; i<data.length; i++) {
        if(String(data[i][2]).trim().toUpperCase() === newCode) { 
            return createErrorResponse("รหัสเข้ากลุ่มนี้ถูกใช้งานแล้ว");
        }
    }
    
    const id = 'GRP_' + Date.now();
    sheet.appendRow([
        id, 
        groupData.name, 
        groupData.code, 
        groupData.description, 
        groupData.lineLink, 
        adminUser.username, 
        new Date(),
        groupData.image || ""
    ]);
    
    return createSuccessResponse({ status: "Created", group: { ...groupData, id } });
}

function handleJoinGroup(code, user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS) || ss.insertSheet(SHEET_NAMES.GROUP_MEMBERS);
    
    const groups = groupSheet.getDataRange().getValues();
    let targetGroup = null;
    const searchCode = String(code).trim().toUpperCase();

    for(let i=1; i<groups.length; i++) {
        const sheetCode = String(groups[i][2]).trim().toUpperCase();
        if(sheetCode === searchCode) { 
            targetGroup = {
                id: groups[i][0],
                name: groups[i][1],
                code: groups[i][2],
                description: groups[i][3],
                lineLink: groups[i][4],
                adminId: groups[i][5],
                createdAt: groups[i][6],
                image: groups[i][7] || ""
            };
            break;
        }
    }
    
    if(!targetGroup) return createErrorResponse("ไม่พบรหัสกลุ่มนี้ (Code not found)");
    
    const members = memberSheet.getDataRange().getValues();
    for(let i=1; i<members.length; i++) {
        if(members[i][0] === targetGroup.id && members[i][1] === user.username) {
            return createSuccessResponse({ status: "Joined", message: "คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว" }); // Handle as success for idempotency
        }
    }
    
    // Add joinedAt date
    memberSheet.appendRow([targetGroup.id, user.username, new Date()]);
    return createSuccessResponse({ status: "Joined", group: targetGroup });
}

function handleLeaveGroup(groupId, user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
    if (!sheet) return createErrorResponse("Sheet not found");
    
    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === groupId && data[i][1] === user.username) {
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
        if(members[i][1] === user.username) {
            joinedIds.add(members[i][0]);
        }
    }
    
    const groups = groupSheet.getDataRange().getValues();
    const result = [];
    for(let i=1; i<groups.length; i++) {
        if(joinedIds.has(groups[i][0])) {
            result.push({
                id: groups[i][0],
                name: groups[i][1],
                code: groups[i][2],
                description: groups[i][3],
                lineLink: groups[i][4],
                adminId: groups[i][5],
                createdAt: groups[i][6],
                image: groups[i][7] || ""
            });
        }
    }
    
    return createSuccessResponse(result);
}

function handleGetAdminGroups(user) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const groupSheet = ss.getSheetByName(SHEET_NAMES.GROUPS);
    if(!groupSheet) return createSuccessResponse([]);
    
    const groups = groupSheet.getDataRange().getValues();
    const result = [];
    for(let i=1; i<groups.length; i++) {
        if(groups[i][5] === user.username) { 
            result.push({
                id: groups[i][0],
                name: groups[i][1],
                code: groups[i][2],
                description: groups[i][3],
                lineLink: groups[i][4],
                adminId: groups[i][5],
                createdAt: groups[i][6],
                image: groups[i][7] || ""
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

    const memberData = memberSheet.getDataRange().getValues();
    const memberUsernames = new Set();
    for(let i=1; i<memberData.length; i++) {
        if(memberData[i][0] === groupId) {
            memberUsernames.add(memberData[i][1]);
        }
    }

    const profileData = profileSheet.getRange(2, 1, profileSheet.getLastRow() - 1, 25).getValues();
    const users = {}; 

    for (let i = 0; i < profileData.length; i++) {
        const row = profileData[i];
        const username = row[1];
        if (memberUsernames.has(username)) {
             const xp = Number(row[12] || 0);
             if (!users[username] || xp > users[username].xp) {
                 users[username] = {
                    username: username,
                    displayName: row[2],
                    profilePicture: row[3],
                    age: row[5],
                    xp: xp,
                    level: Number(row[13] || 1),
                    healthCondition: row[17] || 'N/A'
                 };
             }
        }
    }

    return createSuccessResponse(Object.values(users));
}

// Updated Leaderboard Logic with Group XP Support
function handleGetLeaderboardJS(groupId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const profileSheet = ss.getSheetByName(SHEET_NAMES.PROFILE);
  
  if (!profileSheet || profileSheet.getLastRow() < 2) {
    return createSuccessResponse({ leaderboard: [], trending: [], categories: {water:[], food:[], activity:[]} });
  }

  // 1. FILTERING & JOIN DATE (Server-side constraint)
  let groupMemberJoinDates = null; // Map<username, joinedAtDate>
  
  if (groupId) {
      const memberSheet = ss.getSheetByName(SHEET_NAMES.GROUP_MEMBERS);
      if (memberSheet) {
          groupMemberJoinDates = new Map();
          const mData = memberSheet.getDataRange().getValues();
          // Assuming structure: [groupId, username, joinedAt]
          for(let i=1; i<mData.length; i++) {
              if(mData[i][0] === groupId) {
                  let joinDate = mData[i][2] ? new Date(mData[i][2]) : new Date(0); 
                  groupMemberJoinDates.set(mData[i][1], joinDate);
              }
          }
      } else {
          return createSuccessResponse({ leaderboard: [] }); // Group not found or empty
      }
  }

  const data = profileSheet.getRange(2, 1, profileSheet.getLastRow() - 1, 25).getValues();
  const users = {}; 
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); 

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const username = row[1];
    if (!username) continue; 
    
    // Check if user belongs to the requested group
    if (groupId && (!groupMemberJoinDates || !groupMemberJoinDates.has(username))) continue;

    const timestamp = new Date(row[0]);
    const displayName = row[2];
    const profilePicture = row[3];
    const role = String(row[11]).toLowerCase(); 
    const xp = Number(row[12] || 0); 
    const level = Number(row[13] || 1); 
    const org = row[23]; 
    let deltaXp = Number(row[24]); 
    if (isNaN(deltaXp)) deltaXp = 0;

    if (role === 'admin') continue;

    if (!users[username]) {
      users[username] = {
        username: username,
        displayName: displayName,
        profilePicture: profilePicture,
        organization: org,
        xp: 0,
        level: 1,
        weeklyXp: 0,
        groupXp: 0 // Initialize groupXp
      };
    }

    // Always update latest display info
    users[username].displayName = displayName;
    users[username].profilePicture = profilePicture;
    users[username].organization = org;
    
    if (xp > users[username].xp) {
      users[username].xp = xp;
      users[username].level = level;
    }

    // Weekly XP
    if (timestamp >= oneWeekAgo) {
      users[username].weeklyXp += deltaXp; 
    }

    // Group XP Logic: Only count deltaXp if action timestamp >= joinedAt
    if (groupId && groupMemberJoinDates) {
        const joinDate = groupMemberJoinDates.get(username);
        if (timestamp >= joinDate) {
            users[username].groupXp += deltaXp;
        }
    }
  }

  const userArray = Object.values(users);
  
  if (groupId) {
      // Sort by Group XP
      const groupLeaderboard = [...userArray].sort((a, b) => b.groupXp - a.groupXp);
      return createSuccessResponse({
          apiVersion: "v14.5-GROUP-XP",
          leaderboard: groupLeaderboard 
      });
  }

  const leaderboard = [...userArray].sort((a, b) => b.xp - a.xp).slice(0, 50);
  const trending = [...userArray].sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 50);
  const categories = getCategoryRankingsSafe(ss);

  return createSuccessResponse({
      apiVersion: "v14.5-GLOBAL",
      leaderboard: leaderboard,
      trending: trending,
      categories: categories
  });
}

function getCategoryRankingsSafe(ss) {
  const catSheet = ss.getSheetByName(SHEET_NAMES.CATEGORY_RANKINGS);
  let categories = { water: [], food: [], activity: [] };
  
  if (catSheet && catSheet.getLastRow() > 1) {
      const data = catSheet.getRange(1, 1, catSheet.getLastRow(), 14).getValues(); 
      for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const extract = (uIdx, sIdx, nIdx, pIdx) => {
              const u = row[uIdx];
              if (!u || String(u).trim() === "" || String(u).startsWith("#")) return null;
              const score = Number(row[sIdx]);
              let name = row[nIdx];
              let pic = row[pIdx];
              if (!name || String(name).startsWith("#")) name = String(u);
              if (!pic || String(pic).startsWith("#")) pic = "";
              
              return { 
                username: String(u), 
                score: isNaN(score) ? 0 : score, 
                displayName: String(name), 
                profilePicture: String(pic) 
              };
          };
          
          const w = extract(0, 1, 2, 3); if (w) categories.water.push(w);
          const f = extract(5, 6, 7, 8); if (f) categories.food.push(f);
          const a = extract(10, 11, 12, 13); if (a) categories.activity.push(a);
      }
  }
  return categories;
}

function handleSave(type, payload, user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetName = "";
  
  if (type === 'profile') sheetName = SHEET_NAMES.PROFILE;
  else if (type === 'loginLog') sheetName = SHEET_NAMES.LOGIN_LOGS; 
  else if (Object.values(SHEET_NAMES).includes(type)) sheetName = type;
  else {
      const key = Object.keys(SHEET_NAMES).find(k => k.toLowerCase() === type.toLowerCase().replace('history',''));
      if (key) sheetName = SHEET_NAMES[key];
      else sheetName = type.charAt(0).toUpperCase() + type.slice(1);
  }

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  const timestamp = new Date();
  let newRow = [];
  const item = Array.isArray(payload) ? payload[0] : payload;
  const commonPrefix = [timestamp, user.username, user.displayName, user.profilePicture];

  switch (sheetName) {
    case SHEET_NAMES.PROFILE:
      const badgesJson = JSON.stringify(item.badges || []);
      let deltaXp = 0;
      if (item.deltaXp !== undefined && item.deltaXp !== null) deltaXp = Number(item.deltaXp);
      
      newRow = [ 
          timestamp, user.username, item.displayName || user.displayName, item.profilePicture || user.profilePicture,
          item.gender || '', item.age || '', item.weight || '', item.height || '',
          item.waist || '', item.hip || '', item.activityLevel || '',
          user.role || 'user', 
          item.xp || 0, item.level || 1, badgesJson,
          item.email || user.email || '', '', 
          item.healthCondition || '',
          item.lineUserId || '',
          item.receiveDailyReminders !== undefined ? item.receiveDailyReminders : true,
          item.researchId || '', 
          item.pdpaAccepted || false,
          item.pdpaAcceptedDate || '',
          item.organization || 'general',
          deltaXp, // Col Y (Index 24)
          item.birthDate || '', 
          item.targetWeight || ''
      ];
      break;
    case SHEET_NAMES.LOGIN_LOGS:
        newRow = [timestamp, user.username, user.displayName, user.role, user.organization || 'general'];
        break;
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
    case SHEET_NAMES.EVALUATION: 
        const safeSatisfaction = item.satisfaction ? JSON.stringify(item.satisfaction) : '{}';
        const safeOutcomes = item.outcomes ? JSON.stringify(item.outcomes) : '{}';
        newRow = [timestamp, user.username, user.displayName, user.role, safeSatisfaction, safeOutcomes]; 
        break;
    case 'QuizHistory': newRow = [timestamp, user.username, item.score, item.totalQuestions, item.correctAnswers, item.type, item.weekNumber]; break;
    case SHEET_NAMES.REDEMPTION: newRow = [...commonPrefix, item.rewardId, item.rewardName, item.cost]; break; 
    default:
        newRow = [timestamp, user.username, JSON.stringify(item)];
  }

  sheet.appendRow(newRow);
  return createSuccessResponse({ status: "Saved" });
}

function handleClear(type, user) {
  let sheetName = type;
  if (Object.values(SHEET_NAMES).includes(type)) sheetName = type;
  else sheetName = type.charAt(0).toUpperCase() + type.slice(1);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return createSuccessResponse({ status: "Sheet not found" });
  const data = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const rowsToDelete = [];
  for (let i = 1; i < data.length; i++) { if (data[i][1] === user.username) rowsToDelete.push(i + 1); }
  for (let i = rowsToDelete.length - 1; i >= 0; i--) { sheet.deleteRow(rowsToDelete[i]); }
  return createSuccessResponse({ status: "Cleared" });
}

function handleSocialAuth(userInfo) {
    if (!userInfo) return createErrorResponse("Missing user info");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    let foundRowIndex = -1;
    let userData = null;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let json = {};
        try { json = JSON.parse(row[3]); } catch(e) {}
        if (row[0] === userInfo.email || json.userId === userInfo.userId) {
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
        userData = { username: username, displayName: userInfo.name, profilePicture: userInfo.picture, role: 'user', email: userInfo.email, organization: 'general', authProvider: userInfo.provider, userId: userInfo.userId };
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
      username: lastEntry[1],
      displayName: lastEntry[2],
      profilePicture: lastEntry[3],
      gender: lastEntry[4], 
      age: lastEntry[5], 
      weight: lastEntry[6], 
      height: lastEntry[7], 
      waist: lastEntry[8], 
      hip: lastEntry[9], 
      activityLevel: lastEntry[10], 
      xp: Number(lastEntry[12] || 0), 
      level: Number(lastEntry[13] || 1), 
      badges: badges, 
      email: lastEntry[15], 
      healthCondition: lastEntry[17], 
      lineUserId: lastEntry[18], 
      receiveDailyReminders: String(lastEntry[19]).toLowerCase() !== 'false', 
      researchId: lastEntry[20], 
      pdpaAccepted: lastEntry[21], 
      pdpaAcceptedDate: lastEntry[22], 
      organization: lastEntry[23] || 'general', 
      birthDate: lastEntry[25], 
      targetWeight: lastEntry[26] 
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

function handleAdminFetch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};
  ss.getSheets().forEach(s => {
    const name = s.getName();
    if (name === 'loginLog' || name === 'login_logs') return;
    const data = s.getDataRange().getValues();
    if (data.length < 2) { result[name] = []; return; }
    
    // Explicit mapping for Profile to ensure lowercase keys matching frontend expectations
    if (name === SHEET_NAMES.PROFILE) {
        result['profiles'] = data.slice(1).map(row => ({
            timestamp: row[0],
            username: row[1],
            displayName: row[2],
            profilePicture: row[3],
            gender: row[4],
            age: row[5],
            weight: row[6],
            height: row[7],
            waist: row[8],
            hip: row[9],
            activityLevel: row[10],
            role: row[11],
            xp: row[12],
            level: row[13],
            badges: row[14],
            email: row[15],
            password: row[16],
            healthCondition: row[17],
            lineUserId: row[18],
            receiveDailyReminders: row[19],
            researchId: row[20],
            pdpaAccepted: row[21],
            pdpaAcceptedDate: row[22],
            organization: row[23],
            deltaXp: row[24],
            birthDate: row[25],
            targetWeight: row[26]
        }));
    } else if (name === SHEET_NAMES.LOGIN_LOGS) {
        result['loginLogs'] = data.slice(1).map(row => ({ timestamp: row[0], username: row[1], displayName: row[2], role: row[3], organization: row[4] || 'general' }));
    } else if (name === SHEET_NAMES.EVALUATION) {
        result['evaluationHistory'] = data.slice(1).map(row => ({ timestamp: row[0], username: row[1], displayName: row[2], role: row[3], satisfaction_json: row[4], outcome_json: row[5] }));
    } else {
        // Generic mapping for other sheets (Logs)
        // Note: Using explicit index mapping for key log sheets to ensure robustness
        if (name === SHEET_NAMES.BMI) result['bmiHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], bmi: Number(r[4]), category: r[5] }));
        else if (name === SHEET_NAMES.TDEE) result['tdeeHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], tdee: Number(r[4]) }));
        else if (name === SHEET_NAMES.FOOD) result['foodHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: Number(r[5]) }));
        else if (name === SHEET_NAMES.WATER) result['waterHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], amount: Number(r[4]) }));
        else if (name === SHEET_NAMES.ACTIVITY) result['activityHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: Number(r[5]) }));
        else if (name === SHEET_NAMES.CALORIE) result['calorieHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], calories: Number(r[5]) }));
        else if (name === SHEET_NAMES.SLEEP) result['sleepHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], duration: Number(r[6]), quality: Number(r[7]) }));
        else if (name === SHEET_NAMES.MOOD) result['moodHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], emoji: r[4], stressLevel: Number(r[5]) }));
        else if (name === SHEET_NAMES.HABIT) result['habitHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], type: r[4], amount: Number(r[5]), isClean: r[6] }));
        else if (name === SHEET_NAMES.SOCIAL) result['socialHistory'] = data.slice(1).map(r => ({ timestamp: r[0], username: r[1], interaction: r[4], feeling: r[5] }));
        else {
             // Fallback for unknown sheets (like Groups)
             const headers = data[0];
             result[name] = data.slice(1).map(row => { let obj = {}; headers.forEach((h, i) => obj[h] = row[i]); return obj; });
        }
    }
  });
  return createSuccessResponse(result);
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ensureSheet = (name, headers) => {
      let sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (headers && headers.length > 0 && (sheet.getLastRow() === 0)) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.setFrozenRows(1);
      }
      return sheet;
  };

  const profileHeaders = [
    "timestamp", "username", "displayName", "profilePicture", "gender", 
    "age", "weight", "height", "waist", "hip", "activityLevel", 
    "role", "xp", "level", "badges", "email", "password", 
    "healthCondition", "lineUserId", "receiveDailyReminders", 
    "researchId", "pdpaAccepted", "pdpaAcceptedDate", "organization", "deltaXp", "birthDate", "targetWeight"
  ];
  ensureSheet(SHEET_NAMES.PROFILE, profileHeaders);
  ensureSheet(SHEET_NAMES.LOGIN_LOGS, ["timestamp", "username", "displayName", "role", "organization"]);
  ensureSheet(SHEET_NAMES.USERS, ["email", "password", "username", "userDataJson", "timestamp"]);
  ensureSheet(SHEET_NAMES.ORGANIZATIONS, ["id", "name"]);
  
  ensureSheet(SHEET_NAMES.GROUPS, ["id", "name", "code", "description", "lineLink", "adminId", "createdAt", "image"]);
  ensureSheet(SHEET_NAMES.GROUP_MEMBERS, ["groupId", "username", "joinedAt"]);

  const common = ["timestamp", "username", "displayName", "profilePicture"];
  ensureSheet(SHEET_NAMES.BMI, [...common, "bmi", "category"]);
  ensureSheet(SHEET_NAMES.TDEE, [...common, "tdee", "bmr"]);
  ensureSheet(SHEET_NAMES.WATER, [...common, "amount"]);
  ensureSheet(SHEET_NAMES.CALORIE, [...common, "name", "calories", "image", "imageHash"]);
  ensureSheet(SHEET_NAMES.ACTIVITY, [...common, "name", "caloriesBurned", "duration", "distance", "image", "imageHash"]);
  ensureSheet(SHEET_NAMES.FOOD, [...common, "description", "calories", "analysis_json"]);
  ensureSheet(SHEET_NAMES.EVALUATION, ["timestamp", "username", "displayName", "role", "satisfaction_json", "outcome_json"]);
  ensureSheet(SHEET_NAMES.REDEMPTION, [...common, "rewardId", "rewardName", "cost"]);

  const catHeaders = [
      "Username", "Water (ml)", "Name", "Picture", "", 
      "Username", "Food Logs", "Name", "Picture", "", 
      "Username", "Calories (kcal)", "Name", "Picture"
  ];
  let catSheet = ensureSheet(SHEET_NAMES.CATEGORY_RANKINGS, []);
  if(catSheet.getLastRow() === 0) {
      catSheet.getRange(1, 1, 1, catHeaders.length).setValues([catHeaders]); 
      catSheet.setFrozenRows(1);
      const waterQ = `=QUERY(${SHEET_NAMES.WATER}!A:E, "SELECT B, SUM(E) WHERE B IS NOT NULL GROUP BY B ORDER BY SUM(E) DESC LIMIT 20 LABEL B '', SUM(E) ''", 0)`;
      const foodQ = `=QUERY(${SHEET_NAMES.FOOD}!A:E, "SELECT B, COUNT(B) WHERE B IS NOT NULL GROUP BY B ORDER BY COUNT(B) DESC LIMIT 20 LABEL B '', COUNT(B) ''", 0)`;
      const actQ = `=QUERY(${SHEET_NAMES.ACTIVITY}!A:F, "SELECT B, SUM(F) WHERE B IS NOT NULL GROUP BY B ORDER BY SUM(F) DESC LIMIT 20 LABEL B '', SUM(F) ''", 0)`;
      catSheet.getRange("A2").setFormula(waterQ);
      catSheet.getRange("F2").setFormula(foodQ);
      catSheet.getRange("K2").setFormula(actQ);
      catSheet.getRange("C2").setFormula(`=ARRAYFORMULA(IF(A2:A="", "", IFERROR(VLOOKUP(A2:A, ${SHEET_NAMES.PROFILE}!B:D, 2, 0), A2:A)))`);
      catSheet.getRange("D2").setFormula(`=ARRAYFORMULA(IF(A2:A="", "", IFERROR(VLOOKUP(A2:A, ${SHEET_NAMES.PROFILE}!B:D, 3, 0), "")))`);
      catSheet.getRange("H2").setFormula(`=ARRAYFORMULA(IF(F2:F="", "", IFERROR(VLOOKUP(F2:F, ${SHEET_NAMES.PROFILE}!B:D, 2, 0), F2:F)))`);
      catSheet.getRange("I2").setFormula(`=ARRAYFORMULA(IF(F2:F="", "", IFERROR(VLOOKUP(F2:F, ${SHEET_NAMES.PROFILE}!B:D, 3, 0), "")))`);
      catSheet.getRange("M2").setFormula(`=ARRAYFORMULA(IF(K2:K="", "", IFERROR(VLOOKUP(K2:K, ${SHEET_NAMES.PROFILE}!B:D, 2, 0), K2:K)))`);
      catSheet.getRange("N2").setFormula(`=ARRAYFORMULA(IF(K2:K="", "", IFERROR(VLOOKUP(K2:K, ${SHEET_NAMES.PROFILE}!B:D, 3, 0), "")))`);
  }

  return "Setup Complete (v16.0) - Full Features";
}

function createSuccessResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleTestNotification(user) {
    const profile = getLatestProfileForUser(user.username);
    if (profile && profile.lineUserId) {
        sendLinePush(profile.lineUserId, [{ type: 'text', text: '✅ ทดสอบการแจ้งเตือนจาก Satun Smart Life สำเร็จ!' }]);
        return createSuccessResponse({ status: "Sent" });
    }
    return createErrorResponse("ไม่พบ LINE ID");
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
    } catch (e) { Logger.log(e); }
}
