import urllib.request, json

TOKEN='glpat-We627_Ivw_XBNOgEeFuON286MQp1OjI0CA.01.0y1h4g6sl'
BASE='https://git.inteli.edu.br/api/v4'
ENC='graduacao%2F2026-1b%2Ft26%2Fg03'

def api(method, url):
    h = {'PRIVATE-TOKEN': TOKEN}
    req = urllib.request.Request(url, method=method, headers=h)
    with urllib.request.urlopen(req) as r: 
        return json.loads(r.read())

issues = api('GET', f'{BASE}/projects/{ENC}/issues?state=opened&per_page=100')
for issue in issues:
    assignees = issue.get('assignees', [])
    names = [a.get('name') for a in assignees]
    print(f"#{issue['iid']} - {issue.get('title')} - Assignees: {names}")
