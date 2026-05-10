import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

SYMLINK = "/data/home/zju321/scholars-tea"

def run(cmd, timeout=30):
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:3000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc, '\n')
    return rc

# Check if public-stats route exists
run(f'ls -la {SYMLINK}/src/app/api/v1/ai/')

# Check posts route
run(f'ls -la {SYMLINK}/src/app/api/v1/posts/')

# Test posts API with verbose output
run(f'curl -s -w "\\nHTTP:%{{http_code}}\\n" http://localhost:3002/api/v1/posts 2>&1 | tail -n 20')

# Test public-stats with verbose
run(f'curl -s -w "\\nHTTP:%{{http_code}}\\n" http://localhost:3002/api/v1/ai/public-stats 2>&1 | tail -n 20')

client.close()
