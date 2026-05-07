import paramiko
import json
import sys

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', errors='replace', closefd=False)

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

payload = json.dumps({'messages': [{'role': 'user', 'content': 'hello'}]})
cmd = f"curl -s -X POST http://localhost:3002/api/v1/ai/chat -H 'Content-Type: application/json' -d '{payload}' -w '\\nHTTP_CODE:%{{http_code}}'"
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
out = stdout.read().decode('utf-8', errors='replace').strip()
print('RESPONSE:')
print(out)

client.close()
