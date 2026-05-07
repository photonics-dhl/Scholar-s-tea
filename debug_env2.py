import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Debug env loading with the exact same code
node_script = """
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let count = 0;
for (const line of envContent.split('\\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith(\"'\") && value.endsWith(\"'\"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = value;
    count++;
    if (key === 'DATABASE_URL') {
      console.log('SET DATABASE_URL =', value);
    }
  }
}
console.log('Total vars set:', count);
console.log('DATABASE_URL now:', process.env.DATABASE_URL);
"""

stdin, stdout, stderr = client.exec_command(f'cd "{path}" && node -e "{node_script}"')
print('Debug output:')
print(stdout.read().decode().strip())
print('Stderr:')
print(stderr.read().decode().strip())

client.close()
