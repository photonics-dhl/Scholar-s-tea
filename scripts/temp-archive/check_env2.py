import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Check all node processes
stdin, stdout, stderr = client.exec_command('ps aux | grep node | grep -v grep')
print('Node processes:')
print(stdout.read().decode().strip())

# Check environment of socket server child process
stdin, stdout, stderr = client.exec_command('for pid in $(ps aux | grep "server/dist/index.js" | grep -v grep | awk "{print \\$2}"); do echo "PID: $pid"; cat /proc/$pid/environ 2>/dev/null | tr "\\0" "\\n" | grep -E "NEXTAUTH_SECRET|SOCKET_SECRET|PORT|NODE_ENV" || echo "No env found"; done')
print('Socket env:')
print(stdout.read().decode().strip())

client.close()
