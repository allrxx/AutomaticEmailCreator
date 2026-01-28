const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({ headless: true });
    // Video recording to see what happens
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'videos/' } });
    const page = await context.newPage();

    try {
        console.log('Logging in as hsrgka0x0@cazehiresense.com');
        await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

        await page.fill('#login_user', 'hsrgka0x0@cazehiresense.com');
        await page.fill('#pass_user', 'YkJAnQz#m)DH!f032bdf5');
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        console.log('Navigating to settings...');
        await page.goto('https://mail.cazehiresense.com/user');
        await page.waitForLoadState('networkidle');

        // Click Tab
        const tab = page.locator('button[data-bs-target="#AppPasswds"]');
        if (await tab.isVisible()) {
            await tab.click();
        } else {
            await page.getByText('App passwords').click();
        }
        await page.waitForTimeout(2000);

        // Screenshot the table area
        await page.screenshot({ path: 'check_app_passwords.png', fullPage: true });

        // Check for existing rows
        // Usually these are in a table or list info
        // Let's dump the HTML of the active tab pane
        const pane = page.locator('#AppPasswds');
        fs.writeFileSync('app_passwords_pane.html', await pane.innerHTML());

        console.log('Dumped pane content.');

    } catch (e) {
        console.error(e);
    }

    await browser.close();
})();
