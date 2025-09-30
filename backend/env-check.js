// Verificação de variáveis de ambiente
// VERSION: v1.0.0 | DATE: 2025-01-27 | AUTHOR: Lucas Gravina - VeloHub Development Team

console.log('🔍 Verificando variáveis de ambiente...');

const required = [
  'PORT',
  'NODE_ENV'
];

const optional = [
  'MONGODB_URI',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CREDENTIALS'
];

console.log('\n📋 Variáveis obrigatórias:');
required.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value}`);
  } else {
    console.log(`❌ ${key}: NÃO DEFINIDA`);
  }
});

console.log('\n📋 Variáveis opcionais:');
optional.forEach(key => {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️ ${key}: não definida`);
  }
});

console.log('\n🌍 Ambiente completo:');
console.log(JSON.stringify(process.env, null, 2));

console.log('\n✅ Verificação concluída');
