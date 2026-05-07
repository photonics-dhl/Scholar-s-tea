import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Check DATABASE_URL in .env
stdin, stdout, stderr = client.exec_command(f'grep "DATABASE_URL" "{path}/.env"')
print('DATABASE_URL:', stdout.read().decode().strip())

client.close()
