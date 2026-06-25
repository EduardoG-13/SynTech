import urllib.request, json

TOKEN='glpat-We627_Ivw_XBNOgEeFuON286MQp1OjI0CA.01.0y1h4g6sl'
BASE='https://git.inteli.edu.br/api/v4'
ENC='graduacao%2F2026-1b%2Ft26%2Fg03'

def api(url):
    h = {'PRIVATE-TOKEN': TOKEN}
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req) as r: 
        return json.loads(r.read())

print("Searching issues...")
try:
    issues = api(f'{BASE}/projects/{ENC}/issues?search=offline')
    for issue in issues:
        print(f"Issue #{issue['iid']} - {issue.get('title')}")
except Exception as e:
    print("Error fetching issues:", e)

print("Searching merge requests...")
try:
    mrs = api(f'{BASE}/projects/{ENC}/merge_requests?search=offline')
    for mr in mrs:
        print(f"MR !{mr['iid']} - {mr.get('title')}")
except Exception as e:
    print("Error fetching MRs:", e)
