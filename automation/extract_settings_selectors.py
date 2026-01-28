import re
try:
    with open('settings.html', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Check for "App Passwords"
    # It might be in a list or nav
    app_pass = re.findall(r'<[^>]*>App Passwords<[^>]*>', content)
    if not app_pass:
        app_pass = re.findall(r'App Passwords', content)
    
    # Inputs on this page
    inputs = re.findall(r'<input[^>]+>', content)
    
    # Buttons
    buttons = re.findall(r'<button[^>]+>.*?</button>', content, re.DOTALL)
    
    with open('settings_selectors.txt', 'w', encoding='utf-8') as f:
        f.write('APP PASSWORDS FOUND:\n')
        f.write(str(app_pass))
        f.write('\n\nINPUTS:\n')
        f.write('\n'.join(inputs))
        f.write('\n\nBUTTONS:\n')
        f.write('\n'.join(buttons))

    print("Done")
except Exception as e:
    print(e)
