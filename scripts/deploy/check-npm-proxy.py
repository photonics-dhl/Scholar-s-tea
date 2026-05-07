import paramiko

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

stdin, stdout, stderr = client.exec_command('cd "/data/home/zju321/321/DHL/Scholar'"'"'s_Tea" && npm install node-fetch@2 --save 2>&1 | tail -5')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('OUT:', out)

client.close()
