const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

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

    const browser = await chromium.launch({ headless: true });

    // Process only first user for testing? No, instruction is to do it.
    // But I will catch errors.

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record.app_password && record.app_password.trim() !== '') {
            console.log(`Skipping ${record.email}, already has app password.`);
            continue;
        }

        console.log(`Processing ${record.email}...`);
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await context.newPage();

        try {
            await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

            // Login
            await page.fill('#login_user', record.email);
            await page.fill('#pass_user', record.password);
            await page.click('button[value="Login"]');
            await page.waitForLoadState('networkidle');

            // Check if logged in
            if (await page.locator('#login_user').isVisible()) {
                console.error('Login failed.');
                throw new Error('Login failed');
            }

            // Go to settings
            await page.click('a[href="/user"]');
            await page.waitForLoadState('networkidle');

            // Click App Passwords tab
            // Trying multiple selectors
            try {
                await page.click('button[data-bs-target="#AppPasswds"]');
            } catch (e) {
                console.log('Tab click failed, trying text locator');
                await page.getByText('App passwords').click();
            }
            await page.waitForTimeout(1000);

            // Click Add
            // Try visible button
            const addButton = page.locator('button[data-id="add_apppasswd"]');
            if (await addButton.isVisible()) {
                await addButton.click();
            } else {
                console.log('Forcing Add button click...');
                await addButton.click({ force: true });
            }

            // Wait for modal
            await page.waitForSelector('input[name="app_name"]', { state: 'visible', timeout: 10000 });
            await page.fill('input[name="app_name"]', 'hiresense');

            // Generate Password
            // Look for generate button
            // "under password click on generate"
            // We look for text "Generate"
            try {
                // Try finding a button or link with "Generate"
                // Or "create"
                const genBtn = page.locator('button', { hasText: 'Generate' }).or(page.locator('a', { hasText: 'Generate' }));
                if (await genBtn.count() > 0) {
                    await genBtn.first().click();
                } else {
                    console.log('Generate button not found by text. Clicking password input...');
                    await page.click('input[name="app_passwd"]');
                    // Try to see if there is an icon?
                }
                await page.waitForTimeout(1000);
            } catch (e) {
                console.log('Generate flow error', e);
            }

            // Protocols
            // Click dropdown
            await page.click('button[data-id="protocols"]');
            await page.waitForTimeout(500);
            // Dropdown should be open.
            // Check IMAP and SMTP. Uncheck others.
            // Assuming standard bootstrap-select or similar
            // Text: "IMAP", "SMTP", "POP3", "Sieve", "EAS/ActiveSync"
            // We want IMAP and SMTP.
            // If they are selected, they usually have "selected" class or checkmark.
            // We'll click "POP3", "Sieve", "EAS/ActiveSync", "CardDAV/CalDAV" if they are present and seem checked.
            // Or just click "IMAP" and "SMTP" if they seem UNchecked.

            // Simpler strategy: Just click "IMAP" and "SMTP" to ensure they are checked?
            // Toggle behavior is tricky.
            // I'll assume default is ALL checked (based on title "IMAP, SMTP, ...").
            // So I need to uncheck POP3, Sieve, etc.
            const toUncheck = ['POP3', 'Sieve', 'EAS/ActiveSync', 'CardDAV/CalDAV'];
            for (const proto of toUncheck) {
                const item = page.locator('.dropdown-item', { hasText: proto });
                // If it has class 'selected' or 'active', click it.
                // Or just click it and see.
                if (await item.isVisible()) {
                    // Check if active
                    const classAttr = await item.getAttribute('class');
                    if (classAttr.includes('active') || classAttr.includes('selected')) {
                        await item.click();
                    }
                }
            }

            // Protocols done? Close dropdown?
            // Usually clicking outside closes it, or clicking the button again.
            await page.click('input[name="app_name"]'); // click elsewhere
            await page.waitForTimeout(500);

            // Read Password
            const generatedPass = await page.inputValue('input[name="app_passwd"]');
            console.log(`Generated Password: ${generatedPass}`);
            record.app_password = generatedPass;

            // Click Add/Save in modal
            // Find the green button in the modal
            const saveBtn = page.locator('.modal.show button.btn-success');
            await saveBtn.click();
            await page.waitForTimeout(2000); // Wait for save

            console.log('Saved.');

        } catch (e) {
            console.error(`Error processing ${record.email}:`, e);
            // Save screenshot
            await page.screenshot({ path: `error_${record.email}.png` });
        } finally {
            await context.close();
        }
    }

    await browser.close();

    // Write CSV
    const output = stringify(records, { header: true });
    fs.writeFileSync(outPath, output);
    console.log(`Updated CSV saved to ${outPath}`);
})();
