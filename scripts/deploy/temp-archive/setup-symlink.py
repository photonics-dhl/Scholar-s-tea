import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"
SYMLINK = "/data/home/zju321/scholars-tea"

def run(cmd, timeout=30):
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:2000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc)
    return rc

# Create symlink
run('rm -f {} && ln -s "{}" {}'.format(SYMLINK, WORK_DIR, SYMLINK))
run('ls -la {}'.format(SYMLINK))

# Update ecosystem.config.js to use symlink
run("sed -i \"s|{}|{}|g\" {}/ecosystem.config.js".format(WORK_DIR, SYMLINK, WORK_DIR))
run('grep cwd {}/ecosystem.config.js'.format(WORK_DIR))

# Kill nohup process and start with PM2 from symlink
run('pkill -f "next start"')
run('cd {} && pm2 start ecosystem.config.js'.format(SYMLINK))
run('sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')

client.close()
