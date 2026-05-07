import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Check the compiled env loading code in dist/index.js
stdin, stdout, stderr = client.exec_command(f'sed -n "1,40p" "{path}/server/dist/index.js"')
print('First 40 lines of dist/index.js:')
print(stdout.read().decode().strip())

client.close()
