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

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });

    for (const record of records) {
        if (record.app_password && record.app_password.trim().length > 5) {
            console.log(`Skipping ${record.email}, has password.`);
            continue;
        }

        console.log(`Processing ${record.email}...`);
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
                await page.getByText('App passwords').click();
            }
            await page.waitForTimeout(1000);

            // Add
            const addButton = page.locator('button[data-id="add_apppasswd"]');
            // Try evaluate click to avoid visibility issues
            await page.evaluate(() => {
                const btn = document.querySelector('button[data-id="add_apppasswd"]');
                if (btn) btn.click();
            });

            // Wait for modal
            try {
                await page.waitForSelector('input[name="app_name"]', { state: 'attached', timeout: 5000 });
            } catch (e) {
                console.log('Modal input not attached/visible.');
            }

            // Generate Password (Manual)
            const newPass = crypto.randomBytes(8).toString('hex') + 'Aa1!';

            // Fill via evaluate to be sure
            await page.evaluate(({ name, pass }) => {
                const nameInput = document.querySelector('input[name="app_name"]');
                if (nameInput) {
                    nameInput.value = name;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const passInput = document.querySelector('input[name="app_passwd"]');
                if (passInput) {
                    passInput.value = pass;
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const passInput2 = document.querySelector('input[name="app_passwd2"]');
                if (passInput2) {
                    passInput2.value = pass;
                    passInput2.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput2.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }, { name: 'hiresense', pass: newPass });

            await page.waitForTimeout(500);

            // Save
            // Look for Save/Add in modal.
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

        } catch (e) {
            console.error(`Error ${record.email}:`, e.message);
        } finally {
            await page.close();
        }
    }

    await browser.close();

    const output = stringify(records, { header: true });
    fs.writeFileSync(outPath, output);
    console.log(`Completed. Saved to ${outPath}`);
})();
