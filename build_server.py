import subprocess
import sys

cmd = [
    'ssh', '-i', r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea',
    '-o', 'StrictHostKeyChecking=no',
    'zju321@10.72.212.33',
    "bash -c 'cd /data/home/zju321/321/DHL/Scholar\\'s_Tea && npm run build' 2>&1 | tail -120"
]

result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
print(result.stdout)
if result.stderr:
    print('STDERR:', result.stderr, file=sys.stderr)
print('Return code:', result.returncode)
