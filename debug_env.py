import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Debug env loading with node script
node_script = """
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
console.log('Reading:', envPath);
const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('DATABASE_URL')) {
    console.log('Line', i+1, ':', JSON.stringify(lines[i]));
    console.log('Trimmed:', JSON.stringify(line));
  }
}
"""

stdin, stdout, stderr = client.exec_command(f'cd "{path}" && node -e "{node_script}"')
print('Debug output:')
print(stdout.read().decode().strip())
print('Stderr:')
print(stderr.read().decode().strip())

client.close()
