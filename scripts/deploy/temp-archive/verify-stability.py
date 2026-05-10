import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

print('Waiting 60 seconds for stability check...')
time.sleep(60)

def run(cmd, timeout=30):
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:2000])
    if err:
        print('ERR:', err[:1000])
    print()

run('pm2 status')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001')

# Save PM2 config
run('pm2 save')

client.close()
print('Stability check complete!')
