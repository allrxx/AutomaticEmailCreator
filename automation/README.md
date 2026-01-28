# How to Generate App Passwords in Cazehiresense

This document explains how to automate the creation of app passwords for mailboxes on `mail.cazehiresense.com`.

---
>>>>
node process_all_fixed.js
>>>>


## Prerequisites

1. **Node.js** (v18 or higher)
2. **Playwright** browser automation library

### Setup (First Time Only)

```powershell
cd c:\Users\alexj\Downloads\Test\automation
npm install playwright csv-parse csv-stringify
npx playwright install chromium
```

---

## Input CSV Format

The input CSV file should have the following columns:

| Column | Description |
|--------|-------------|
| `email` | The mailbox email address |
| `password` | The mailbox login password |
| `name` | User display name |
| `quota` | Mailbox quota (can be 0) |
| `app_password` | Leave empty - will be filled by the script |
| `assignee` | Person responsible for this mailbox |

**Example:**
```csv
email,password,name,quota,app_password,assignee
user@cazehiresense.com,SecurePass123!,User 1,0,,Alex
```

---

## Method 1: Batch Processing (All Users)

Use `process_all_fixed.js` to process all users in a CSV file.

### Steps:

1. **Prepare your CSV file** with the format above
2. **Edit the script** to update the file paths if needed:
   ```javascript
   const csvPath = 'path/to/your/input.csv';
   const outPath = 'path/to/your/output.csv';
   ```
3. **Run the script:**
   ```powershell
   cd c:\Users\alexj\Downloads\Test\automation
   node process_all_fixed.js
   ```

### What it does:
- Logs into each mailbox
- Navigates to Settings > App Passwords
- Creates an app password named "hiresense"
- Enables only **IMAP** and **SMTP** protocols
- Saves the generated password to the output CSV
- Skips users who already have an app password

### Resume Capability:
If the script crashes, simply run it again. It will:
- Load progress from the output file
- Skip users who already have passwords
- Continue from where it left off

---

## Method 2: Single User (Visible Browser)

Use `fix_user_visible.js` to process a single user with a visible browser window.

### Steps:

1. **Edit the script** to set the user credentials:
   ```javascript
   const email = 'user@cazehiresense.com';
   const password = 'UserPassword123!';
   const targetAppPass = 'YourDesiredAppPassword1!';
   ```
2. **Run the script:**
   ```powershell
   node fix_user_visible.js
   ```

### When to use:
- Debugging issues with a specific user
- Verifying the automation works correctly
- Processing a single user manually

---

## Technical Details

### Key CSS Selectors

| Element | Selector |
|---------|----------|
| Email input (login) | `#login_user` |
| Password input (login) | `#pass_user` |
| Login button | `button[value="Login"]` |
| App Passwords tab | `text=App passwords` |
| Create App Password button | `a[data-bs-target="#addAppPasswdModal"]` |
| App Name input | `input[name="app_name"]` |
| App Password input | `input[name="app_passwd"]` |
| Confirm Password input | `input[name="app_passwd2"]` |
| Protocols dropdown | `button[data-id="protocols"]` |
| Save/Add button | `#addAppPasswdModal button.btn-success` |

### App Password Requirements
- Must contain letters and numbers
- Recommended format: `{16 hex chars}Aa1!` (e.g., `e9a8454701b26dc6Aa1!`)

### Protocols Configuration
By default, the script:
- ✅ Enables: **IMAP**, **SMTP**
- ❌ Disables: POP3, Sieve, EAS/ActiveSync, CardDAV/CalDAV

---

## Troubleshooting

### Modal Not Opening
**Cause:** The "Create app password" button selector was wrong.
**Fix:** Use `a[data-bs-target="#addAppPasswdModal"]` (it's an `<a>` tag, not a `<button>`).

### Timeout Errors
**Cause:** Page loading slowly or element not visible.
**Fix:** 
- Increase timeout values in `waitForSelector()`
- Run with `headless: false` to see what's happening

### Login Failed
**Cause:** Incorrect credentials or session issues.
**Fix:** 
- Verify credentials in the CSV
- Use a fresh browser context for each user

### Elements Not Found
**Cause:** UI may have changed.
**Fix:**
- Inspect the page manually to find new selectors
- Use `page.content()` to dump HTML for analysis

---

## Files Reference

| File | Purpose |
|------|---------|
| `process_all_fixed.js` | Batch processor for all users (headless) |
| `fix_user_visible.js` | Single user processor (visible browser) |
| `emails-results.csv` | Output file with generated passwords |

---

## Manual Process (Reference)

If you need to do this manually, follow these steps:

1. Go to `https://mail.cazehiresense.com/user`
2. Login with email and password
3. Click the **Settings** button (spanner icon) or navigate to `/user`
4. Click the **App passwords** tab
5. Click **+ Create app password**
6. Enter app name: `hiresense`
7. Enter and confirm the password
8. In the protocols dropdown, enable only **IMAP** and **SMTP**
9. Click **Add**
10. Copy the password and save it

---

*Last updated: January 29, 2026*
