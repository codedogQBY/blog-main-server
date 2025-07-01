import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAbout() {
  // 检查是否已有关于页面配置
  const existingAbout = await prisma.about.findFirst();
  if (existingAbout) {
    console.log('About configuration already exists');
    return;
  }

  // 创建默认的关于页面配置
  const about = await prisma.about.create({
    data: {
      heroAvatar: '/images/about-hero.png',
      heroSignature: '逸刻时光',
      introTitle: '关于逸刻时光',
      introContent: JSON.stringify([
        '这是博客，所以大致会从建设个博客说起。我一直希望有一块完全属于自己的空间，可以在这块空间里按照自己的想法，去不被限制情境和主题的存放我自己。用我的方式去分享、去展示自己。当然我是一个良好公民，分享的内容一定会在合规范之内。你会说那么多好用的便捷的平台，圈子、论坛...可是我并不是一个善于分享的人，是又那么期望这些是按照自己的方式和节奏去记录、去存放、去留下脚印。任何一个平台都有他们的规则，那么我就应该脱离这一切，去创造这一只属于我的天地。我的博客正是脱离这些平台的天地，她虽便使有无数的缺点，但她只属于我。',
        '当然也幸运于自己会一些端开发坚持一直保有兴趣，我的想法最后能够得偿所愿，如现在你所见。',
        '我好想在这里记录下我的一切，特别是那些还能久久保留在脑海里的记忆。或许在慢慢的时间流逝中他们终会被遗忘去，我想把他们记录成文字，留在这方天地间，不要说我矫情，偏执或者自恋，可这是我只属于我的哈略略～'
      ]),
      introLogo: '/images/yike-logo.png',
      status: 'active',
    },
  });

  // 创建标签
  const tags = [
    { content: '90后', position: 'left', sort: 1 },
    { content: 'UI设计师', position: 'left', sort: 2 },
    { content: '运动爱好者', position: 'left', sort: 3 },
    { content: '喜欢秋天', position: 'left', sort: 4 },
    { content: '独处也自在', position: 'left', sort: 5 },
    { content: '看书很慢', position: 'left', sort: 6 },
    { content: '香蕉好吃', position: 'left', sort: 7 },
    { content: 'i人', position: 'right', sort: 1 },
    { content: '开发爱好者', position: 'right', sort: 2 },
    { content: '摄影爱好者', position: 'right', sort: 3 },
    { content: '曾喜欢夏天', position: 'right', sort: 4 },
    { content: '没钱少旅游', position: 'right', sort: 5 },
    { content: '写字班丑', position: 'right', sort: 6 },
    { content: '母亲炒的茄子', position: 'right', sort: 7 },
  ];

  await prisma.aboutTag.createMany({
    data: tags.map(tag => ({ ...tag, aboutId: about.id })),
  });

  // 创建章节
  const section1 = await prisma.aboutSection.create({
    data: {
      title: '90后',
      content: JSON.stringify([
        '我是一个顽着太阳长大的90后，一个带着泥土味道的90后。',
        '我出生在江西，一个有山有水的地方，我觉得家乡非常漂亮，而且总是很安静。记事的时候村里是自行车的时代，父亲是一个浪漫的人，家里买的一辆自行车是女式自行车。母亲可以用父亲也可以用，到后来我学会了骑自行车，这辆自行车便成了我的专属。它很结实，我一直用到初中，它陪不定是初中中停车场里最年长的一辆自行车，可是它款式简单，还是那么与时代相融。',
        '轮胎是它最大的伤病，内外轮胎都换过几次，非常伤心的是在刚换完一次轮胎的那个星期，它在学校被偷了。初中我就开始住宿，每周回家一次。那天我伤心的从学校走回了家，花了好久好久才到家。记得那是往冬天的一个周五走回家，天气已经很冷，我发现原来走路是那么累是那么慢和。之前首次骑自行车回家，脚都冰凉的生活了冻疮。父亲还是一个情怀延期满足的人，在好些年都有电视机的时候，我们去别人家看电视，后来在一年的春天，爸妈用那辆女式自行车从镇里回了我过最大的彩色电视机，从此我也是个能在家看动画片的幸福孩子。后来村开启了彩托车时代，很快又进入到现在的新车时代。父亲或是一个实用主义者，父亲和母亲目前都不需要；还有我的父亲是一个文盲，没有上过学。父亲这些年后不再会需要一辆汽车，但父亲把家里院子建的非常结实，那里一直为我的车准备着。',
        '我喜欢老家，工作这几年，我常在五一、十一假期回家。听晨起的公鸡打鸣，听屋旁竹林的八哥叫叫，看隔壁邻居大种子树花开又是摘果时。听老乡们那继续的乡音，看母亲家做着家中日复一日的琐碎的事情。听，还处又有外乡人的叫卖声，可能也不会好听的跑去看看到底卖的是什么。对，我的屋旁有一片小小竹林，它们是一群八哥路上歇脚休息的地方，有时会觉得它们很吵，可常年在老家的母亲并没有赶走它们，村里已经没有其他它们栖息了。八哥似乎很喜欢与村为邻、与村相伴的生活，这让我想起小时候的记忆，我们一群孩子常常期盼能够自己捕得一只八哥，并幻会它说话，我还一直深信要自己造一只竹鸟笼，可能到现在我的鸟笼没有造成，八哥也没有被捉过...'
      ]),
      sort: 1,
      aboutId: about.id,
    },
  });

  // 为第一个章节创建图片
  await prisma.aboutImage.createMany({
    data: [
      {
        src: '/images/bamboo-forest.png',
        alt: '原乡的竹林',
        caption: '原乡的竹林',
        sort: 1,
        sectionId: section1.id,
      },
      {
        src: '/images/rooftop-garden.png',
        alt: '屋顶的菜地',
        caption: '屋顶的菜地',
        sort: 2,
        sectionId: section1.id,
      },
      {
        src: '/images/parents.png',
        alt: '父亲和母亲',
        caption: '父亲和母亲',
        sort: 3,
        sectionId: section1.id,
      },
    ],
  });

  const section2 = await prisma.aboutSection.create({
    data: {
      title: 'i人',
      content: JSON.stringify([
        '我的童年在家乡和他乡度过，我有无畏的自豪感。',
        '我是一个喜欢独处的人，并不是说非要宅在家里，我可以一个人去哪里都不会觉得无聊的人，只是偶尔跟朋友一起聚聚或走走，也会觉得很有意思。我没有那么强的即时分享欲，许多事情会在后续回忆中慢慢回味，慢慢分享。就如我拍的很多照片，都是在后面翻看时才会发到朋友圈中。我喜欢亲近自然，喜欢老家的山林，可以自己一个人在安静的田地上、山林间很久很久。也喜欢在母亲清理社区、洗刷晾晒的候听所有种碎的事情，家里的、菜地上的、邻里间的、村上的...',
        '我曾是留守儿童，母亲从我出生一直在家陪伴了我大半个不太记事的无忧无虑的童年，从9岁开始一直到初一我在姑姑家度过，那时母亲要同父亲一起外出工作，去姑姑家就需要离开熟悉的童年玩伴，熟悉的家乡和熟悉的校园生活，还有离开还从小陪伴过的母亲。姑姑家在一条长而陡峭的山坡路上，在这半山腰上仅有着零零落落的七八户人家，再向后延伸就是山林和田地还有一些养蜂的池塘，与下面村心连通的只有这一条蜿蜒而窄曲的山路，天然的地理环境，让我得自己的世界随在这山坡之上。当然我喜欢这自然，喜欢当于自己的环境中自己做世无光尘头的事情，姑姑门前有几颗山茶树，我时常坐在山茶树上做蓝天马空的想象，那颗山茶树还在，可我现在得从长高过。你知道春天山茶树会长一种胖胖的可以吃的叶子吗？这条山路上还有一个小我3岁的小孩，他成了我在姑姑家那几年唯一的玩伴，我们的玩更区域大多也在这山坡之上。除了上学需要走下那条山路，进入这个他乡的中心，不知道是我原先就喜欢独处，还是这里的环境让我更加喜欢独处一个人的世界，姑姑待我很好，可是姑姑的孩子都已长大，大哥和姐姐已经外出打工，二哥已经上高中，一个月才会回来一次，我会期朋他回来时会说故事给我听，还有期朋暑假快来，他会我去放牛、摸田螺、钓鱼、抓蝌蚪、抓了还有听他讲述这些故事...姑姑没有有动画片，没有电视剧，更没有录像带，错过很多那时超火的动漫和电视剧，以至于后来一直没有追剧看剧的习惯，直到毕业后我才看了火影，花了好几个月一口气从头尾完了火影。',
        '我敬重每一位长辈，敬重上级，敬重老师，可是内心不能和他们平等的交流，教师也好，长辈也好，我从小就这样，现在也还会避避这些自光或现实的对话，父母也是。我小候条又文法想让我抬头挺胸，这都使我越加内向的低头寡言。好在我现在还算健壮，185的身高在村里也是独有的存在，但这些都人指点的记忆都还在不经意间闯入思绪中，就如现在这一刻。'
      ]),
      sort: 2,
      aboutId: about.id,
    },
  });

  // 为第二个章节创建图片
  await prisma.aboutImage.createMany({
    data: [
      {
        src: '/images/sister.png',
        alt: '我和我的妹妹',
        caption: '我和我的妹妹',
        sort: 1,
        sectionId: section2.id,
      },
      {
        src: '/images/mountain-road.png',
        alt: '姑姑家下山的路',
        caption: '姑姑家下山的路',
        sort: 2,
        sectionId: section2.id,
      },
      {
        src: '/images/back-mountain.png',
        alt: '后山',
        caption: '后山',
        sort: 3,
        sectionId: section2.id,
      },
    ],
  });

  console.log('About configuration seeded successfully');
}

// 如果直接运行此文件，执行种子函数
if (require.main === module) {
  seedAbout()
    .then(() => {
      console.log('Seeding completed');
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.error('Seeding error:', error);
      return prisma.$disconnect();
    });
} 