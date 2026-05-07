import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Kill any existing
client.exec_command('pkill -9 -f "server/dist/index.js"')
time.sleep(1)

# Clear log
client.exec_command('> ~/logs/socket.log')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Start socket server
transport = client.get_transport()
channel = transport.open_session()
channel.exec_command(f'cd "{path}" && nohup node server/dist/index.js >> ~/logs/socket.log 2>&1 &')
channel.close()

time.sleep(3)

# Check process
stdin, stdout, stderr = client.exec_command('ps aux | grep "server/dist/index.js" | grep -v grep')
procs = stdout.read().decode().strip()
print('Processes:')
print(procs)

# Check log
stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
print('Log:')
print(stdout.read().decode().strip())

# Test if port 3001 is listening
stdin, stdout, stderr = client.exec_command('ss -tlnp | grep 3001 || netstat -tlnp 2>/dev/null | grep 3001 || echo PORT_NOT_LISTENING')
print('Port status:')
print(stdout.read().decode().strip())

client.close()
