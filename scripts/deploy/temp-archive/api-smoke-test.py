import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

def test_endpoint(path, desc, timeout=10):
    cmd = f'curl -s -o /dev/null -w "HTTP:%{{http_code}} TIME:%{{time_total}}" http://localhost:3002{path}'
    print(f'>>> {desc}: {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    print(f'  Result: {out}')
    if err:
        print(f'  Err: {err[:200]}')
    print()

# Basic pages
test_endpoint('/', 'Homepage')
test_endpoint('/disciplines', 'Disciplines page')
test_endpoint('/workshop', 'Workshop page')
test_endpoint('/tea-party', 'Tea Party page')
test_endpoint('/top-questions', 'Top Questions page')

# API endpoints
test_endpoint('/api/v1/disciplines', 'Disciplines API')
test_endpoint('/api/v1/posts', 'Posts API')
test_endpoint('/api/v1/ai/public-stats', 'AI Public Stats API')

client.close()
