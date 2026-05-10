import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"
HTTPS_URL = "https://github.com/photonics-dhl/Scholar-s-tea.git"

def run(cmd, timeout=300):
    full_cmd = 'cd "{}" && {}'.format(WORK_DIR, cmd)
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:4000])
    if err:
        print('ERR:', err[:4000])
    print('RC:', rc)
    return rc

run('git pull "{}" develop'.format(HTTPS_URL), timeout=120)
rc = run('npm run build', timeout=600)
if rc != 0:
    print('BUILD FAILED!')
    client.close()
    sys.exit(1)
run('pm2 restart scholars-tea', timeout=60)
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')
print('=== Deploy Complete ===')
client.close()
