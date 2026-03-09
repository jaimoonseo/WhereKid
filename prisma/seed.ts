import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a child
  const child = await prisma.child.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '우리 아이',
      birthdate: new Date('2015-03-15'),
    },
  });

  console.log('✅ Created child:', child.name);

  // Create academies
  const academies = [
    { name: '방과후 줄넘기', category: '체육' },
    { name: '피아노', category: '음악' },
    { name: '영어', category: '언어' },
    { name: '방과후 체스', category: '두뇌' },
    { name: '미술', category: '예술' },
    { name: '수학교과', category: '교과' },
    { name: '방과후 댄스', category: '체육' },
    { name: '수학', category: '교과' },
    { name: '축구', category: '체육' },
    { name: '방과후 한자', category: '교과' },
  ];

  const createdAcademies = [];
  for (const academy of academies) {
    const created = await prisma.academy.create({
      data: {
        childId: child.id,
        name: academy.name,
        category: academy.category,
      },
    });
    createdAcademies.push(created);
    console.log('✅ Created academy:', created.name);
  }

  // Map academy names to IDs for easier schedule creation
  const academyMap = createdAcademies.reduce((map, academy) => {
    map[academy.name] = academy.id;
    return map;
  }, {} as Record<string, number>);

  // Create schedules based on PRD example
  const schedules = [
    // 월요일 (dayOfWeek: 1)
    { academyName: '방과후 줄넘기', dayOfWeek: 1, startTime: '12:55', endTime: '14:20' },
    { academyName: '피아노', dayOfWeek: 1, startTime: '15:00', endTime: '15:50' },
    { academyName: '영어', dayOfWeek: 1, startTime: '16:10', endTime: '17:37' },

    // 화요일 (dayOfWeek: 2)
    { academyName: '방과후 체스', dayOfWeek: 2, startTime: '13:40', endTime: '14:20' },
    { academyName: '미술', dayOfWeek: 2, startTime: '14:40', endTime: '16:10' },
    { academyName: '수학교과', dayOfWeek: 2, startTime: '19:10', endTime: '20:30' },

    // 수요일 (dayOfWeek: 3)
    { academyName: '방과후 댄스', dayOfWeek: 3, startTime: '13:40', endTime: '15:15' },
    { academyName: '피아노', dayOfWeek: 3, startTime: '15:30', endTime: '16:00' },
    { academyName: '영어', dayOfWeek: 3, startTime: '16:10', endTime: '17:37' },

    // 목요일 (dayOfWeek: 4)
    { academyName: '방과후 체스', dayOfWeek: 4, startTime: '13:40', endTime: '14:20' },
    { academyName: '수학', dayOfWeek: 4, startTime: '15:00', endTime: '16:50' },
    { academyName: '축구', dayOfWeek: 4, startTime: '17:00', endTime: '18:00' },

    // 금요일 (dayOfWeek: 5)
    { academyName: '방과후 한자', dayOfWeek: 5, startTime: '13:40', endTime: '14:20' },
    { academyName: '피아노', dayOfWeek: 5, startTime: '15:00', endTime: '15:50' },
    { academyName: '영어', dayOfWeek: 5, startTime: '16:10', endTime: '17:37' },
  ];

  for (const schedule of schedules) {
    await prisma.schedule.create({
      data: {
        academyId: academyMap[schedule.academyName],
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    });
    console.log(`✅ Created schedule: ${schedule.academyName} on day ${schedule.dayOfWeek}`);
  }

  // Create payment plans
  const paymentPlans = [
    {
      academyName: '피아노',
      amount: 150000,
      paymentDay: 5,
      cycle: 'MONTH' as const,
    },
    {
      academyName: '영어',
      amount: 200000,
      paymentDay: 10,
      cycle: 'MONTH' as const,
    },
  ];

  for (const plan of paymentPlans) {
    await prisma.paymentPlan.create({
      data: {
        academyId: academyMap[plan.academyName],
        amount: plan.amount,
        paymentDay: plan.paymentDay,
        cycle: plan.cycle,
      },
    });
    console.log(`✅ Created payment plan: ${plan.academyName} - ₩${plan.amount.toLocaleString()}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
