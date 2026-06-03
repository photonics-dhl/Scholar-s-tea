import { searchKnowledgeBase } from './src/lib/ai/rag-service.ts';
const result = await searchKnowledgeBase('metasurface', { limit: 3 });
console.log('Results:', result.results.length);
console.log('Error:', result.error);
result.results.forEach(r => console.log(r.title, r.similarity));
