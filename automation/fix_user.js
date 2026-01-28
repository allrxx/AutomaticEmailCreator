const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'fix_video/' } });
    const page = await context.newPage();

    const email = 'hsrgka0x0@cazehiresense.com';
    const password = 'YkJAnQz#m)DH!f032bdf5';
    // const appPass = '24ec2e24be0ed2e4Aa1!'; // We will regenerate it to be sure and update users file if needed? 
    // Wait, the user has the file with this password. It is better if we can just set it to this password if possible, or generate a new one and tell the user.
    // The previous password is known to the user. I'll use a NEW one and print it, so the user knows to update it.
    // Or I can force the specific password the user expects if the form allows manual entry?
    // Yes, the fields are `app_passwd` and `app_passwd2`. I can set them manually.

    // BUT, the previous attempted password was '24ec2e24be0ed2e4Aa1!'.
    // If I can set it to that, it matches the file the user already has.
    const targetAppPass = '24ec2e24be0ed2e4Aa1!';

    try {
        console.log(`Fixing ${email}...`);
        await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

        await page.fill('#login_user', email);
        await page.fill('#pass_user', password);
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        await page.goto('https://mail.cazehiresense.com/user');
        await page.waitForLoadState('networkidle');

        // Tab
        const tab = page.locator('button[data-bs-target="#AppPasswds"]');
        await tab.click();
        await page.waitForTimeout(1000);

        // Add
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        await page.waitForSelector('input[name="app_name"]', { state: 'attached', timeout: 10000 });
        console.log('Modal visible');

        // Fill
        await page.fill('input[name="app_name"]', 'hiresense');
        await page.fill('input[name="app_passwd"]', targetAppPass);
        await page.fill('input[name="app_passwd2"]', targetAppPass);

        // Wait a bit
        await page.waitForTimeout(500);

        // Click Save
        const saveBtn = page.locator('.modal.show button.btn-success').filter({ hasText: /Add|Save/i });
        await saveBtn.first().click();

        console.log('Clicked Save.');

        // Wait for modal to disappear or table to update
        try {
            await page.waitForSelector('.modal.show', { state: 'hidden', timeout: 10000 });
            console.log('Modal closed.');
        } catch (e) { console.log('Modal did not close automatically?'); }

        // Wait for table to reload
        await page.waitForTimeout(2000);

        // Verify it exists now
        const tableHtml = await page.locator('#AppPasswds').innerHTML();
        if (tableHtml.includes('hiresense')) {
            console.log('VERIFIED: App password created successfully.');
        } else {
            console.log('ERROR: App password still not found in table.');
            fs.writeFileSync('fix_failed.html', tableHtml);
        }

    } catch (e) {
        console.error(e);
    }

    await browser.close();
})();
