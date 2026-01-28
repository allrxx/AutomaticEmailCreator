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

    const browser = await chromium.launch({ headless: true });
    // Use desktop viewport
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    const record = records[0];
    console.log(`Processing ${record.email}...`);

    try {
        await page.goto('https://mail.cazehiresense.com/user', { timeout: 60000 });

        await page.fill('#login_user', record.email);
        await page.fill('#pass_user', record.password);
        await page.click('button[value="Login"]');
        await page.waitForLoadState('networkidle');

        await page.click('a[href="/user"]');
        await page.waitForLoadState('networkidle');

        // Click Tab
        const tab = page.locator('button[data-bs-target="#AppPasswds"]:visible');
        if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(1000);
        }

        // Click Add via evaluate
        console.log('Clicking Add via evaluate...');
        await page.evaluate(() => {
            const btn = document.querySelector('button[data-id="add_apppasswd"]');
            if (btn) btn.click();
        });

        // Wait for modal
        await page.waitForSelector('input[name="app_name"]', { state: 'visible', timeout: 5000 });
        console.log('Modal Opened.');

        // Dump modal html
        const modalHtml = await page.locator('div.modal.show').innerHTML();
        fs.writeFileSync('modal_content.html', modalHtml);
        console.log('Dumped modal_content.html');

        await page.fill('input[name="app_name"]', 'hiresense');

        // Try to generate
        // Look for any button in modal
        // Just logs

    } catch (e) {
        console.error('Error:', e);
    }

    await browser.close();
})();
