import re
try:
    with open('login_page.html', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    inputs = re.findall(r'<input[^>]+>', content)
    buttons = re.findall(r'<button[^>]+>.*?</button>', content, re.DOTALL)
    
    with open('selectors.txt', 'w', encoding='utf-8') as f:
        f.write('INPUTS:\n')
        f.write('\n'.join(inputs))
        f.write('\n\nBUTTONS:\n')
        f.write('\n'.join(buttons))
    print("Done extracting selectors to selectors.txt")
except Exception as e:
    print(f"Error: {e}")
