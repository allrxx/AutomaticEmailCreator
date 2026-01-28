import re
try:
    with open('dashboard.html', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Look for buttons or links with "Settings" or "Preferences"
    settings = re.findall(r'<[^>]*?(?:Settings|Preferences|spanner)[^>]*?>', content, re.IGNORECASE)
    
    # Look for fa-cog or fa-wrench
    icons = re.findall(r'<i class="[^"]*(?:fa-cog|fa-wrench)[^"]*"[^>]*>', content)
    
    # Look for "App Passwords"
    app_pass = re.findall(r'<[^>]*?>App Passwords<[^>]*?>', content, re.IGNORECASE)
    app_pass_text = re.findall(r'App Passwords', content, re.IGNORECASE)

    # Dump all buttons to see what we have
    buttons = re.findall(r'<button[^>]+>.*?</button>', content, re.DOTALL)
    links = re.findall(r'<a [^>]+>.*?</a>', content, re.DOTALL)

    with open('dashboard_selectors.txt', 'w', encoding='utf-8') as f:
        f.write('POSSIBLE SETTINGS ELEMENTS:\n')
        f.write('\n'.join(settings))
        f.write('\n'.join(icons))
        f.write('\n\nAPP PASSWORDS TEXT FOUND:\n')
        f.write(str(len(app_pass_text)))
        f.write('\n\nBUTTONS:\n')
        f.write('\n'.join(buttons[:20])) # First 20
        f.write('\n\nLINKS:\n')
        f.write('\n'.join(links[:20])) # First 20

    print("Done")
except Exception as e:
    print(e)
