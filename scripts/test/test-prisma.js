const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const disciplines = await prisma.discipline.findMany();
    console.log("Disciplines count:", disciplines.length);
    const groups = await prisma.researchGroup.findMany();
    console.log("Groups count:", groups.length);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();