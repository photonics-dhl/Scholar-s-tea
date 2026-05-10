import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

key = paramiko.Ed25519Key.from_private_key_file(r'C:\Users\Mac\.ssh\id_ed25519_scholars_tea')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', pkey=key, timeout=15)

SYMLINK = "/data/home/zju321/scholars-tea"

# Write test file via heredoc
js_content = r'''const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const count = await prisma.communityCitation.count();
    console.log('CommunityCitation count:', count);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
'''

cmd = f'''cat > {SYMLINK}/test-prisma.js << 'EOF'
{js_content}
EOF
'''
stdin, stdout, stderr = client.exec_command(cmd)
stdout.read()
stderr.read()

# Run it
stdin, stdout, stderr = client.exec_command(
    f'cd {SYMLINK} && node test-prisma.js',
    timeout=30
)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()
rc = stdout.channel.recv_exit_status()
print('OUT:', out[:2000])
if err:
    print('ERR:', err[:2000])
print('RC:', rc)

# Clean up
client.exec_command(f'rm -f {SYMLINK}/test-prisma.js')

client.close()
