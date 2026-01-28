const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    // Use video to debug if needed
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'fix_v2_video/' } });
    const page = await context.newPage();

    const email = 'hsrgka0x0@cazehiresense.com';
    const password = 'YkJAnQz#m)DH!f032bdf5';
    const targetAppPass = '24ec2e24be0ed2e4Aa1!';

    try {
        console.log(`Logging in ${email}...`);
        await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

        await page.fill('#login_user', email);
        await page.fill('#pass_user', password);
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        // Ensure we are on settings
        if (!page.url().includes('/user')) {
            await page.click('a[href="/user"]');
            await page.waitForLoadState('networkidle');
        }

        // Open App Passwords Tab
        console.log('Opening Tab...');
        const tab = page.locator('button[data-bs-target="#AppPasswds"]');
        if (await tab.isVisible()) {
            await tab.click();
        } else {
            // Force click
            await page.evaluate(() => {
                const t = document.querySelector('button[data-bs-target="#AppPasswds"]');
                if (t) t.click();
            });
        }
        await page.waitForTimeout(1000);

        // Click Add
        console.log('Clicking Add...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        // Wait for modal
        await page.waitForSelector('input[name="app_name"]', { state: 'visible', timeout: 10000 });
        console.log('Modal found.');

        // Fill Name
        await page.fill('input[name="app_name"]', 'hiresense');

        // Fill Password (Manual)
        await page.fill('input[name="app_passwd"]', targetAppPass);
        await page.fill('input[name="app_passwd2"]', targetAppPass);

        // HANDLE PROTOCOLS
        console.log('Configuring Protocols...');
        // Open dropdown
        await page.click('button[data-id="protocols"]');

        // We need to uncheck everything except IMAP and SMTP
        // The dropdown items are likely <a> or <li> elements with text.
        // If they are selected, they usually have "selected" class or an icon.
        // Let's assume standard behavior: click to toggle.
        // We will click 'POP3', 'Sieve', 'EAS/ActiveSync', 'CardDAV/CalDAV' IF they are selected.
        // Or we can just click them and check the state after?
        // Playwright's specific selectors help here.

        const protocols = ['POP3', 'Sieve', 'EAS', 'CardDAV'];
        // Note: Full text might be 'EAS/ActiveSync', 'CardDAV/CalDAV'

        // We iterate and try to uncheck.
        // Since we don't know initial state for sure (likely all checked), we uncheck the unwanted ones.
        // We check for "selected" class on the item.

        const items = await page.locator('.dropdown-menu.show a.dropdown-item, .dropdown-menu.show li').all();

        for (const item of items) {
            const text = await item.innerText();
            const classAttr = await item.getAttribute('class') || '';
            const isSelected = classAttr.includes('selected') || classAttr.includes('active');

            console.log(`Protocol Item: ${text}, Selected: ${isSelected}`);

            // We want to KEEP IMAP and SMTP.
            // We want to REMOVE others.

            const isKeep = text.includes('IMAP') || text.includes('SMTP');

            if (isKeep) {
                if (!isSelected) {
                    console.log(`Checking ${text}...`);
                    await item.click();
                    await page.waitForTimeout(200); // Wait for toggle
                }
            } else {
                if (isSelected) {
                    console.log(`Unchecking ${text}...`);
                    await item.click();
                    await page.waitForTimeout(200); // Wait for toggle
                }
            }
        }

        // Close dropdown (click label or outside)
        await page.click('label[for="app_name"]');
        await page.waitForTimeout(500);

        // SAVE
        console.log('Saving...');
        const saveBtn = page.locator('.modal.show button.btn-success').filter({ hasText: /Add|Save/i });
        await saveBtn.click();

        // Wait for modal to close
        await page.waitForSelector('.modal.show', { state: 'hidden', timeout: 10000 });
        console.log('Modal closed. Saved successfully.');

        // Verify
        await page.waitForTimeout(1000);
        const html = await page.locator('#AppPasswds').innerHTML();
        if (html.includes('hiresense')) {
            console.log('VERIFIED: Entry exists.');
        } else {
            console.log('WARNING: Entry not found in table immediately.');
        }

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
