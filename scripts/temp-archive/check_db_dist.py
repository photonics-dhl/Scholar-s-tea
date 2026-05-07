import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Check dist/db.js
stdin, stdout, stderr = client.exec_command(f'head -15 "{path}/server/dist/db.js"')
print('dist/db.js first 15 lines:')
print(stdout.read().decode().strip())

# Check dist/env.js exists
stdin, stdout, stderr = client.exec_command(f'ls -la "{path}/server/dist/env.js" 2>/dev/null || echo NOT_FOUND')
print('dist/env.js:', stdout.read().decode().strip())

# Check if socket server process is actually running
stdin, stdout, stderr = client.exec_command('ps aux | grep "server/dist/index.js" | grep -v grep')
print('All socket processes:')
print(stdout.read().decode().strip())

client.close()
