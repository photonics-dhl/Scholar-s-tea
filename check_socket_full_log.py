import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Check full socket log including any warnings
stdin, stdout, stderr = client.exec_command('cat ~/logs/socket.log')
log = stdout.read().decode().strip()
print('Full log:')
print(log)
print('---')
print('Lines:', len(log.split("\n")))

# Test env loading manually with node
path = "/data/home/zju321/321/DHL/Scholar's_Tea"
stdin, stdout, stderr = client.exec_command(f'cd "{path}" && node -e "console.log(process.env.DATABASE_URL)"')
print('Node DATABASE_URL from cwd:', stdout.read().decode().strip())

client.close()
