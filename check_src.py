import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"
# Check src/index.ts
stdin, stdout, stderr = client.exec_command(f'grep -n "Loaded .env" "{path}/server/src/index.ts" 2>/dev/null || echo NOT_FOUND')
print('Env load in src:', stdout.read().decode().strip())

# Check if src has the env loading code
stdin, stdout, stderr = client.exec_command(f'head -25 "{path}/server/src/index.ts"')
print('First 25 lines of src:')
print(stdout.read().decode().strip())

client.close()
