import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Institutions
  const zju = await prisma.institution.create({
    data: {
      name: '浙江大学',
      logo: 'https://www.zju.edu.cn/favicon.ico',
      website: 'https://www.zju.edu.cn',
    },
  });
  console.log('✓ Created institution:', zju.name);

  const tsinghua = await prisma.institution.create({
    data: {
      name: '清华大学',
      logo: 'https://www.tsinghua.edu.cn/favicon.ico',
      website: 'https://www.tsinghua.edu.cn',
    },
  });
  console.log('✓ Created institution:', tsinghua.name);

  const pku = await prisma.institution.create({
    data: {
      name: '北京大学',
      logo: 'https://www.pku.edu.cn/favicon.ico',
      website: 'https://www.pku.edu.cn',
    },
  });
  console.log('✓ Created institution:', pku.name);

  // Create Colleges
  const csCollege = await prisma.college.create({
    data: {
      name: '计算机科学与技术学院',
      institutionId: zju.id,
    },
  });
  console.log('✓ Created college:', csCollege.name);

  const physicsCollege = await prisma.college.create({
    data: {
      name: '物理学院',
      institutionId: zju.id,
    },
  });
  console.log('✓ Created college:', physicsCollege.name);

  // Create Disciplines (学科层级)
  const cs = await prisma.discipline.create({
    data: {
      name: '计算机科学',
      slug: 'computer-science',
      description: '研究计算机科学与技术的各个方向，包括人工智能、软件工程、计算机系统等',
      level: 0,
    },
  });

  const physics = await prisma.discipline.create({
    data: {
      name: '物理学',
      slug: 'physics',
      description: '研究物质、能量、空间和时间等基本物理现象',
      level: 0,
    },
  });

  const math = await prisma.discipline.create({
    data: {
      name: '数学',
      slug: 'mathematics',
      description: '研究数量、结构、变化和空间等抽象概念的学科',
      level: 0,
    },
  });
  console.log('✓ Created disciplines: CS, Physics, Math');

  // Create sub-disciplines
  const ai = await prisma.discipline.create({
    data: {
      name: '人工智能',
      slug: 'artificial-intelligence',
      description: '研究使机器具有智能的学科',
      parentId: cs.id,
      level: 1,
    },
  });

  const ml = await prisma.discipline.create({
    data: {
      name: '机器学习',
      slug: 'machine-learning',
      description: '研究让计算机从数据中学习的学科',
      parentId: ai.id,
      level: 2,
    },
  });
  console.log('✓ Created sub-disciplines: AI, ML');

  // Create Users
  const user1 = await prisma.user.create({
    data: {
      email: 'professor@zju.edu.cn',
      name: '张教授',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
      bio: '浙江大学计算机学院教授，研究方向为人工智能与机器学习',
      role: 'ADMIN',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'researcher@zju.edu.cn',
      name: '李研究员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
      bio: '浙江大学博士后，研究方向为深度学习',
      role: 'USER',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'student@zju.edu.cn',
      name: '王同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
      bio: '浙江大学博士生，研究方向为自然语言处理',
      role: 'USER',
    },
  });
  console.log('✓ Created 3 users');

  // Create Research Groups
  const aiLab = await prisma.researchGroup.create({
    data: {
      name: '人工智能实验室',
      slug: 'ai-lab-zju',
      description: '浙江大学人工智能实验室，专注于机器学习、深度学习、计算机视觉等研究方向。实验室拥有先进的GPU计算资源和丰富的学术资源。',
      institutionId: zju.id,
      collegeId: csCollege.id,
      score: 95,
      verificationStatus: 'VERIFIED',
    },
  });

  const quantumLab = await prisma.researchGroup.create({
    data: {
      name: '量子计算研究中心',
      slug: 'quantum-computing-zju',
      description: '探索量子计算理论与应用，开展量子算法、量子模拟等前沿研究。',
      institutionId: zju.id,
      collegeId: physicsCollege.id,
      score: 88,
      verificationStatus: 'VERIFIED',
    },
  });

  const nlpLab = await prisma.researchGroup.create({
    data: {
      name: '自然语言处理实验室',
      slug: 'nlp-lab-tsinghua',
      description: '清华大学NLP实验室，研究大语言模型、机器翻译、文本生成等。',
      institutionId: tsinghua.id,
      score: 92,
      verificationStatus: 'VERIFIED',
    },
  });

  const mathLab = await prisma.researchGroup.create({
    data: {
      name: '应用数学研究所',
      slug: 'applied-math-pku',
      description: '北京大学应用数学研究所，研究数值计算、优化理论等。',
      institutionId: pku.id,
      score: 85,
      verificationStatus: 'PENDING',
    },
  });
  console.log('✓ Created 4 research groups');

  // Add members to groups
  await prisma.groupMember.createMany({
    data: [
      { userId: user1.id, groupId: aiLab.id, role: 'LEADER' },
      { userId: user2.id, groupId: aiLab.id, role: 'MEMBER' },
      { userId: user3.id, groupId: aiLab.id, role: 'MEMBER' },
      { userId: user1.id, groupId: quantumLab.id, role: 'ADVISOR' },
      { userId: user2.id, groupId: nlpLab.id, role: 'MEMBER' },
    ],
  });
  console.log('✓ Added group members');

  // Link groups to disciplines
  await prisma.groupDiscipline.createMany({
    data: [
      { groupId: aiLab.id, disciplineId: cs.id },
      { groupId: aiLab.id, disciplineId: ai.id },
      { groupId: aiLab.id, disciplineId: ml.id },
      { groupId: quantumLab.id, disciplineId: physics.id },
      { groupId: nlpLab.id, disciplineId: cs.id },
      { groupId: nlpLab.id, disciplineId: ai.id },
      { groupId: mathLab.id, disciplineId: math.id },
    ],
  });
  console.log('✓ Linked groups to disciplines');

  // Create Publications
  const pub1 = await prisma.publication.create({
    data: {
      title: 'Attention Is All You Need',
      abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...',
      authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar'],
      year: 2017,
      doi: '10.48550/arXiv.1706.03762',
      url: 'https://arxiv.org/abs/1706.03762',
      groupId: aiLab.id,
      citationCount: 50000,
    },
  });

  const pub2 = await prisma.publication.create({
    data: {
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      abstract: 'We introduce a new language representation model called BERT...',
      authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'],
      year: 2018,
      doi: '10.48550/arXiv.1810.04805',
      groupId: nlpLab.id,
      citationCount: 40000,
    },
  });

  const pub3 = await prisma.publication.create({
    data: {
      title: 'Quantum Supremacy Using a Programmable Superconducting Processor',
      abstract: 'We demonstrate quantum supremacy using a programmable superconducting processor...',
      authors: ['Frank Arute', 'Kunal Arya', 'Ryan Babbush'],
      year: 2019,
      doi: '10.1038/s41586-019-1666-5',
      groupId: quantumLab.id,
      citationCount: 3000,
    },
  });
  console.log('✓ Created 3 publications');

  // Create Posts
  const post1 = await prisma.post.create({
    data: {
      title: 'Transformer架构在图像识别中的应用',
      content: '最近在做Transformer在图像分类上的实验，发现效果很好。有没有同学也在做相关方向？可以交流一下。\n\n目前用的ViT模型，在ImageNet上pretrain，然后在下游任务上fine-tune。',
      authorId: user2.id,
      disciplineId: cs.id,
      viewCount: 234,
      topTenVotes: 15,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: '关于量子计算的几点思考',
      content: '量子计算近年来发展迅速，但距离实用还有很长的路要走。我认为以下问题是关键：\n\n1. 量子纠错\n2. 量子比特的可扩展性\n3. 低温环境的维持\n\n欢迎大家讨论。',
      authorId: user1.id,
      disciplineId: physics.id,
      viewCount: 456,
      topTenVotes: 28,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: '机器学习入门：如何入门深度学习？',
      content: '作为ML新手，分享一下我的学习路线：\n\n1. 吴恩达的机器学习课程\n2. 李飞飞的CS231n\n请问各位有什么推荐的学习资源吗？',
      authorId: user3.id,
      disciplineId: ml.id,
      viewCount: 789,
      topTenVotes: 42,
    },
  });
  console.log('✓ Created 3 posts');

  // Create Comments
  await prisma.comment.create({
    data: {
      content: '非常感谢分享！我也在做ViT相关的实验，可以加微信交流一下吗？',
      authorId: user3.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: '量子纠错确实是核心问题。最近看到一些关于surface code的进展很有意思。',
      authorId: user2.id,
      postId: post2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: '推荐看看Hugging Face的课程，很实用！',
      authorId: user1.id,
      postId: post3.id,
    },
  });
  console.log('✓ Created comments');

  // Create Tea Party Rooms
  const room1 = await prisma.teaPartyRoom.create({
    data: {
      name: 'AI研究交流室',
      description: '人工智能研究者交流群',
      isPublic: true,
      hostId: user1.id,
      maxParticipants: 50,
    },
  });

  const room2 = await prisma.teaPartyRoom.create({
    data: {
      name: '量子计算讨论组',
      description: '量子计算前沿进展讨论',
      isPublic: true,
      hostId: user1.id,
      maxParticipants: 30,
    },
  });
  console.log('✓ Created 2 tea party rooms');

  // Create Messages
  await prisma.message.create({
    data: {
      content: '大家好！欢迎来到AI研究交流室',
      type: 'TEXT',
      roomId: room1.id,
      userId: user1.id,
    },
  });

  await prisma.message.create({
    data: {
      content: '张教授好！想请教一下Transformer的问题',
      type: 'TEXT',
      roomId: room1.id,
      userId: user2.id,
    },
  });

  await prisma.message.create({
    data: {
      content: '欢迎欢迎！大家随便聊',
      type: 'TEXT',
      roomId: room1.id,
      userId: user1.id,
    },
  });
  console.log('✓ Created messages');

  // Create Top Questions
  await prisma.topQuestion.create({
    data: {
      title: '2024年AI领域最重要的突破是什么？',
      content: '回顾2024年，你觉得AI领域最重要的技术突破是什么？',
      month: '2026-04',
      voteCount: 156,
      status: 'ACTIVE',
    },
  });

  await prisma.topQuestion.create({
    data: {
      title: '如何平衡科研与生活？',
      content: '作为研究生，如何在高强度科研工作的同时保持生活质量？',
      month: '2026-04',
      voteCount: 98,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created top questions');

  // Create News
  await prisma.news.create({
    data: {
      title: 'AI Lab在国际顶会CVPR 2026发表多篇论文',
      content: '浙江大学AI实验室在CVPR 2026会议上发表了5篇论文，涵盖目标检测、图像分割等领域。',
      groupId: aiLab.id,
    },
  });

  await prisma.news.create({
    data: {
      title: '量子计算中心获批国家重点研发计划',
      content: '量子计算研究中心获批国家重点研发计划，项目经费5000万元。',
      groupId: quantumLab.id,
    },
  });
  console.log('✓ Created news');

  // Create Patents
  await prisma.patent.create({
    data: {
      title: '一种基于深度学习的图像增强方法',
      number: 'CN202610001234.5',
      status: 'pending',
      groupId: aiLab.id,
    },
  });
  console.log('✓ Created patents');

  console.log('\n🎉 Seed completed successfully!');
  console.log(`   - 3 institutions`);
  console.log(`   - 2 colleges`);
  console.log(`   - 5 disciplines`);
  console.log(`   - 3 users`);
  console.log(`   - 4 research groups`);
  console.log(`   - 3 publications`);
  console.log(`   - 3 posts`);
  console.log(`   - 2 tea party rooms`);
  console.log(`   - 2 top questions`);
  console.log(`   - 2 news items`);
  console.log(`   - 1 patent`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
