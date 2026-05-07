import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Get raw .env content around DATABASE_URL
stdin, stdout, stderr = client.exec_command(f'grep -n -A1 -B1 "DATABASE_URL" "{path}/.env"')
print('DATABASE_URL in .env:')
print(repr(stdout.read().decode().strip()))

# Get all env vars from socket process
stdin, stdout, stderr = client.exec_command('cat /proc/$(ps aux | grep "server/dist/index.js" | grep -v grep | grep -v bash | awk "{print \\$2}" | head -1)/environ 2>/dev/null | tr "\\0" "\\n"')
env_vars = stdout.read().decode().strip()
for line in env_vars.split("\n"):
    if "DATABASE" in line.upper() or "URL" in line.upper():
        print("FOUND:", line)

client.close()
