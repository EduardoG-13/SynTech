import urllib.request, json

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
        if 'Boletas podem ser editadas offline' in desc or 'Tempo gasto registrado com /spend' in desc or 'Pendências sincronizam' in desc:
            found.append(issue)

for issue in found:
    print(f"Found Issue #{issue['iid']} - {issue.get('title')} (State: {issue['state']})")

print("Checking merge requests...")
for page in range(1, 4):
    mrs = api('GET', f'{BASE}/projects/{ENC}/merge_requests?per_page=100&page={page}')
    if not mrs: break
    for mr in mrs:
        desc = mr.get('description', '') or ''
        if 'Boletas podem ser editadas offline' in desc or 'Tempo gasto registrado com /spend' in desc or 'Pendências sincronizam' in desc:
            print(f"Found MR !{mr['iid']} - {mr.get('title')} (State: {mr['state']})")

