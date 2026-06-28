# 💸 Expense Tracker — Setup Guide

Everything is free. Setup takes about 15 minutes.

---

## Step 1 — Create your Telegram Bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Give it a name (e.g. "My Expenses") and username (e.g. `myexpenses_bot`)
4. Copy the **API token** (looks like `123456:ABCdef...`)

---

## Step 2 — Create Google Sheet + Apps Script

1. Go to [sheets.google.com](https://sheets.google.com) → **New spreadsheet**
2. Name it "Expense Tracker"
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
   ```
4. Click **Extensions → Apps Script**
5. Delete all existing code, paste the contents of `bot/Code.gs`
6. Replace `YOUR_BOT_TOKEN_HERE` with your token from Step 1
7. Click **Deploy → New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click Deploy → copy the **Web App URL**
9. Back in Apps Script, replace `YOUR_WEB_APP_URL_HERE` with the URL
10. Run the `setWebhook` function once (click ▶ with that function selected)

---

## Step 3 — Make Sheet public (read-only for dashboard)

1. In Google Sheets, click **Share** (top right)
2. Click "Change to anyone with the link"
3. Set to **Viewer** → Done

---

## Step 4 — Deploy Dashboard to GitHub Pages

1. Create a new GitHub repo (e.g. `expense-tracker`)
2. Upload `dashboard/index.html` to the repo
3. In the file, find this line:
   ```js
   const SHEET_ID = "YOUR_GOOGLE_SHEET_ID_HERE";
   ```
   Replace with your actual Sheet ID
4. Go to repo **Settings → Pages**
5. Source: **Deploy from a branch** → `main` → `/ (root)`
6. Your dashboard will be live at:
   ```
   https://YOUR_USERNAME.github.io/expense-tracker/
   ```

---

## How to use

Send messages to your bot like:
```
Zomato 350
Uber 120
Amazon 1499
Electricity 800
Gym 500
```

It auto-detects categories:
| Keyword | Category |
|---------|----------|
| zomato, swiggy, pizza... | 🍔 Food |
| uber, ola, metro, petrol... | 🚗 Travel |
| amazon, flipkart, myntra... | 🛍️ Shopping |
| netflix, spotify, movie... | 🎬 Entertainment |
| pharmacy, doctor, gym... | 💊 Health |
| electricity, rent, wifi... | ⚡ Bills |
| dmart, bigbasket... | 🛒 Groceries |

### Bot commands
| Command | What it does |
|---------|-------------|
| `/summary` | Today's total + category breakdown |
| `/week` | Last 7 days |
| `/month` | This month |
| `/help` | Show usage guide |

---

## Files

```
expense-tracker/
├── bot/
│   └── Code.gs        ← paste into Google Apps Script
└── dashboard/
    └── index.html     ← deploy to GitHub Pages
```
