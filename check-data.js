const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ldgdptisetpxrzkntprd:g0eI2xbnwCPVwa7d@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function checkData() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('📊 데이터 현황:\n');
    
    const children = await client.query('SELECT COUNT(*) FROM "Child"');
    console.log('👶 아이:', children.rows[0].count, '명');
    
    const academies = await client.query('SELECT COUNT(*) FROM "Academy"');
    console.log('🏫 학원:', academies.rows[0].count, '개');
    
    const schedules = await client.query('SELECT COUNT(*) FROM "Schedule"');
    console.log('📅 스케줄:', schedules.rows[0].count, '개');
    
    const payments = await client.query('SELECT COUNT(*) FROM "PaymentPlan"');
    console.log('💰 납부 플랜:', payments.rows[0].count, '개');
    
    console.log('\n👶 아이 목록:');
    const childList = await client.query('SELECT id, name FROM "Child" ORDER BY id');
    childList.rows.forEach(c => console.log(`  ${c.id}. ${c.name}`));
    
    console.log('\n🏫 학원 목록:');
    const academyList = await client.query('SELECT id, name, category FROM "Academy" ORDER BY id LIMIT 10');
    academyList.rows.forEach(a => console.log(`  ${a.id}. ${a.name} (${a.category || '미분류'})`));
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

checkData();
