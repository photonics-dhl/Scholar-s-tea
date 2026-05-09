import paramiko
import time
import sys

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"
HTTPS_URL = "https://github.com/photonics-dhl/Scholar-s-tea.git"

def run(cmd, timeout=180):
    full_cmd = 'cd "{}" && {}'.format(WORK_DIR, cmd)
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    end_time = time.time() + timeout
    while time.time() < end_time:
        if stdout.channel.exit_status_ready():
            break
        time.sleep(0.5)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        try: print(out)
        except: print('[output]')
    if err:
        try: print('ERR:', err)
        except: print('ERR: [output]')
    print('RC:', rc)
    return rc

# Pull via HTTPS to avoid SSH timeout
run('git pull "{}" develop'.format(HTTPS_URL), timeout=120)
run('npm run build', timeout=300)
run('pm2 restart scholars-tea', timeout=60)

print('=== Deploy Complete ===')
client.close()
