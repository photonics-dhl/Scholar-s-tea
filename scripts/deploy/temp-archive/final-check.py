import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

time.sleep(15)

for cmd in [
    'pm2 status',
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3002',
    'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001',
    'tail -n 5 /data/home/zju321/.pm2/logs/scholars-tea-out-0.log',
    'tail -n 5 /data/home/zju321/.pm2/logs/scholars-tea-socket-out-1.log',
]:
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    print(out)
    print()

client.close()
