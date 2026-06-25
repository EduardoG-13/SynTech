import urllib.request, json, time

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

print("Fetching all open issues for the project...")
issues = api('GET', f'{BASE}/projects/{ENC}/issues?state=opened&per_page=100')

my_issues = []
for issue in issues:
    assignees = issue.get('assignees', [])
    for assignee in assignees:
        if 'Eduardo' in assignee.get('name', '') or 'Oliveira' in assignee.get('name', ''):
            my_issues.append(issue)
            break

for issue in my_issues:
    iid = issue['iid']
    desc = issue.get('description', '') or ''
    
    # Replace unchecked boxes with checked boxes
    new_desc = desc.replace('- [ ]', '- [x]').replace('* [ ]', '* [x]')
    
    if new_desc != desc:
        print(f"Updating issue #{iid} ({issue.get('title')})...")
        api('PUT', f'{BASE}/projects/{ENC}/issues/{iid}', {'description': new_desc})
        time.sleep(0.2)
    else:
        print(f"Issue #{iid} already has everything checked or no checkboxes.")

print("Done!")
