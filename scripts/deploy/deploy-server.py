import paramiko
import time

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key)

WORK_DIR = "/data/home/zju321/321/DHL/Scholar's_Tea"

def run(cmd, timeout=60):
    full_cmd = f'cd "{WORK_DIR}" && {cmd}'
    print(f'>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    try:
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        rc = stdout.channel.recv_exit_status()
        if out:
            try:
                print(out)
            except UnicodeEncodeError:
                print('[unicode output]')
        if err:
            try:
                print('ERR:', err)
            except UnicodeEncodeError:
                print('ERR: [unicode output]')
        print(f'RC: {rc}')
        return rc, out, err
    except Exception as e:
        print(f'Timeout/exception: {e}')
        return -1, '', str(e)

# Build
run('npm run build', timeout=300)

# Kill existing processes
run('pkill -f "next-server" 2>/dev/null || true')
run('pkill -f "server/dist/index.js" 2>/dev/null || true')
time.sleep(3)

# Start services (short timeout since they run in background)
run('nohup npm start -- -p 3002 > ~/logs/nextjs.log 2>&1 &', timeout=5)
time.sleep(2)
run('nohup node server/dist/index.js > ~/logs/socket.log 2>&1 &', timeout=5)
time.sleep(3)

# Verify
run('ps aux | grep -E "(next-server|server/dist)" | grep -v grep')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002')
run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001')

print('=== Deploy Complete ===')
client.close()
