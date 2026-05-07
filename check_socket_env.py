import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Check socket server process env
stdin, stdout, stderr = client.exec_command('cat /proc/$(ps aux | grep "server/dist/index.js" | grep -v grep | grep -v bash | awk "{print \\$2}" | head -1)/environ 2>/dev/null | tr "\\0" "\\n" | grep "DATABASE_URL" || echo NOT_FOUND')
print('Socket DATABASE_URL:', stdout.read().decode().strip())

# Also check if the URL was parsed correctly by checking all env vars
stdin, stdout, stderr = client.exec_command('cat /proc/$(ps aux | grep "server/dist/index.js" | grep -v grep | grep -v bash | awk "{print \\$2}" | head -1)/environ 2>/dev/null | tr "\\0" "\\n" | head -20')
print('All env vars:')
print(stdout.read().decode().strip())

client.close()
