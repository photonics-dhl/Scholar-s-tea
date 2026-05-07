import paramiko
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', errors='replace', closefd=False)

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

stdin, stdout, stderr = client.exec_command('ls "/data/home/zju321/321/DHL/Scholar'"'"'s_Tea/node_modules" | grep -E "proxy|global-agent|node-fetch|undici"')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('Proxy packages:', out if out else 'none found')

client.close()
