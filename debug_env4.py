import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Write debug script to file first
node_script = """
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key === 'DATABASE_URL') {
      console.log('FOUND DATABASE_URL');
      console.log('key:', JSON.stringify(key));
      console.log('value:', JSON.stringify(value));
      console.log('startsWithQuote:', value.startsWith('"'));
      console.log('endsWithQuote:', value.endsWith('"'));
      console.log('envBefore:', process.env[key]);
    }
    if (!process.env[key]) {
      process.env[key] = value;
      if (key === 'DATABASE_URL') {
        console.log('SET DATABASE_URL');
        console.log('envAfter:', JSON.stringify(process.env.DATABASE_URL));
      }
    }
  }
  console.log('Loaded .env from', envPath);
} catch (err) {
  console.warn('Failed to load .env from', envPath, ':', err.message);
}
console.log('Final DATABASE_URL:', JSON.stringify(process.env.DATABASE_URL));
"""

# Write to temp file on server
stdin, stdout, stderr = client.exec_command(f'cat > /tmp/debug_env.js << "EOFSCRIPT"\n{node_script}\nEOFSCRIPT')
print('Write status:', stdout.read().decode().strip(), stderr.read().decode().strip())

# Run it
stdin, stdout, stderr = client.exec_command(f'cd "{path}" && node /tmp/debug_env.js')
print('Debug output:')
print(stdout.read().decode().strip())
print('Stderr:')
print(stderr.read().decode().strip())

client.close()
