export type Language = 'zh' | 'en'

export interface TranslationDict {
  nav: {
    disciplines: string
    groups: string
    workshop: string
    teaParty: string
    top10: string
    login: string
    logout: string
    profile: string
    search: string
    knowledgeBase: string
    researchMemory: string
  }
  home: {
    heroBadge: string
    title: string
    subtitle: string
    description: string
    aiAssistantHighlight: string
    descriptionSuffix: string
    searchPlaceholder: string
    searchButton: string
    tryAI: string
    exploreDisciplines: string
    loginCTA: string
    welcomeBack: string
    stats: {
      groups: string
      publications: string
      posts: string
      users: string
    }
    feeds: {
      latestPosts: string
      popularPapers: string
      activeGroups: string
    }
    quickActions: {
      title: string
      coreModules: string
      aiTools: string
      personalCenter: string
      enter: string
      aiImage: string
      aiImageDesc: string
    }
    contributors: {
      title: string
      subtitle: (count: number) => string
    }
    top10: {
      title: string
      description: string
      viewRanking: string
    }
    footer: {
      brand: string
      tagline: string
    }
    feed: {
      recommend: string
      hot: string
      following: string
      papers: string
      empty: string
      loadMore: string
    }
    sidebar: {
      aiToolbox: string
      peerReview: string
      paperGen: string
      paperHelper: string
      grantApp: string
      imageGen: string
      activeGroups: string
      hotDisciplines: string
      joinCommunity: string
      loginPrompt: string
      loginBtn: string
      signupBtn: string
      myGroups: string
      myProfile: string
      viewAll: string
    }
  }
  disciplines: {
    title: string
    description: string
    groups: string
    posts: string
    groupUnit: string
    postUnit: string
    empty: string
    loading: string
  }
  groups: {
    title: string
    description: string
    searchPlaceholder: string
    createGroup: string
    filter: string
    sort: string
    members: string
    publications: string
    news: string
    patents: string
    empty: string
    loading: string
    loadMore: string
    of: string
  }
  teaParty: {
    title: string
    description: string
    searchPlaceholder: string
    createRoom: string
    public: string
    private: string
    participants: string
    messages: string
    empty: string
    loading: string
  }
  topQuestions: {
    title: string
    description: string
    year: string
    month: string
    votes: string
    rank: string
    empty: string
    loading: string
  }
  knowledge: {
    title: string
    description: string
    searchPlaceholder: string
    filter: string
    sort: string
    disciplines: string
    sources: string
    tags: string
    viewMode: string
    gridView: string
    listView: string
    empty: string
    loading: string
  }
  settings: {
    title: string
    tabs: {
      profile: string
      account: string
      notifications: string
      privacy: string
      knowledgeBase: string
    }
    labels: {
      name: string
      email: string
      bio: string
      avatar: string
      save: string
      saving: string
      saved: string
      cancel: string
      edit: string
      delete: string
    }
  }
  profile: {
    title: string
    stats: {
      posts: string
      comments: string
      groups: string
      knowledgeBase: string
    }
    editProfile: string
    myGroups: string
    myPosts: string
    loading: string
  }
  workshop: {
    title: string
    placeholder: string
    send: string
    stop: string
    thinking: string
    error: string
    retry: string
    clear: string
    newChat: string
    history: string
    noHistory: string
    inputPlaceholder: string
    imageGen: string
    imageGenDesc: string
    loading: string
  }
  common: {
    langZh: string
    langEn: string
    switchLang: string
    loading: string
    empty: string
    error: string
    retry: string
    loadMore: string
    confirm: string
    cancel: string
    save: string
    delete: string
    edit: string
    create: string
    submit: string
    search: string
    filter: string
    sort: string
    back: string
    next: string
    close: string
    open: string
    success: string
    failed: string
    warning: string
    noData: string
    noResult: string
    copied: string
    copyFailed: string
    welcome: string
  }
}

export const translations: Record<Language, TranslationDict> = {
  zh: {
    nav: {
      disciplines: '学科',
      groups: '课题组',
      workshop: 'AI Workshop',
      teaParty: '茶话会',
      top10: 'TOP10',
      login: '登录',
      logout: '退出登录',
      profile: '个人设置',
      search: '搜索',
      knowledgeBase: '知识库管理',
      researchMemory: '研究记忆管理',
    },
    home: {
      heroBadge: '高校学术交流社区 · AI 赋能研究',
      title: '学者茶话会',
      subtitle: "Scholar's Tea",
      description: '连接优秀研究者，分享学术见解，发现前沿研究。',
      aiAssistantHighlight: 'AI 助手',
      descriptionSuffix: '随时为你提供论文分析、基金申请、文献综述等学术支持。',
      searchPlaceholder: '搜索课题组、学科、论文...',
      searchButton: '搜索',
      tryAI: '试试 AI 助手',
      exploreDisciplines: '探索学科',
      loginCTA: '登录 / 注册',
      welcomeBack: '欢迎回来',
      stats: {
        groups: '课题组',
        publications: '发表论文',
        posts: '讨论帖子',
        users: '注册用户',
      },
      feeds: {
        latestPosts: '最新讨论',
        popularPapers: '热门论文',
        activeGroups: '活跃课题组',
      },
      quickActions: {
        title: '快捷入口',
        coreModules: '核心模块',
        aiTools: 'AI 工具',
        personalCenter: '个人中心',
        enter: '进入',
        aiImage: 'AI 绘图',
        aiImageDesc: '智能图像生成',
      },
      contributors: {
        title: '活跃学者',
        subtitle: (count: number) => `加入 ${count}+ 研究者的学术交流社区`,
      },
      top10: {
        title: 'TOP10 问题',
        description: '每月最受欢迎的研究讨论，看看社区最热门的话题',
        viewRanking: '查看排行',
      },
      footer: {
        brand: "Scholar's Tea 学者茶话会",
        tagline: '高校学术交流社区 · 连接学者，创造价值',
      },
      feed: {
        recommend: '推荐',
        hot: '热榜',
        following: '关注',
        papers: '论文',
        empty: '暂无内容',
        loadMore: '加载更多',
      },
      sidebar: {
        aiToolbox: 'AI 工具箱',
        peerReview: '同行评审',
        paperGen: '论文生成',
        paperHelper: '论文分析',
        grantApp: '基金申请',
        imageGen: 'AI 绘图',
        activeGroups: '活跃课题组',
        hotDisciplines: '热门学科',
        joinCommunity: '加入社区',
        loginPrompt: '登录以使用全部功能',
        loginBtn: '登录',
        signupBtn: '注册',
        myGroups: '我的课题组',
        myProfile: '个人设置',
        viewAll: '查看全部',
      },
    },
    disciplines: {
      title: '学科',
      description: '探索学术领域，发现研究方向',
      groups: '课题组',
      posts: '帖子',
      groupUnit: '个',
      postUnit: '篇',
      empty: '暂无学科数据',
      loading: '加载中...',
    },
    groups: {
      title: '课题组',
      description: '发现并加入优秀的研究团队',
      searchPlaceholder: '搜索课题组...',
      createGroup: '创建课题组',
      filter: '筛选',
      sort: '排序',
      members: '成员',
      publications: '论文',
      news: '动态',
      patents: '专利',
      empty: '暂无课题组',
      loading: '加载中...',
      loadMore: '加载更多',
      of: '共',
    },
    teaParty: {
      title: '茶话会',
      description: '实时学术交流，即时讨论研究话题',
      searchPlaceholder: '搜索聊天室...',
      createRoom: '创建房间',
      public: '公开',
      private: '私密',
      participants: '参与者',
      messages: '消息',
      empty: '暂无聊天室',
      loading: '加载中...',
    },
    topQuestions: {
      title: 'TOP10 问题',
      description: '每月最受欢迎的研究讨论，看看社区最热门的话题',
      year: '年',
      month: '月',
      votes: '票',
      rank: '排名',
      empty: '本月暂无投票',
      loading: '加载中...',
    },
    knowledge: {
      title: '知识库',
      description: '学术文档与知识管理',
      searchPlaceholder: '搜索文档...',
      filter: '筛选',
      sort: '排序',
      disciplines: '学科',
      sources: '来源',
      tags: '标签',
      viewMode: '视图',
      gridView: '网格',
      listView: '列表',
      empty: '暂无文档',
      loading: '加载中...',
    },
    settings: {
      title: '个人设置',
      tabs: {
        profile: '个人资料',
        account: '账号',
        notifications: '通知',
        privacy: '隐私',
        knowledgeBase: '知识库',
      },
      labels: {
        name: '姓名',
        email: '邮箱',
        bio: '简介',
        avatar: '头像',
        save: '保存',
        saving: '保存中...',
        saved: '已保存',
        cancel: '取消',
        edit: '编辑',
        delete: '删除',
      },
    },
    profile: {
      title: '个人主页',
      stats: {
        posts: '帖子',
        comments: '评论',
        groups: '课题组',
        knowledgeBase: '知识库',
      },
      editProfile: '编辑资料',
      myGroups: '我的课题组',
      myPosts: '我的帖子',
      loading: '加载中...',
    },
    workshop: {
      title: 'AI Workshop',
      placeholder: '输入你的问题...',
      send: '发送',
      stop: '停止',
      thinking: 'AI 思考中...',
      error: '出错了',
      retry: '重试',
      clear: '清空对话',
      newChat: '新对话',
      history: '历史对话',
      noHistory: '暂无历史对话',
      inputPlaceholder: '输入消息...',
      imageGen: 'AI 绘图',
      imageGenDesc: '输入描述，AI 为你生成图片',
      loading: '加载中...',
    },
    common: {
      langZh: '中文',
      langEn: 'English',
      switchLang: '切换语言',
      loading: '加载中...',
      empty: '暂无数据',
      error: '出错了',
      retry: '重试',
      loadMore: '加载更多',
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      submit: '提交',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      back: '返回',
      next: '下一步',
      close: '关闭',
      open: '打开',
      success: '成功',
      failed: '失败',
      warning: '警告',
      noData: '暂无数据',
      noResult: '未找到结果',
      copied: '已复制',
      copyFailed: '复制失败',
      welcome: '欢迎',
    },
  },
  en: {
    nav: {
      disciplines: 'Disciplines',
      groups: 'Groups',
      workshop: 'AI Workshop',
      teaParty: 'Tea Party',
      top10: 'TOP10',
      login: 'Sign In',
      logout: 'Sign Out',
      profile: 'Profile',
      search: 'Search',
      knowledgeBase: 'Knowledge Base',
      researchMemory: 'Research Memory',
    },
    home: {
      heroBadge: 'Academic Community · AI-Powered Research',
      title: "Scholar's Tea",
      subtitle: '学者茶话会',
      description: 'Connect with researchers, share insights, and discover cutting-edge work.',
      aiAssistantHighlight: 'AI Assistant',
      descriptionSuffix: 'is here to help with paper analysis, grant applications, literature reviews, and more.',
      searchPlaceholder: 'Search groups, disciplines, papers...',
      searchButton: 'Search',
      tryAI: 'Try AI Assistant',
      exploreDisciplines: 'Explore Disciplines',
      loginCTA: 'Sign In / Sign Up',
      welcomeBack: 'Welcome back',
      stats: {
        groups: 'Groups',
        publications: 'Publications',
        posts: 'Discussions',
        users: 'Members',
      },
      feeds: {
        latestPosts: 'Latest Discussions',
        popularPapers: 'Popular Papers',
        activeGroups: 'Active Groups',
      },
      quickActions: {
        title: 'Quick Access',
        coreModules: 'Core Modules',
        aiTools: 'AI Tools',
        personalCenter: 'Personal',
        enter: 'Enter',
        aiImage: 'AI Image Gen',
        aiImageDesc: 'Smart image generation',
      },
      contributors: {
        title: 'Active Scholars',
        subtitle: (count: number) => `Join ${count}+ researchers in our academic community`,
      },
      top10: {
        title: 'TOP10 Questions',
        description: 'Most popular research discussions this month',
        viewRanking: 'View Ranking',
      },
      footer: {
        brand: "Scholar's Tea",
        tagline: 'Academic Community · Connecting Scholars, Creating Value',
      },
      feed: {
        recommend: 'Recommend',
        hot: 'Hot',
        following: 'Following',
        papers: 'Papers',
        empty: 'No content yet',
        loadMore: 'Load more',
      },
      sidebar: {
        aiToolbox: 'AI Toolbox',
        peerReview: 'Peer Review',
        paperGen: 'Paper Gen',
        paperHelper: 'Paper Helper',
        grantApp: 'Grant App',
        imageGen: 'AI Image Gen',
        activeGroups: 'Active Groups',
        hotDisciplines: 'Hot Disciplines',
        joinCommunity: 'Join Community',
        loginPrompt: 'Sign in for full access',
        loginBtn: 'Sign In',
        signupBtn: 'Sign Up',
        myGroups: 'My Groups',
        myProfile: 'Profile',
        viewAll: 'View All',
      },
    },
    disciplines: {
      title: 'Disciplines',
      description: 'Explore academic fields and research directions',
      groups: 'Groups',
      posts: 'Posts',
      groupUnit: '',
      postUnit: '',
      empty: 'No disciplines yet',
      loading: 'Loading...',
    },
    groups: {
      title: 'Groups',
      description: 'Discover and join excellent research teams',
      searchPlaceholder: 'Search groups...',
      createGroup: 'Create Group',
      filter: 'Filter',
      sort: 'Sort',
      members: 'Members',
      publications: 'Publications',
      news: 'News',
      patents: 'Patents',
      empty: 'No groups yet',
      loading: 'Loading...',
      loadMore: 'Load more',
      of: '',
    },
    teaParty: {
      title: 'Tea Party',
      description: 'Real-time academic discussions',
      searchPlaceholder: 'Search rooms...',
      createRoom: 'Create Room',
      public: 'Public',
      private: 'Private',
      participants: 'Participants',
      messages: 'Messages',
      empty: 'No rooms yet',
      loading: 'Loading...',
    },
    topQuestions: {
      title: 'TOP10 Questions',
      description: 'Most popular research discussions this month',
      year: '',
      month: '',
      votes: 'votes',
      rank: 'Rank',
      empty: 'No votes this month',
      loading: 'Loading...',
    },
    knowledge: {
      title: 'Knowledge Base',
      description: 'Academic documents and knowledge management',
      searchPlaceholder: 'Search documents...',
      filter: 'Filter',
      sort: 'Sort',
      disciplines: 'Disciplines',
      sources: 'Sources',
      tags: 'Tags',
      viewMode: 'View',
      gridView: 'Grid',
      listView: 'List',
      empty: 'No documents yet',
      loading: 'Loading...',
    },
    settings: {
      title: 'Settings',
      tabs: {
        profile: 'Profile',
        account: 'Account',
        notifications: 'Notifications',
        privacy: 'Privacy',
        knowledgeBase: 'Knowledge Base',
      },
      labels: {
        name: 'Name',
        email: 'Email',
        bio: 'Bio',
        avatar: 'Avatar',
        save: 'Save',
        saving: 'Saving...',
        saved: 'Saved',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
      },
    },
    profile: {
      title: 'Profile',
      stats: {
        posts: 'Posts',
        comments: 'Comments',
        groups: 'Groups',
        knowledgeBase: 'Knowledge Base',
      },
      editProfile: 'Edit Profile',
      myGroups: 'My Groups',
      myPosts: 'My Posts',
      loading: 'Loading...',
    },
    workshop: {
      title: 'AI Workshop',
      placeholder: 'Enter your question...',
      send: 'Send',
      stop: 'Stop',
      thinking: 'AI is thinking...',
      error: 'Error occurred',
      retry: 'Retry',
      clear: 'Clear chat',
      newChat: 'New chat',
      history: 'Chat history',
      noHistory: 'No chat history',
      inputPlaceholder: 'Type a message...',
      imageGen: 'AI Image Gen',
      imageGenDesc: 'Describe an image for AI to generate',
      loading: 'Loading...',
    },
    common: {
      langZh: '中文',
      langEn: 'English',
      switchLang: 'Switch Language',
      loading: 'Loading...',
      empty: 'No data',
      error: 'Error occurred',
      retry: 'Retry',
      loadMore: 'Load more',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      open: 'Open',
      success: 'Success',
      failed: 'Failed',
      warning: 'Warning',
      noData: 'No data',
      noResult: 'No results found',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      welcome: 'Welcome',
    },
  },
}
