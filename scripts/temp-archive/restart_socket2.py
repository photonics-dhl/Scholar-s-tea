import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Kill old socket server
stdin, stdout, stderr = client.exec_command(f'pkill -9 -f "server/dist/index.js"')
print('Kill stdout:', stdout.read().decode().strip())
print('Kill stderr:', stderr.read().decode().strip())

# Check remaining processes
stdin, stdout, stderr = client.exec_command('ps aux | grep "server/dist/index.js" | grep -v grep || echo NONE')
print('After kill:', stdout.read().decode().strip())

client.close()
