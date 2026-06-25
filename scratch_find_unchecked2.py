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

print("Fetching all open issues...")
issues = api('GET', f'{BASE}/projects/{ENC}/issues?state=opened&per_page=100')

found = []
for issue in issues:
    desc = issue.get('description', '') or ''
    if '- [ ]' in desc or '* [ ]' in desc:
        assignees = [a.get('name') for a in issue.get('assignees', [])]
        found.append({'iid': issue['iid'], 'title': issue['title'], 'assignees': assignees})

for f in found:
    print(f"Issue #{f['iid']}: {f['title']} | Assignees: {f['assignees']}")

print("Fetching all open merge requests...")
mrs = api('GET', f'{BASE}/projects/{ENC}/merge_requests?state=opened&per_page=100')

found_mrs = []
for mr in mrs:
    desc = mr.get('description', '') or ''
    if '- [ ]' in desc or '* [ ]' in desc:
        assignees = [a.get('name') for a in mr.get('assignees', [])]
        found_mrs.append({'iid': mr['iid'], 'title': mr['title'], 'assignees': assignees})

for f in found_mrs:
    print(f"MR !{f['iid']}: {f['title']} | Assignees: {f['assignees']}")

