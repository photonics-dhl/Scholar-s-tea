import paramiko

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

stdin, stdout, stderr = client.exec_command('node -e "try { const { ProxyAgent } = require(\\\"node:undici\\\"); console.log(\\\"available\\\"); } catch(e) { console.log(\\\"not available:\\\", e.message); }"')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('OUT:', out)

client.close()
