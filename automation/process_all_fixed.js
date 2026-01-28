const fs = require('fs');
const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const crypto = require('crypto');

const csvPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing - mailboxes_testing.csv';
const outPath = 'c:/Users/alexj/Downloads/Test/mailboxes_final.csv';

(async () => {
    let records = [];
    try {
        const input = fs.readFileSync(csvPath);
        records = parse(input, { columns: true, skip_empty_lines: true });
    } catch (e) {
        console.error('Failed to read CSV', e);
        process.exit(1);
    }

    console.log(`Loaded ${records.length} records.`);

    // Resume from existing output if available
    if (fs.existsSync(outPath)) {
        try {
            const existing = fs.readFileSync(outPath);
            const existingRecords = parse(existing, { columns: true, skip_empty_lines: true });
            for (const rec of records) {
                const found = existingRecords.find(r => r.email === rec.email);
                if (found && found.app_password && found.app_password.length > 5) {
                    rec.app_password = found.app_password;
                }
            }
            console.log('Resumed from output file.');
        } catch (e) { console.log('Resume failed, starting clean'); }
    }

    const browser = await chromium.launch({ headless: true });

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // Skip if already processed (need to verify on server too)
        // For now, we'll reprocess to ensure correctness

        console.log(`[${i + 1}/${records.length}] Processing ${record.email}...`);
        const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();

        try {
            await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

            // Login
            await page.fill('#login_user', record.email);
            await page.fill('#pass_user', record.password);
            await page.click('button[value="Login"]');
            await page.waitForLoadState('networkidle');

            // Navigate to settings
            await page.goto('https://mail.cazehiresense.com/user');
            await page.waitForLoadState('networkidle');

            // Click App Passwords tab
            await page.click('text=App passwords');
            await page.waitForTimeout(1000);

            // Check if password already exists
            const tableContent = await page.locator('#AppPasswds').innerText();
            if (tableContent.includes('hiresense')) {
                console.log(`  Already has app password. Skipping.`);
                await context.close();
                continue;
            }

            // Click "Create app password" button (it's an <a> tag!)
            await page.click('a[data-bs-target="#addAppPasswdModal"]');

            // Wait for modal
            await page.waitForSelector('#addAppPasswdModal.show', { state: 'visible', timeout: 5000 });

            // Generate password
            const newPass = crypto.randomBytes(8).toString('hex') + 'Aa1!';

            // Fill form
            await page.fill('input[name="app_name"]', 'hiresense');
            await page.fill('input[name="app_passwd"]', newPass);
            await page.fill('input[name="app_passwd2"]', newPass);

            // Configure protocols (IMAP + SMTP only)
            await page.click('button[data-id="protocols"]');
            await page.waitForTimeout(500);

            const unwanted = ['POP3', 'Sieve', 'EAS', 'CardDAV'];
            for (const proto of unwanted) {
                const item = page.locator(`.dropdown-menu.show .dropdown-item:has-text("${proto}")`);
                if (await item.count() > 0) {
                    const cls = await item.getAttribute('class');
                    if (cls && (cls.includes('active') || cls.includes('selected'))) {
                        await item.click();
                    }
                }
            }

            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Save
            await page.click('#addAppPasswdModal button.btn-success');
            await page.waitForSelector('#addAppPasswdModal', { state: 'hidden', timeout: 10000 });

            // Update record
            record.app_password = newPass;
            console.log(`  Success: ${newPass}`);

            // Save progress
            const currentOutput = stringify(records, { header: true });
            fs.writeFileSync(outPath, currentOutput);

        } catch (e) {
            console.error(`  Error: ${e.message}`);
        } finally {
            await context.close();
        }
    }

    await browser.close();
    console.log(`\nCompleted! Final file: ${outPath}`);
})();
