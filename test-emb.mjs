import { prisma } from './src/lib/db/prisma.ts';
const docs = await prisma.knowledgeDocument.findMany({
  where: { title: { contains: 'Metasurface' } },
  select: { id: true, title: true, embedding: true }
});
for (const d of docs) {
  const emb = d.embedding ? JSON.parse(d.embedding) : [];
  console.log(d.title, 'embedding length:', emb.length, 'first 3:', emb.slice(0, 3));
}
