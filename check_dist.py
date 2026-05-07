import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"
# Check if dist has env loading code
stdin, stdout, stderr = client.exec_command(f'grep -n "Loaded .env" "{path}/server/dist/index.js" 2>/dev/null || echo NOT_FOUND')
print('Env load in dist:', stdout.read().decode().strip())

# Check first 30 lines of dist/index.js
stdin, stdout, stderr = client.exec_command(f'head -30 "{path}/server/dist/index.js"')
print('First 30 lines of dist:')
print(stdout.read().decode().strip())

client.close()
