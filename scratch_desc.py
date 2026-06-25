import urllib.request, json
import sys

# Change standard output encoding to utf-8 to avoid charmap errors
sys.stdout.reconfigure(encoding='utf-8')

TOKEN='glpat-We627_Ivw_XBNOgEeFuON286MQp1OjI0CA.01.0y1h4g6sl'
BASE='https://git.inteli.edu.br/api/v4'
ENC='graduacao%2F2026-1b%2Ft26%2Fg03'

def api(method, url):
    h = {'PRIVATE-TOKEN': TOKEN}
    req = urllib.request.Request(url, method=method, headers=h)
    with urllib.request.urlopen(req) as r: 
        return json.loads(r.read())

issue = api('GET', f'{BASE}/projects/{ENC}/issues/454')
print(f"Title: {issue['title']}")
print(f"State: {issue['state']}")
print(f"Assignees: {[a['name'] for a in issue.get('assignees', [])]}")
print("--- DESC ---")
print(issue.get('description', ''))
