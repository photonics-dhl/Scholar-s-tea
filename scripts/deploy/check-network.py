import paramiko
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', errors='replace', closefd=False)

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

stdin, stdout, stderr = client.exec_command('cat "/data/home/zju321/321/DHL/Scholar\'s_Tea/.env" | grep -E "ANTHROPIC|AI_MODEL|BASE_URL|API_KEY|ZCHAT" | head -20')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('AI env vars:')
print(out)

stdin, stdout, stderr = client.exec_command('curl -s -o /dev/null -w "%{http_code}" -x http://127.0.0.1:7890 --connect-timeout 10 https://api.minimaxi.com/v1 2>&1')
out = stdout.read().decode('utf-8', errors='replace').strip()
print('MiniMax via proxy:', out)

client.close()
