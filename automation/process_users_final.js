const fs = require('fs');
const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const crypto = require('crypto');

const csvPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing - mailboxes_testing.csv';
const outPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing - mailboxes_testing_updated.csv';

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

    const browser = await chromium.launch({ headless: true });

    // We can use a single context or new context per user. New context is safer.

    for (const record of records) {
        if (record.app_password && record.app_password.trim().length > 5) {
            console.log(`Skipping ${record.email}, has password.`);
            continue;
        }

        console.log(`Processing ${record.email}...`);
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

            // Tab
            const tab = page.locator('button[data-bs-target="#AppPasswds"]');
            if (await tab.count() > 0) {
                if (await tab.isVisible()) await tab.click();
                else await tab.dispatchEvent('click');
            } else {
                // Try text
                await page.getByText('App passwords').click();
            }
            await page.waitForTimeout(2000);

            // Add
            const addButton = page.locator('button[data-id="add_apppasswd"]');
            if (await addButton.isVisible()) {
                await addButton.click();
            } else {
                await addButton.click({ force: true });
            }

            // Wait for modal input (name)
            // If visibility fails, we try to wait a bit then check
            try {
                await page.waitForSelector('input[name="app_name"]', { state: 'visible', timeout: 5000 });
            } catch (e) {
                console.log('Modal input not visible, trying to force show or assuming loaded...');
            }

            // Fill Name
            await page.fill('input[name="app_name"]', 'hiresense');

            // Generate Password (Manual)
            const newPass = crypto.randomBytes(8).toString('hex') + 'Aa1!'; // Ensure complexity
            // Fill both fields
            await page.fill('input[name="app_passwd"]', newPass);
            await page.fill('input[name="app_passwd2"]', newPass);

            // Protocols (Optional: Try to uncheck if possible)
            // Skipping to be safe and fast. Defautls are usually fine.

            // Save
            // Look for Save/Add in modal.
            // .modal.show button.btn-success
            const saveBtn = page.locator('.modal.show button.btn-success').filter({ hasText: /Add|Save/i });
            if (await saveBtn.count() > 0) {
                await saveBtn.first().click();
            } else {
                // Try generic
                await page.locator('.modal.show button.btn-success').first().click();
            }

            await page.waitForTimeout(2000);

            // Update Record
            record.app_password = newPass;
            console.log(`Success: ${newPass}`);

        } catch (e) {
            console.error(`Error ${record.email}:`, e.message);
        } finally {
            await context.close();
        }
    }

    await browser.close();

    const output = stringify(records, { header: true });
    fs.writeFileSync(outPath, output);
    console.log('Done.');
})();
