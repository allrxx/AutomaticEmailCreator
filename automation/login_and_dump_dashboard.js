const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        console.log('Navigating...');
        await page.goto('https://mail.cazehiresense.com/user');

        console.log('Filling form...');
        await page.fill('#login_user', 'hsd2loon9@cazehiresense.com');
        await page.fill('#pass_user', 'bpNQ251&6ueu!14c4cf4a');
        await page.click('button[value="Login"]');

        console.log('Waiting for network idle...');
        await page.waitForLoadState('networkidle');

        console.log('Logged in. Title:', await page.title());
        fs.writeFileSync('dashboard.html', await page.content());
        console.log('Saved dashboard.html');

        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
