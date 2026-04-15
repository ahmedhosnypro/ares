with open('/workspace/frontend/app/page.tsx', 'r') as f:
    text = f.read()

import re
text = re.sub(r'const defaultLocationId = locations\[0\]\?\.id \?\? "";\s*\?\s*await.*?:\s*\[\];', 'const defaultLocationId = locations[0]?.id ?? "";', text, flags=re.DOTALL)

with open('/workspace/frontend/app/page.tsx', 'w') as f:
    f.write(text)
