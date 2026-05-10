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

# List roles as dbuser
run("psql -h {} -U dbuser -d scholars_tea -c '\\du'".format(PG_SOCKET))

# List tables and their owners
run("psql -h {} -U dbuser -d scholars_tea -c 'SELECT tablename, tableowner FROM pg_tables WHERE schemaname = chr(112)||chr(117)||chr(98)||chr(108)||chr(105)||chr(99);'".format(PG_SOCKET))

client.close()
