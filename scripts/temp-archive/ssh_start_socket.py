import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Start socket server using transport to avoid blocking on nohup
transport = client.get_transport()
channel = transport.open_session()
channel.exec_command(f'cd "{path}" && nohup node server/dist/index.js > ~/logs/socket.log 2>&1 &')
channel.close()

time.sleep(2)

stdin, stdout, stderr = client.exec_command('ps aux | grep server/dist/index.js | grep -v grep')
print('Running:', stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
print('Log:', stdout.read().decode().strip())

client.close()
