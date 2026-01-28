const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('https://mail.cazehiresense.com/user');

        await page.fill('#login_user', 'hsd2loon9@cazehiresense.com');
        await page.fill('#pass_user', 'bpNQ251&6ueu!14c4cf4a');
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        // Go to settings
        console.log('Clicking Settings...');
        await page.click('a[href="/user"]');
        await page.waitForLoadState('networkidle');

        // Click App Passwords tab
        console.log('Clicking App Passwords tab...');
        const tab = page.locator('button[data-bs-target="#AppPasswds"]');
        await tab.waitFor({ state: 'visible' });
        await tab.click();
        await page.waitForTimeout(2000);

        // Click Add button
        console.log('Clicking Add button...');
        const addButton = page.locator('button[data-id="add_apppasswd"]');
        // It might be hidden if the tab isn't fully active, try force
        if (await addButton.isVisible()) {
            await addButton.click();
        } else {
            console.log('Add button not visible yet, forcing click...');
            await addButton.click({ force: true });
        }

        // Wait for modal input
        console.log('Waiting for modal...');
        await page.waitForSelector('input[name="app_name"]', { state: 'visible', timeout: 10000 });

        console.log('Modal opened.');
        fs.writeFileSync('modal.html', await page.content());

        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
