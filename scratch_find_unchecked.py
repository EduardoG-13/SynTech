import urllib.request, json
import sys

sys.stdout.reconfigure(encoding='utf-8')
TOKEN='glpat-We627_Ivw_XBNOgEeFuON286MQp1OjI0CA.01.0y1h4g6sl'
BASE='https://git.inteli.edu.br/api/v4'
ENC='graduacao%2F2026-1b%2Ft26%2Fg03'

def api(method, url):
    h = {'PRIVATE-TOKEN': TOKEN}
    req = urllib.request.Request(url, method=method, headers=h)
    with urllib.request.urlopen(req) as r: 
        return json.loads(r.read())

found = []
for page in range(1, 4):
    issues = api('GET', f'{BASE}/projects/{ENC}/issues?per_page=100&page={page}')
    if not issues: break
    for issue in issues:
        desc = issue.get('description', '') or ''
        # We only care about issues that have an unchecked box related to the user's request
        if '- [ ]' in desc or '* [ ]' in desc:
            if 'offline' in desc or 'sincronizam' in desc or 'Tempo gasto' in desc:
                found.append(issue)

for issue in found:
    print(f"Found Issue #{issue['iid']} - {issue.get('title')} (State: {issue['state']}) with unchecked boxes!")
