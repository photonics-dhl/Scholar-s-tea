import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.72.212.33', username='zju321', key_filename='C:/Users/Mac/.ssh/id_ed25519_scholars_tea')

path = "/data/home/zju321/321/DHL/Scholar's_Tea"

# Test loading db module and checking env
node_script = """
console.log('Before importing db, DATABASE_URL:', process.env.DATABASE_URL);
import('./server/dist/db.js').then(() => {
  console.log('After importing db, DATABASE_URL:', process.env.DATABASE_URL);
}).catch(err => console.error(err));
"""

stdin, stdout, stderr = client.exec_command(f'cd "{path}" && node --input-type=module -e "{node_script}"')
print('Stdout:')
print(stdout.read().decode().strip())
print('Stderr:')
print(stderr.read().decode().strip())

client.close()
