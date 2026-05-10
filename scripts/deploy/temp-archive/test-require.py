import paramiko
import sys

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

# Test require with proper quoting
run("node -e 'try { console.log(require.resolve(\"./.next/server/pages/_error.js\")) } catch(e) { console.error(e.message) }'")

# Check _error.js.nft.json
run('cat .next/server/pages/_error.js.nft.json')

# Check if the file is readable
run('node -e "const fs=require(\"fs\"); console.log(fs.existsSync(\".next/server/pages/_error.js\"))"')

client.close()
