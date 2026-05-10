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
        print('ERR:', err[:3000])
    print('RC:', rc, '\n')
    return rc

# Read ecosystem.config.js from symlink path
run('cat {}/ecosystem.config.js'.format(SYMLINK))

# Check actual log files in .pm2
run('ls -la /data/home/zju321/.pm2/logs/')
run('find /data/home/zju321/.pm2 -name "*.log" -type f')

# Check actual PM2 log directory
run('cat /data/home/zju321/.pm2/pm2.log | tail -n 30')

client.close()
