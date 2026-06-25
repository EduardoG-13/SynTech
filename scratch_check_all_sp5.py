import urllib.request, json
import sys, time

sys.stdout.reconfigure(encoding='utf-8')
TOKEN='glpat-We627_Ivw_XBNOgEeFuON286MQp1OjI0CA.01.0y1h4g6sl'
BASE='https://git.inteli.edu.br/api/v4'
ENC='graduacao%2F2026-1b%2Ft26%2Fg03'

def api(method, url, payload=None):
    data = json.dumps(payload).encode() if payload else None
    h = {'PRIVATE-TOKEN': TOKEN}
    if data: h['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    with urllib.request.urlopen(req) as r: 
        return json.loads(r.read())

print("Fetching ALL issues (open and closed)...")
my_issues = []
for page in range(1, 10):
    try:
        issues = api('GET', f'{BASE}/projects/{ENC}/issues?per_page=50&page={page}')
        if not issues: break
        for issue in issues:
            title = issue.get('title', '')
            if '[SP5]' in title.upper():
                assignees = issue.get('assignees', [])
                is_mine = False
                for a in assignees:
                    if 'Eduardo' in a.get('name', '') or 'Oliveira' in a.get('name', ''):
                        is_mine = True
                if is_mine:
                    my_issues.append(issue)
    except Exception as e:
        print(f"Error on page {page}: {e}")
        break

print(f"Found {len(my_issues)} SP5 issues assigned to Eduardo.")

updated_count = 0
for issue in my_issues:
    iid = issue['iid']
    desc = issue.get('description', '') or ''
    
    # Replace unchecked boxes with checked boxes
    new_desc = desc.replace('- [ ]', '- [x]').replace('* [ ]', '* [x]')
    
    if new_desc != desc:
        print(f"Updating issue #{iid} ({issue.get('title')})...")
        api('PUT', f'{BASE}/projects/{ENC}/issues/{iid}', {'description': new_desc})
        updated_count += 1
        time.sleep(0.2)

print(f"Done! Updated {updated_count} issues.")
