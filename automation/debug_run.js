const fs = require('fs');
const { chromium } = require('playwright');
const { parse } = require('csv-parse/sync');

const csvPath = 'c:/Users/alexj/Downloads/Test/mailboxes_testing - mailboxes_testing.csv';

(async () => {
    let records = [];
    try {
        const input = fs.readFileSync(csvPath);
        records = parse(input, { columns: true, skip_empty_lines: true });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    const record = records[0]; // User 1
    console.log(`Debugging ${record.email}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    async function shot(name) {
        await page.screenshot({ path: `debug_${name}.png` });
        console.log(`Saved debug_${name}.png`);
    }

    try {
        console.log('Navigating to login...');
        await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });
        await shot('1_login');

        console.log('Filling credentials...');
        await page.fill('#login_user', record.email);
        await page.fill('#pass_user', record.password);
        await shot('2_filled');

        await page.click('button[value="Login"]');
        console.log('Clicked login...');
        await page.waitForLoadState('networkidle');
        await shot('3_after_login');

        // Check if login worked
        if (await page.locator('#login_user').isVisible()) {
            console.log('Still on login page!');
            return;
        }

        console.log('Navigating to settings...');
        await page.click('a[href="/user"]');
        await page.waitForLoadState('networkidle');
        await shot('4_settings');

        console.log('Clicking Tab...');
        const tab = page.locator('button[data-bs-target="#AppPasswds"]');
        if (await tab.isVisible()) {
            await tab.click();
        } else {
            // Try force click via evaluate
            await page.evaluate(() => {
                const t = document.querySelector('button[data-bs-target="#AppPasswds"]');
                if (t) t.click();
            });
        }
        await page.waitForTimeout(1000);
        await shot('5_tab_clicked');

        console.log('Clicking Add...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        console.log('Waiting for modal...');
        try {
            await page.waitForSelector('input[name="app_name"]', { state: 'attached', timeout: 5000 });
            await shot('6_modal_open');
        } catch (e) {
            console.log('Modal timeout');
            await shot('6_modal_fail');
        }

    } catch (e) {
        console.error('Error:', e);
        await shot('error');
    }

    await browser.close();
})();
