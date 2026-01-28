const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser (VISIBLE)...');
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
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

        console.log('Logged in. Navigating to settings...');
        await page.goto('https://mail.cazehiresense.com/user');
        await page.waitForLoadState('networkidle');

        console.log('Click App Passwords tab...');
        await page.click('text=App passwords');
        await page.waitForTimeout(1500);

        console.log('Click Create app password button...');
        // THIS IS THE FIX: It's an <a> tag with data-bs-target="#addAppPasswdModal"
        await page.click('a[data-bs-target="#addAppPasswdModal"]');

        console.log('Waiting for modal...');
        await page.waitForSelector('#addAppPasswdModal.show', { state: 'visible', timeout: 5000 });
        console.log('Modal is visible!');

        console.log('Filling form...');
        await page.fill('input[name="app_name"]', 'hiresense');
        await page.fill('input[name="app_passwd"]', targetAppPass);
        await page.fill('input[name="app_passwd2"]', targetAppPass);

        console.log('Configuring protocols (IMAP + SMTP only)...');
        // Open dropdown
        await page.click('button[data-id="protocols"]');
        await page.waitForTimeout(500);

        // Click items to toggle - uncheck unwanted ones
        const unwanted = ['POP3', 'Sieve', 'EAS', 'CardDAV'];
        for (const proto of unwanted) {
            const item = page.locator(`.dropdown-menu.show .dropdown-item:has-text("${proto}")`);
            if (await item.count() > 0) {
                const cls = await item.getAttribute('class');
                if (cls && (cls.includes('active') || cls.includes('selected'))) {
                    await item.click();
                    console.log(`Unchecked ${proto}`);
                }
            }
        }

        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        console.log('Clicking Add button...');
        await page.click('#addAppPasswdModal button.btn-success');

        console.log('Waiting for modal to close...');
        await page.waitForSelector('#addAppPasswdModal', { state: 'hidden', timeout: 10000 });

        console.log('SUCCESS! App password created.');
        await page.waitForTimeout(5000);

    } catch (e) {
        console.error('Error:', e.message);
        await page.waitForTimeout(30000);
    }

    await browser.close();
})();
