import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Kill old socket server
stdin, stdout, stderr = client.exec_command(f'pkill -f "server/dist/index.js" 2>/dev/null; sleep 1')
print('Kill old:', stdout.read().decode().strip())

# Start new socket server with cd to project root
stdin, stdout, stderr = client.exec_command(f'cd "{path}" && nohup node server/dist/index.js > ~/logs/socket.log 2>&1 &')
print('Start new:', stdout.read().decode().strip())

# Wait and verify
import time
time.sleep(2)

stdin, stdout, stderr = client.exec_command('ps aux | grep "server/dist/index.js" | grep -v grep')
print('Running processes:')
print(stdout.read().decode().strip())

# Check log
stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
print('Socket log:')
print(stdout.read().decode().strip())

client.close()
