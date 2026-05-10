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
        print(out[:3000])
    if err:
        print('ERR:', err[:2000])
    print('RC:', rc, '\n')
    return rc

# Check for manual npm start processes
run('ps aux | grep "next start" | grep -v grep')
run('ps aux | grep "npm start" | grep -v grep')

# Check port 3002
run('netstat -tlnp 2>/dev/null | grep 3002 || lsof -i :3002 2>/dev/null || echo "No netstat/lsof"')

# Check the manual log file
run('tail -n 20 ~/logs/nextjs.log 2>/dev/null || echo "No manual log"')

client.close()
