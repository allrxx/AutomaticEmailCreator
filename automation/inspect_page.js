const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    
    console.log('Navigating to login page...');
    await page.goto('https://mail.cazehiresense.com/user', { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('Page loaded.');
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    
    // Dump HTML
    const content = await page.content();
    fs.writeFileSync('login_page.html', content);
    console.log('HTML saved to login_page.html');
    
    // Attempt to identify inputs
    const inputs = await page.evaluate(() => {
       return Array.from(document.querySelectorAll('input')).map(i => ({
         id: i.id,
         name: i.name,
         type: i.type,
         placeholder: i.placeholder,
         class: i.className
       }));
    });
    console.log('Inputs found:', JSON.stringify(inputs, null, 2));

    const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => ({
            text: b.innerText,
            id: b.id,
            class: b.className
        }));
     });
     console.log('Buttons found:', JSON.stringify(buttons, null, 2));

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
