import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

PG_SOCKET = '/data/home/zju321/pgdata/run'

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

# Try connecting as postgres user without password (trust/peer auth)
run('psql -h {} -U postgres -d scholars_tea -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbuser;"'.format(PG_SOCKET))
run('psql -h {} -U postgres -d scholars_tea -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dbuser;"'.format(PG_SOCKET))
run('psql -h {} -U postgres -d scholars_tea -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dbuser;"'.format(PG_SOCKET))

# Also try sudo
run('sudo -u postgres psql -d scholars_tea -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dbuser;" 2>/dev/null || echo sudo failed')

client.close()
