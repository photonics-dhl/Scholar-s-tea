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
        print(out[:4000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc, '\n')
    return rc

# Latest error log (last 30 lines)
run('tail -n 30 /data/home/zju321/.pm2/logs/scholars-tea-error-0.log')

# Latest out log (last 10 lines)
run('tail -n 10 /data/home/zju321/.pm2/logs/scholars-tea-out-0.log')

client.close()
