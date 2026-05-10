import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

time.sleep(5)

def test(path, desc):
    cmd = f'curl -s -o /dev/null -w "HTTP:%{{http_code}}" http://localhost:3002{path}'
    stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
    code = stdout.read().decode('utf-8', errors='replace').strip()
    status = "PASS" if code == "HTTP:200" else "FAIL"
    print(f'  [{status}] {desc}: {code}')

print('=== Pages ===')
test('/', 'Homepage')
test('/disciplines', 'Disciplines')
test('/disciplines/computer-science', 'Discipline detail')
test('/disciplines/computer-science/posts', 'Discipline posts')
test('/workshop', 'Workshop')
test('/workshop?mode=peer_review', 'Workshop peer review')
test('/tea-party', 'Tea Party')
test('/top-questions', 'Top Questions')
test('/groups', 'Groups')

print('\n=== APIs ===')
test('/api/v1/disciplines', 'Disciplines API')
test('/api/v1/posts', 'Posts API')
test('/api/v1/public-stats', 'Public stats API')
test('/api/v1/ai/chat', 'AI chat API')

print('\n=== PM2 Status ===')
stdin, stdout, stderr = client.exec_command('pm2 status')
out = stdout.read().decode('utf-8', errors='replace').strip()
for line in out.split('\n')[3:5]:
    print(' ', line)

client.close()
