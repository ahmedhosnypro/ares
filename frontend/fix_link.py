import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<Button([^>]*)href=\{([^}]+)\}([^>]*)component=\{Link\}([^>]*)>([^<]+)</Button>',
    r'<Link href={\2} passHref legacyBehavior><Button\1\3\4>\5</Button></Link>',
    content
)

content = re.sub(
    r'<Button([^>]*)component=\{Link\}([^>]*)href=\{([^}]+)\}([^>]*)>([^<]+)</Button>',
    r'<Link href={\3} passHref legacyBehavior><Button\1\2\4>\5</Button></Link>',
    content
)

with open('app/page.tsx', 'w') as f:
    f.write(content)
