const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.ldgdptisetpxrzkntprd:g0eI2xbnwCPVwa7d@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1'
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

async function testPrisma() {
  try {
    console.log('🔌 Prisma 연결 시도...\n');
    
    await prisma.$connect();
    console.log('✅ Prisma 연결 성공!\n');
    
    const count = await prisma.child.count();
    console.log('👶 아이 수:', count);
    
    const children = await prisma.child.findMany({
      include: {
        academies: true
      }
    });
    console.log('\n아이 정보:', JSON.stringify(children, null, 2));
    
  } catch (error) {
    console.error('❌ Prisma 오류:');
    console.error('Name:', error.name);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('\n전체 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
