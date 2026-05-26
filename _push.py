import subprocess, os

# Read token from env file
with open('/home/clawsy/.hermes/profiles/warayo/.env') as f:
    for line in f:
        if 'GITHUB_TOKEN' in line:
            token = line.split('=', 1)[1].strip().strip('"').strip("'")
            break

print(f"Token: {token[:6]}...{token[-4:]} (len={len(token)})")

# Check if it works with curl
import json
r = subprocess.run(
    ['curl', '-s', '-H', f'Authorization: token {token}',
     'https://api.github.com/user'],
    capture_output=True, text=True
)
print("User check:", json.loads(r.stdout).get('login', r.stdout[:100]))

# Accept invitation
r = subprocess.run(
    ['curl', '-s', '-X', 'PATCH', '-H', f'Authorization: token {token}',
     'https://api.github.com/user/repository_invitations/320190338'],
    capture_output=True, text=True
)
print("Invitation accept:", r.stdout or "204 (accepted)")
print("Return code:", r.returncode)

# Push the branch
r = subprocess.run(
    ['git', '-c', f'credential.helper=!f() {{ echo "username={token}"; echo "password=x-oauth-basic"; }}; f',
     'push', 'https://github.com/Robertoarce/briatti.git', 'next-step'],
    capture_output=True, text=True, cwd='/home/clawsy/briatti'
)
print("Push stdout:", r.stdout)
print("Push stderr:", r.stderr)
print("Push exit:", r.returncode)
