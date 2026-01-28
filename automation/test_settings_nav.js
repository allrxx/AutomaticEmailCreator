const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://mail.cazehiresense.com/user');

        // Login
        await page.fill('#login_user', 'hsd2loon9@cazehiresense.com');
        await page.fill('#pass_user', 'bpNQ251&6ueu!14c4cf4a');
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        console.log('Logged in.');

        // Click Settings / User config
        const settingsSelector = 'a[href="/user"]';

        try {
            await page.waitForSelector(settingsSelector, { timeout: 10000 });
            console.log('Found ID config button, clicking...');
            await page.click(settingsSelector);
            await page.waitForLoadState('networkidle');
        } catch (e) {
            console.log('Settings button not found immediately. Screenshotting.');
            await page.screenshot({ path: 'no_settings.png' });
        }

        console.log('Current Title:', await page.title());
        fs.writeFileSync('settings.html', await page.content());

        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
