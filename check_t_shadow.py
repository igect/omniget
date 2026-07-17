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
    
    # Find each {#each ... as t ...} block and check if it contains $t(
    i = 0
    while i < len(lines):
        s = lines[i].strip()
        if '{#each' in s and ' as t ' in s:
            # Find the matching {/each}
            start = i
            depth = 1
            j = i + 1
            while j < len(lines) and depth > 0:
                if '{#each' in lines[j]:
                    depth += 1
                if '{/each}' in lines[j]:
                    depth -= 1
                j += 1
            end = j - 1
            
            # Check for $t( inside this block
            has_issues = False
            for k in range(start, end):
                if '$t(' in lines[k]:
                    if not has_issues:
                        print(f'{rel}: {rel} L{start+1}-L{end+1}')
                        has_issues = True
                    print(f'  L{k+1}: {lines[k].strip()[:80]}')
            
            i = end
        i += 1
