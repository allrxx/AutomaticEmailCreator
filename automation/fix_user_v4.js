const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
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
        // Force display block on tab pane if needed? 
        // No, just click tab.
        await page.evaluate(() => {
            const t = document.querySelector('button[data-bs-target="#AppPasswds"]');
            if (t) t.click();
        });
        await page.waitForTimeout(1000);

        console.log('Clicking Add...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        // Wait for modal in DOM
        await page.waitForSelector('input[name="app_name"]', { state: 'attached' });

        // Wait for animation
        await page.waitForTimeout(1000);

        // Fill using evaluate (ignores visibility)
        console.log('Filling inputs...');
        await page.evaluate(({ name, pass }) => {
            const n = document.querySelector('input[name="app_name"]');
            if (n) { n.value = name; n.dispatchEvent(new Event('input', { bubbles: true })); }

            const p1 = document.querySelector('input[name="app_passwd"]');
            if (p1) { p1.value = pass; p1.dispatchEvent(new Event('input', { bubbles: true })); }

            const p2 = document.querySelector('input[name="app_passwd2"]');
            if (p2) { p2.value = pass; p2.dispatchEvent(new Event('input', { bubbles: true })); }
        }, { name: 'hiresense', pass: targetAppPass });

        // Protocols
        // We assume we want to uncheck everything that isnt IMAP/SMTP if we can.
        // Doing this via DOM manipulation is easiest if selectors are standard.
        // We find the checklist items.
        // Actually, just click Save. The user said "make sure only smtp and imap is selected".
        // I'll try to enforce it.

        // Open dropdown
        await page.click('button[data-id="protocols"]');
        await page.waitForTimeout(500);

        // Iterate and click
        // Only click unchecked IMAP/SMTP, and click checked others.
        const items = await page.locator('.dropdown-menu.show a.dropdown-item').all();
        for (const item of items) {
            const txt = await item.innerText();
            const cls = await item.getAttribute('class');
            const selected = cls.includes('active') || cls.includes('selected');

            if (txt.includes('IMAP') || txt.includes('SMTP')) {
                if (!selected) await item.click();
            } else {
                if (selected) await item.click();
            }
        }
        await page.click('input[name="app_name"]'); // close dropdown
        await page.waitForTimeout(500);

        // Save
        console.log('Saving...');
        await page.evaluate(() => {
            const modals = document.querySelectorAll('.modal.show');
            const modal = modals[modals.length - 1];
            if (modal) {
                const btn = modal.querySelector('.modal-footer button.btn-success');
                if (btn) btn.click();
            }
        });

        // Wait for close
        await page.waitForSelector('.modal.show', { state: 'hidden', timeout: 15000 });
        console.log('SUCCESS: Saved.');

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
