import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

def run(cmd, timeout=30):
    print('>>>', cmd)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out[:2000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc)
    return rc

# Kill all processes on port 3002
run('fuser -k 3002/tcp 2>/dev/null || true')
run('pkill -f "next start" 2>/dev/null || true')

# Fix PostgreSQL permissions
PG_SOCKET = '/data/home/zju321/pgdata/run'
run("psql -h {} -U dbuser -d scholars_tea -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbuser;\"".format(PG_SOCKET))
run("psql -h {} -U dbuser -d scholars_tea -c \"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dbuser;\"".format(PG_SOCKET))
run("psql -h {} -U dbuser -d scholars_tea -c \"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbuser;\"".format(PG_SOCKET))

# Restart PM2
run('pm2 restart all')

# Verify
run('sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')

client.close()
