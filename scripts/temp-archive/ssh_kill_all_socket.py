import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

# Kill ALL socket server processes
stdin, stdout, stderr = client.exec_command('pkill -9 -f "server/dist/index.js"')
print('Kill output:', stdout.read().decode().strip())
print('Kill stderr:', stderr.read().decode().strip())

time.sleep(1)

# Verify none left
stdin, stdout, stderr = client.exec_command('ps aux | grep server/dist/index.js | grep -v grep || echo NONE')
print('After kill:', stdout.read().decode().strip())

# Also check port 3001
stdin, stdout, stderr = client.exec_command('lsof -i :3001 2>/dev/null || netstat -tlnp 2>/dev/null | grep 3001 || echo PORT_FREE')
print('Port 3001:', stdout.read().decode().strip())

client.close()
