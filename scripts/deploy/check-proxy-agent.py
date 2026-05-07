import paramiko

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

stdin, stdout, stderr = client.exec_command('cat "/data/home/zju321/321/DHL/Scholar'"'"'s_Tea/node_modules/https-proxy-agent/package.json" | grep version')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('Version:', out)

client.close()
