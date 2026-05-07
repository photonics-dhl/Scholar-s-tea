import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Run socket server build
stdin, stdout, stderr = client.exec_command(f'cd "{path}/server" && npm run build 2>&1')
print('Build output:')
print(stdout.read().decode().strip())
print('Build stderr:')
print(stderr.read().decode().strip())

# Verify dist/index.js now has env loading
stdin, stdout, stderr = client.exec_command(f'grep -n "Loaded .env" "{path}/server/dist/index.js" 2>/dev/null || echo NOT_FOUND')
print('Env load in dist after build:', stdout.read().decode().strip())

client.close()
