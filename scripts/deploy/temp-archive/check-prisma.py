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
        print(out[:2000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc)
    return rc

# Check if prisma client is generated
run('ls -la {}/node_modules/.prisma/client/ 2>/dev/null | head -10'.format(SYMLINK))

# Try a prisma query directly via node
run('cd {} && node -e "const {{ PrismaClient }} = require(\'@prisma/client\'); const p = new PrismaClient(); p.communityCitation.count().then(c => console.log(\"count:\", c)).catch(e => console.error(\"error:\", e.message)).finally(() => p.\\$disconnect())"'.format(SYMLINK), timeout=15)

client.close()
