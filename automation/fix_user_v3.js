const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    // Video for debug
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'fix_v3_video/' } });
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

        if (!page.url().includes('/user')) {
            await page.goto('https://mail.cazehiresense.com/user');
            await page.waitForLoadState('networkidle');
        }

        console.log('Opening Tab...');
        // Try simple click first
        try {
            const tab = page.locator('button[data-bs-target="#AppPasswds"]');
            await tab.waitFor({ state: 'attached' });
            await tab.click();
        } catch (e) {
            console.log('Tab click error, forcing...');
            await page.evaluate(() => {
                const t = document.querySelector('button[data-bs-target="#AppPasswds"]');
                if (t) t.click();
            });
        }
        await page.waitForTimeout(1000);

        console.log('Clicking Add...');
        // Force click via evaluate to be sure
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        // Wait for modal input
        await page.waitForSelector('input[name="app_name"]', { state: 'attached', timeout: 8000 });
        console.log('Modal Attached.');

        // Wait for visibility? Maybe it animates.
        await page.waitForTimeout(500);

        // Fill Name via fill or evaluate
        await page.fill('input[name="app_name"]', 'hiresense');

        // Fill Password
        await page.fill('input[name="app_passwd"]', targetAppPass);
        await page.fill('input[name="app_passwd2"]', targetAppPass);

        // Protocols handling
        console.log('Handling Protocols...');
        const protoBtn = page.locator('button[data-id="protocols"]');
        await protoBtn.click();
        // Wait for dropdown
        await page.waitForSelector('.dropdown-menu.show', { timeout: 2000 });

        // Items
        const items = await page.locator('.dropdown-menu.show a.dropdown-item').all();
        console.log(`Found ${items.length} protocol items.`);

        for (const item of items) {
            const txt = await item.innerText();
            const cls = await item.getAttribute('class');
            const selected = cls.includes('selected') || cls.includes('active');

            if (txt.includes('IMAP') || txt.includes('SMTP')) {
                if (!selected) {
                    console.log(`Selecting ${txt}`);
                    await item.click();
                }
            } else {
                if (selected) {
                    console.log(`Deselecting ${txt}`);
                    await item.click();
                }
            }
        }
        // Close dropdown
        await page.click('input[name="app_name"]');
        await page.waitForTimeout(500);

        // Click Save
        console.log('Saving...');
        // Find saving button more robustly
        // It's usually the success button in the modal footer
        // We look for button that isn't the close button
        const saveBtn = page.locator('.modal.show .modal-footer button.btn-success');
        await saveBtn.click();

        // Wait for modal close
        await page.waitForSelector('.modal.show', { state: 'hidden', timeout: 15000 });
        console.log('Modal closed.');

        // Verify
        const content = await page.locator('#AppPasswds').innerText();
        if (content.includes('hiresense')) {
            console.log('SUCCESS: Verified entry.');
        } else {
            console.log('WARNING: Entry not found in text.');
        }

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
