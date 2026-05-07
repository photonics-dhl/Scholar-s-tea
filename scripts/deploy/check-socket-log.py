import paramiko

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"

stdin, stdout, stderr = client.exec_command(f'ls -la "{WORK_DIR}/server/dist/" 2>&1 | head -20')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('dist dir:', out)

stdin, stdout, stderr = client.exec_command(f'cat ~/logs/socket.log 2>/dev/null | tail -20')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('log:', out)

client.close()
