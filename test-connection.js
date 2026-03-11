const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ldgdptisetpxrzkntprd:g0eI2xbnwCPVwa7d@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 연결 시도 중...');
    await client.connect();
    console.log('✅ 연결 성공!');
    
    console.log('\n📊 데이터베이스 정보:');
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('Version:', result.rows[0].version);
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    
    console.log('\n📋 테이블 목록:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    if (tables.rows.length === 0) {
      console.log('⚠️  테이블이 없습니다. supabase-setup.sql을 실행해야 합니다.');
    } else {
      tables.rows.forEach(row => console.log('  -', row.table_name));
    }
    
  } catch (error) {
    console.error('❌ 연결 실패:');
    console.error('Error Name:', error.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
    if (error.hint) console.error('Hint:', error.hint);
  } finally {
    await client.end();
  }
}

testConnection();
