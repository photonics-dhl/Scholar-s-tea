import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Check socket server log
stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
print('Socket log:')
print(stdout.read().decode().strip())

client.close()
