// ============================================================
// EXPENSE TRACKER - Google Apps Script
// Deploy as Web App → set "Anyone" can access
// ============================================================

const TELEGRAM_TOKEN = "YOUR_BOT_TOKEN_HERE";
const SHEET_NAME = "Expenses";

// Auto-categorize keywords
const CATEGORIES = {
  food: ["zomato", "swiggy", "blinkit", "zepto", "pizza", "burger", "restaurant", "cafe", "lunch", "dinner", "breakfast", "chai", "coffee"],
  travel: ["uber", "ola", "rapido", "metro", "bus", "auto", "travel", "petrol", "fuel", "cab"],
  shopping: ["amazon", "flipkart", "myntra", "meesho", "clothes", "shoes", "shopping"],
  entertainment: ["netflix", "hotstar", "prime", "spotify", "movie", "cinema", "game"],
  health: ["pharmacy", "medicine", "doctor", "gym", "hospital", "medical"],
  bills: ["electricity", "water", "wifi", "internet", "rent", "recharge", "mobile"],
  groceries: ["dmart", "bigbasket", "grofers", "vegetables", "fruits", "milk", "grocery"],
};

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    if (!update.message) return ContentService.createTextOutput("ok");

    const chatId = update.message.chat.id;
    const text = (update.message.text || "").trim();

    // Commands
    if (text === "/start") {
      sendMessage(chatId, `👋 *Welcome to your Expense Tracker!*\n\nSend expenses like:\n• \`Zomato 300\`\n• \`Travel 150\`\n• \`Amazon 999\`\n\nCommands:\n/summary – Today's total\n/week – This week\n/month – This month\n/help – Help`);
      return ContentService.createTextOutput("ok");
    }

    if (text === "/help") {
      sendMessage(chatId, `📖 *How to log expenses:*\n\n\`<name> <amount>\`\n\nExamples:\n• \`Zomato 350\`\n• \`Uber 120\`\n• \`Amazon 1499\`\n\nI'll auto-detect the category! 🎯`);
      return ContentService.createTextOutput("ok");
    }

    if (text === "/summary") {
      const summary = getSummary("today");
      sendMessage(chatId, summary);
      return ContentService.createTextOutput("ok");
    }

    if (text === "/week") {
      const summary = getSummary("week");
      sendMessage(chatId, summary);
      return ContentService.createTextOutput("ok");
    }

    if (text === "/month") {
      const summary = getSummary("month");
      sendMessage(chatId, summary);
      return ContentService.createTextOutput("ok");
    }

    // Parse expense: "Zomato 300" or "300 Zomato"
    const parsed = parseExpense(text);
    if (parsed) {
      saveExpense(parsed.name, parsed.amount, parsed.category);
      sendMessage(chatId,
        `✅ *Saved!*\n\n` +
        `📌 ${parsed.name}\n` +
        `💰 ₹${parsed.amount}\n` +
        `🏷️ ${parsed.category}\n` +
        `🕐 ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
      );
    } else {
      sendMessage(chatId, `❓ Couldn't parse that.\n\nTry: \`Zomato 300\` or \`300 Uber\``);
    }

  } catch (err) {
    Logger.log("Error: " + err);
  }
  return ContentService.createTextOutput("ok");
}

function parseExpense(text) {
  // Match "Word 300" or "300 Word" or "Word Word 300"
  const patterns = [
    /^(.+?)\s+(\d+(?:\.\d+)?)$/,   // "Zomato 300" or "Big Basket 500"
    /^(\d+(?:\.\d+)?)\s+(.+)$/,    // "300 Zomato"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let name, amount;
      if (isNaN(match[1])) {
        name = match[1].trim();
        amount = parseFloat(match[2]);
      } else {
        amount = parseFloat(match[1]);
        name = match[2].trim();
      }
      if (amount > 0 && name.length > 0) {
        return { name, amount, category: detectCategory(name) };
      }
    }
  }
  return null;
}

function detectCategory(name) {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => lower.includes(k))) {
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  }
  return "Other";
}

function saveExpense(name, amount, category) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Date", "Time", "Name", "Amount", "Category"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
  }

  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm");

  sheet.appendRow([dateStr, timeStr, name, amount, category]);
}

function getSummary(period) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return "📭 No expenses logged yet!";

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");

  let filtered = data.filter(row => {
    if (!row[0]) return false;
    const rowDate = new Date(row[0]);
    if (period === "today") return row[0] === today;
    if (period === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return rowDate >= weekAgo;
    }
    if (period === "month") {
      return rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear();
    }
  });

  if (filtered.length === 0) return `📭 No expenses for this ${period}!`;

  const total = filtered.reduce((sum, r) => sum + (r[3] || 0), 0);
  const byCategory = {};
  filtered.forEach(r => {
    byCategory[r[4]] = (byCategory[r[4]] || 0) + r[3];
  });

  const label = period === "today" ? "Today" : period === "week" ? "This Week" : "This Month";
  let msg = `📊 *${label}'s Summary*\n\n`;
  msg += `💰 *Total: ₹${total.toLocaleString("en-IN")}*\n\n`;
  msg += `*By Category:*\n`;

  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, amt]) => {
      const pct = Math.round((amt / total) * 100);
      msg += `• ${cat}: ₹${amt.toLocaleString("en-IN")} (${pct}%)\n`;
    });

  msg += `\n_${filtered.length} transaction${filtered.length > 1 ? "s" : ""}_`;
  return msg;
}

function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" })
  });
}

// Run this once to set the webhook
function setWebhook() {
  const webAppUrl = "YOUR_WEB_APP_URL_HERE"; // paste after deploying
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${webAppUrl}`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// Make the sheet public (read-only) for the dashboard
function publishSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Sheet ID: " + ss.getId());
  Logger.log("Share this sheet publicly (View only) from Drive settings.");
}
