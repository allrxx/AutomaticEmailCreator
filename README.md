# App Password Generator for Cazehiresense

Automates app password creation for mailboxes on `mail.cazehiresense.com`.

---

## Installation (First Time Setup)

1. **Install Node.js** (v18 or higher) from [nodejs.org](https://nodejs.org)

2. **Install dependencies:**
   ```powershell
   cd c:\Users\alexj\Downloads\Test\automation
   npm install playwright csv-parse csv-stringify
   ```

3. **Install browser:**
   ```powershell
   npx playwright install chromium
   ```

---

## Quick Start

1. **Replace `emails.csv`** with your data (keep the same column format). JUST EXPORT THE GOOGLE SHEET AS CSV FILE
2. **Run the script:**
   ```powershell
   cd c:\Users\alexj\Downloads\Test\automation
   node ProcessAllCandidates.js
   ```
3. **Results saved to:** `emails-results.csv`

---

## CSV Format

| Column | Description |
|--------|-------------|
| `email` | Mailbox email address |
| `password` | Mailbox login password |
| `name` | User display name |
| `quota` | Mailbox quota (can be 0) |
| `app_password` | Leave empty - will be filled by script |
| `assignee` | Person responsible |

**Note:** Supports both comma (`,`) and tab-separated files.

---

## Features

- ✅ **Auto-skip** - Skips rows that already have an app password value
- ✅ **Resume support** - Saves progress after each user; re-run to continue if interrupted
- ✅ **IMAP + SMTP only** - Disables POP3, Sieve, EAS, CardDAV protocols
- ✅ **Auto-detect delimiter** - Works with both comma and tab-separated CSV files
- ✅ **Fresh session per user** - Uses new browser context for each login (no logout issues)
- ✅ **Server-side check** - Also checks if "hiresense" password already exists on the mail server

---

## Files

| File | Description |
|------|-------------|
| `ProcessAllCandidates.js` | Main script - processes all users in CSV |
| `TestForSingleUser.js` | Debug script - opens visible browser for single user |
| `emails.csv` | Input file - your mailbox data |
| `emails-results.csv` | Output file - results with generated passwords |

---

## Troubleshooting

**Script stuck or crashed?**  
Just re-run it - progress is saved and it will resume from where it left off.

**Need to debug a single user?**  
Edit credentials in `TestForSingleUser.js` and run it - opens a visible browser window.

**Login fails for a user?**  
Check if the password in CSV is correct. The error will be logged in console.

---

*Last updated: January 29, 2026*
