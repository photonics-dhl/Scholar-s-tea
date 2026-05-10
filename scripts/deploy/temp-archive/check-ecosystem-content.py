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

# Check ecosystem.config.js
run(f'cat {SYMLINK}/ecosystem.config.js')

# Check .env file
run(f'cat {SYMLINK}/.env | grep DATABASE_URL')

# Check if public-stats route exists locally
run(f'ls -la {SYMLINK}/src/app/api/v1/ai/')

# Check PM2 env for the process
run('pm2 env 0 | grep DATABASE_URL')

client.close()
