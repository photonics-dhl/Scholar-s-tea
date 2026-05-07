import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Build socket server
stdin, stdout, stderr = client.exec_command(f'cd "{path}/server" && npm run build 2>&1')
build_out = stdout.read().decode().strip()
build_err = stderr.read().decode().strip()
print('Build stdout:', build_out)
print('Build stderr:', build_err)

# Kill old
client.exec_command('pkill -9 -f "server/dist/index.js"')
time.sleep(1)

# Start new
transport = client.get_transport()
channel = transport.open_session()
channel.exec_command(f'cd "{path}" && nohup node server/dist/index.js > ~/logs/socket.log 2>&1 &')
channel.close()

time.sleep(2)

# Check
stdin, stdout, stderr = client.exec_command('ps aux | grep server/dist/index.js | grep -v grep | grep -v bash')
print('Running:', stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
print('Log:', stdout.read().decode().strip())

client.close()
