import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.knowledgeDocument.count();
  if (existing > 0) {
    console.log(`✓ KnowledgeDocument table already has ${existing} records, skipping.`);
    return;
  }

  await prisma.knowledgeDocument.createMany({
    data: [
      {
        title: 'Transformer 架构详解',
        content: 'Transformer 是一种基于自注意力机制的深度学习架构，由 Vaswani 等人在 2017 年提出。它彻底改变了自然语言处理领域，并成为大语言模型的基础。本文详细介绍多头注意力、位置编码、编码器-解码器结构等核心概念。',
        source: 'paper',
        discipline: 'computer-science',
        metadata: JSON.stringify({ url: 'https://arxiv.org/abs/1706.03762', authors: ['Ashish Vaswani', 'Noam Shazeer'] }),
      },
      {
        title: '量子计算入门指南',
        content: '量子计算利用量子力学原理进行计算，具有超越经典计算机的潜力。本文介绍量子比特、量子门和量子算法的基础知识，包括 Shor 算法和 Grover 算法的核心思想。',
        source: 'manual',
        discipline: 'physics',
        metadata: JSON.stringify({ url: 'https://quantum-computing.ibm.com/', level: 'beginner' }),
      },
      {
        title: '深度学习中的优化算法',
        content: '优化算法是训练神经网络的核心。本文对比 SGD、Adam、AdamW 等常用优化器，分析它们的收敛特性和适用场景，并介绍学习率调度和梯度裁剪等实用技巧。',
        source: 'post',
        discipline: 'computer-science',
        metadata: JSON.stringify({ tags: ['optimization', 'deep-learning'] }),
      },
      {
        title: '学术写作规范与技巧',
        content: '高质量的学术写作是科研成果传播的关键。本文介绍论文结构、引用规范、图表制作等学术写作的核心要点，帮助研究者提升论文质量和投稿成功率。',
        source: 'wiki',
        discipline: 'social',
        metadata: JSON.stringify({ category: 'academic-skills' }),
      },
      {
        title: '石墨烯在光电子学中的应用',
        content: '石墨烯因其独特的能带结构和优异的光电特性，在光电子学领域展现出巨大潜力。本文综述了石墨烯光电探测器、调制器和激光器的最新研究进展。',
        source: 'paper',
        discipline: 'physics',
        metadata: JSON.stringify({ url: 'https://www.nature.com/subjects/graphene', year: 2024 }),
      },
    ],
  });

  console.log('✓ Created 5 knowledge documents');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
