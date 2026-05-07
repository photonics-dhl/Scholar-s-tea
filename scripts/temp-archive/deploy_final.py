import paramiko
import time

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"

def run(cmd, timeout=60):
    full_cmd = f'cd "{WORK_DIR}" && {cmd}'
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    try:
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        rc = stdout.channel.recv_exit_status()
        if out:
            print(out[:3000])
        if err:
            print('ERR:', err[:1500])
        print(f'RC: {rc}')
        return rc, out, err
    except Exception as e:
        print(f'Timeout/exception: {e}')
        return -1, '', str(e)

# Pull latest
run('git pull github develop', timeout=30)

# Build
print('Building...')
run('NODE_OPTIONS="--max-old-space-size=1024" npm run build 2>&1 | tail -60', timeout=600)

# Check build
run('cat .next/BUILD_ID 2>/dev/null || echo BUILD_FAILED')

# Restart
run('pkill -f "next" 2>/dev/null ; true')
time.sleep(2)
run('nohup npm start -- -p 3002 > ~/logs/nextjs.log 2>&1 &', timeout=5)
time.sleep(5)

# Verify
run('ps aux | grep -E "next" | grep -v grep | head -3')
run('curl -s -I http://localhost:3002 2>&1 | head -3')

print('=== Done ===')
client.close()
