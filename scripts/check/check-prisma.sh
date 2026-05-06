#!/bin/bash
echo "=== Checking Prisma engines ==="
ls -la /data/home/zju321/321/DHL/Scholar\'s_Tea/node_modules/.prisma/client/libquery* 2>&1
echo ""
echo "=== Testing Prisma query ==="
cd /data/home/zju321/321/DHL/Scholar\'s_Tea
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.discipline.findMany().then(r => { console.log('Disciplines:', r.length); p.\$disconnect(); }).catch(e => { console.error('Error:', e.message); p.\$disconnect(); });" 2>&1