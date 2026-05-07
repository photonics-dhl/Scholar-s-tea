import paramiko

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

CD_CMD = 'cd "/data/home/zju321/321/DHL/Scholar\'s_Tea"'

def run(cmd):
    full_cmd = f'{CD_CMD} && {cmd}'
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print('ERR:', err)

print('=== Process Check ===')
run('ps aux | grep -E "(next-server|node)" | grep -v grep')
print()
print('=== Port Check ===')
run('netstat -tlnp 2>/dev/null | grep -E ":3002|:3001" || ss -tlnp | grep -E ":3002|:3001"')
print()
print('=== Service Test ===')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001')

client.close()
