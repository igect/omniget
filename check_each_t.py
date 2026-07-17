import os

src = 'E:/omniget/src'
targets = [
    'lib/study-components/TelegramTransferPanel.svelte',
    'lib/study-components/player/PlayerShell.svelte',
    'routes/misc/tracking/+page.svelte',
    'routes/misc/tracking/[id]/+page.svelte',
    'routes/study/anki/stats/revlog/+page.svelte',
    'routes/study/notes/journal/+page.svelte',
    'routes/study/read/downloads/+page.svelte',
]

for rel in targets:
    path = os.path.join(src, rel)
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()
    depth = 0
    issues = []
    for i, line in enumerate(lines):
        s = line.strip()
        if '{#each' in s:
            depth += 1
        if '{/each}' in s and depth > 0:
            depth -= 1
        if depth > 0 and '$t(' in s:
            issues.append(f'  L{i+1}: {s[:80]}')
    if issues:
        print(f'{rel}:')
        for iss in issues:
            print(iss)
        print()
