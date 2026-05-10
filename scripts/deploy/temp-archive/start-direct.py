import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"

def run(cmd, timeout=30):
    full_cmd = 'cd "{}" && {}'.format(WORK_DIR, cmd)
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:3000])
    if err:
        print('ERR:', err[:3000])
    print('RC:', rc)
    return rc

# Stop PM2 managed instance
run('pm2 stop scholars-tea')

# Kill any existing next processes
run('pkill -f "next start" 2>/dev/null || true')
time.sleep(2)

# Start directly with nohup
run('nohup npm start -- -p 3002 > ~/logs/nextjs.log 2>&1 &', timeout=5)
time.sleep(5)

# Verify
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')
run('ps aux | grep "next start" | grep -v grep')

print('=== Direct Start Complete ===')
client.close()
