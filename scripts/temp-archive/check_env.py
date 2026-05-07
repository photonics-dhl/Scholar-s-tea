import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Check server .env
stdin, stdout, stderr = client.exec_command(f'ls -la "{path}/server/.env" 2>/dev/null || echo NO_SERVER_ENV')
print('server/.env:', stdout.read().decode().strip())

# Check root .env for secrets
stdin, stdout, stderr = client.exec_command(f'grep -E "NEXTAUTH_SECRET|SOCKET_SECRET" "{path}/.env" 2>/dev/null || echo NO_SECRETS')
print('root secrets:', stdout.read().decode().strip())

# Check socket server process env
stdin, stdout, stderr = client.exec_command(f'ps aux | grep "server/dist/index.js" | grep -v grep | awk "{{print \\$2}}" | head -1')
pid = stdout.read().decode().strip()
print('socket PID:', pid)
if pid:
    stdin, stdout, stderr = client.exec_command(f'cat /proc/{pid}/environ 2>/dev/null | tr "\\0" "\\n" | grep -E "NEXTAUTH_SECRET|SOCKET_SECRET" || echo NO_PROC_ENV')
    print('proc env:', stdout.read().decode().strip())

client.close()
