import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

# Save PM2 config
stdin, stdout, stderr = client.exec_command('pm2 save')
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
print('OUT:', out)
if err:
    print('ERR:', err)

# Test socket.io polling endpoint
stdin, stdout, stderr = client.exec_command(
    'curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/socket.io/?EIO=4&transport=polling"',
    timeout=10
)
out = stdout.read().decode('utf-8', errors='replace').strip()
print('Socket.io polling status:', out)

client.close()
