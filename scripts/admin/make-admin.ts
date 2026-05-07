/**
 * Make a user ADMIN by email
 *
 * Usage:
 *   npx tsx scripts/admin/make-admin.ts <email>
 *
 * Example:
 *   npx tsx scripts/admin/make-admin.ts admin@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx tsx scripts/admin/make-admin.ts <email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  })

  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  if (user.role === 'ADMIN') {
    console.log(`User ${email} is already ADMIN`)
    console.log(`  id: ${user.id}`)
    console.log(`  name: ${user.name ?? '(no name)'}`)
    process.exit(0)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log(`User promoted to ADMIN:`)
  console.log(`  id: ${updated.id}`)
  console.log(`  email: ${updated.email}`)
  console.log(`  name: ${updated.name ?? '(no name)'}`)
  console.log(`  role: ${updated.role}`)
  console.log('\nNote: The user needs to re-login for the new role to take effect in their session.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
