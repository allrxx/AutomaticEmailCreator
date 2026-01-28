const fs = require('fs');
const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const crypto = require('crypto');

const csvPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing - mailboxes_testing.csv';
const outPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing_completed.csv';

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

    // Check if output exists to resume?
    // For now, let's just process. The script skips if app_password exists in the *source* record.
    // However, if we crashed, the source file on disk isn't updated unless we overwrite it or read from outPath.
    // I'll read from outPath if it exists, to support resume.

    if (fs.existsSync(outPath)) {
        try {
            const existing = fs.readFileSync(outPath);
            const existingRecords = parse(existing, { columns: true, skip_empty_lines: true });
            // Map existing passwords to records
            for (const rec of records) {
                const found = existingRecords.find(r => r.email === rec.email);
                if (found && found.app_password && found.app_password.length > 5) {
                    rec.app_password = found.app_password;
                }
            }
            console.log('Merged existing progress from output file.');
        } catch (e) {
            console.log('Could not read existing output, starting fresh.');
        }
    }

    const browser = await chromium.launch({ headless: true });

    for (const record of records) {
        if (record.app_password && record.app_password.trim().length > 5) {
            console.log(`Skipping ${record.email}, has password.`);
            continue;
        }

        console.log(`Processing ${record.email}...`);
        // NEW CONTEXT FOR EACH USER to ensure fresh session
        const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();

        try {
            await page.goto('https://mail.cazehiresense.com/user', { timeout: 45000 });

            // Login
            await page.fill('#login_user', record.email);
            await page.fill('#pass_user', record.password);
            await page.click('button[value="Login"]');
            await page.waitForLoadState('networkidle');

            // Settings
            await page.click('a[href="/user"]');
            await page.waitForLoadState('networkidle');

            // Tab (Handle visibility issues)
            const tab = page.locator('button[data-bs-target="#AppPasswds"]');
            // Wait a bit
            await page.waitForTimeout(1000);

            if (await tab.isVisible()) {
                await tab.click();
            } else {
                // If in mobile view/dropdown? Try dispatch click
                await tab.dispatchEvent('click');
                // Or try text
                const textTab = page.getByText('App passwords');
                if (await textTab.isVisible()) await textTab.click();
            }
            await page.waitForTimeout(1000);

            // Add
            // Try evaluate click to avoid visibility issues completely
            await page.evaluate(() => {
                const btn = document.querySelector('button[data-id="add_apppasswd"]');
                if (btn) btn.click();
            });

            // Wait for modal input (name)
            try {
                // Wait for it to be in the DOM
                await page.waitForSelector('input[name="app_name"]', { state: 'attached', timeout: 5000 });
            } catch (e) {
                console.log('Modal input not detected attached.');
            }

            // Generate Password (Manual)
            const newPass = crypto.randomBytes(8).toString('hex') + 'Aa1!';

            // Fill via evaluate
            await page.evaluate(({ name, pass }) => {
                const nameInput = document.querySelector('input[name="app_name"]');
                if (nameInput) {
                    nameInput.value = name;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const passInput = document.querySelector('input[name="app_passwd"]');
                if (passInput) {
                    passInput.value = pass;
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                const passInput2 = document.querySelector('input[name="app_passwd2"]');
                if (passInput2) {
                    passInput2.value = pass;
                    passInput2.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, { name: 'hiresense', pass: newPass });

            await page.waitForTimeout(500);

            // Save
            const saveBtn = page.locator('.modal.show button.btn-success').filter({ hasText: /Add|Save/i });
            if (await saveBtn.count() > 0) {
                await saveBtn.first().click();
            } else {
                await page.locator('.modal.show button.btn-success').first().click();
            }

            await page.waitForTimeout(2000);

            // Update Record
            record.app_password = newPass;
            console.log(`Success: ${newPass}`);

            // Save intermediate progress
            const currentOutput = stringify(records, { header: true });
            fs.writeFileSync(outPath, currentOutput);

        } catch (e) {
            console.error(`Error ${record.email}:`, e.message);
        } finally {
            await context.close();
        }
    }

    await browser.close();
    console.log(`Completed. Final file: ${outPath}`);
})();
