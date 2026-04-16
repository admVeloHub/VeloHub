/**
 * Script de Diagnóstico de Sessões - VeloHub
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
(function loadVelohubFonteEnv(here) {
  const path = require('path');
  const fs = require('fs');
  let d = here;
  for (let i = 0; i < 14; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(__dirname);

 * 
 * Consulta MongoDB diretamente para diagnosticar problemas de status de sessão
 * 
 * Uso: node scripts/diagnose-sessions.js
 */

const { MongoClient } = require('mongodb');

// Tentar múltiplos caminhos para .env
const path = require('path');
const fs = require('fs');
const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../../../.env'),
  '.env'
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    break;
  }
}

// Aceitar URI como argumento da linha de comando ou variável de ambiente
const MONGODB_URI = process.argv[2] || process.env.MONGO_ENV || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI ou MONGO_ENV não configurado');
  console.error('   Uso: node scripts/diagnose-sessions.js [MONGO_URI]');
  console.error('   Ou configure MONGO_ENV ou MONGODB_URI no .env');
  process.exit(1);
}

async function diagnoseSessions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = client.db('console_conteudo');
    const sessionsCollection = db.collection('hub_sessions');
    
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    // Buscar todas as sessões
    const allSessions = await sessionsCollection.find({}).sort({ updatedAt: -1 }).toArray();
    
    console.log('='.repeat(80));
    console.log('📊 DIAGNÓSTICO DE SESSÕES - hub_sessions');
    console.log('='.repeat(80));
    console.log(`Total de sessões encontradas: ${allSessions.length}\n`);
    
    // Agrupar por userEmail e pegar a mais recente
    const sessionsByEmail = new Map();
    allSessions.forEach(session => {
      const email = session.userEmail?.toLowerCase();
      if (!email) return;
      
      const existing = sessionsByEmail.get(email);
      if (!existing) {
        sessionsByEmail.set(email, session);
      } else {
        const existingTime = existing.updatedAt instanceof Date 
          ? existing.updatedAt.getTime() 
          : existing.updatedAt || 0;
        const currentTime = session.updatedAt instanceof Date 
          ? session.updatedAt.getTime() 
          : session.updatedAt || 0;
        
        if (currentTime > existingTime) {
          sessionsByEmail.set(email, session);
        }
      }
    });
    
    const uniqueSessions = Array.from(sessionsByEmail.values());
    
    // Categorizar sessões
    const activeSessions = uniqueSessions.filter(s => s.isActive === true);
    const inactiveSessions = uniqueSessions.filter(s => s.isActive === false || !s.isActive);
    
    const onlineSessions = activeSessions.filter(s => s.chatStatus === 'online');
    const ausenteSessions = activeSessions.filter(s => s.chatStatus === 'ausente');
    const offlineSessions = activeSessions.filter(s => !s.chatStatus || s.chatStatus === 'offline');
    
    console.log('📈 RESUMO POR STATUS:');
    console.log('-'.repeat(80));
    console.log(`✅ Sessões ATIVAS (isActive=true): ${activeSessions.length}`);
    console.log(`   ├─ Online no chat: ${onlineSessions.length}`);
    console.log(`   ├─ Ausente no chat: ${ausenteSessions.length}`);
    console.log(`   └─ Offline no chat (sem chatStatus ou chatStatus=offline): ${offlineSessions.length}`);
    console.log(`❌ Sessões INATIVAS (isActive=false): ${inactiveSessions.length}\n`);
    
    // Verificar sessões com problemas potenciais
    console.log('🔍 ANÁLISE DE PROBLEMAS POTENCIAIS:');
    console.log('-'.repeat(80));
    
    // Sessões ativas mas sem chatStatus válido
    const activeWithoutStatus = activeSessions.filter(s => 
      !s.chatStatus || (s.chatStatus !== 'online' && s.chatStatus !== 'ausente')
    );
    if (activeWithoutStatus.length > 0) {
      console.log(`⚠️  Sessões ATIVAS sem chatStatus válido: ${activeWithoutStatus.length}`);
      activeWithoutStatus.forEach(s => {
        const updatedAt = s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt);
        const minutesAgo = Math.round((now - updatedAt) / 1000 / 60);
        console.log(`   - ${s.colaboradorNome || s.userEmail} (${s.userEmail})`);
        console.log(`     isActive: ${s.isActive}, chatStatus: ${s.chatStatus || 'null/undefined'}, último update: ${minutesAgo}min atrás`);
      });
      console.log('');
    }
    
    // Sessões ativas mas com updatedAt muito antigo (> 2 minutos)
    const staleActiveSessions = activeSessions.filter(s => {
      const updatedAt = s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt);
      return updatedAt < twoMinutesAgo;
    });
    if (staleActiveSessions.length > 0) {
      console.log(`⚠️  Sessões ATIVAS mas sem heartbeat recente (> 2min): ${staleActiveSessions.length}`);
      staleActiveSessions.forEach(s => {
        const updatedAt = s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt);
        const minutesAgo = Math.round((now - updatedAt) / 1000 / 60);
        console.log(`   - ${s.colaboradorNome || s.userEmail} (${s.userEmail})`);
        console.log(`     isActive: ${s.isActive}, chatStatus: ${s.chatStatus || 'null'}, último heartbeat: ${minutesAgo}min atrás`);
      });
      console.log('');
    }
    
    // Sessões com múltiplos registros para o mesmo email - análise detalhada
    const duplicateEmails = [];
    const emailCounts = new Map();
    const emailSessionsMap = new Map(); // email -> array de todas as sessões
    
    allSessions.forEach(s => {
      const email = s.userEmail?.toLowerCase();
      if (email) {
        emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
        
        if (!emailSessionsMap.has(email)) {
          emailSessionsMap.set(email, []);
        }
        emailSessionsMap.get(email).push(s);
      }
    });
    
    emailCounts.forEach((count, email) => {
      if (count > 1) {
        const sessions = emailSessionsMap.get(email);
        const activeCount = sessions.filter(s => s.isActive === true).length;
        const inactiveCount = sessions.filter(s => s.isActive === false || !s.isActive).length;
        
        duplicateEmails.push({ 
          email, 
          count, 
          activeCount, 
          inactiveCount,
          sessions 
        });
      }
    });
    
    if (duplicateEmails.length > 0) {
      console.log(`⚠️  Emails com múltiplas sessões: ${duplicateEmails.length}`);
      console.log('');
      
      // Ordenar por total de sessões (maior primeiro)
      duplicateEmails.sort((a, b) => b.count - a.count);
      
      duplicateEmails.forEach(({ email, count, activeCount, inactiveCount }) => {
        console.log(`📧 ${email}:`);
        console.log(`   Total de sessões: ${count}`);
        console.log(`   ✅ Ativas (isActive=true): ${activeCount}`);
        console.log(`   ❌ Encerradas (isActive=false): ${inactiveCount}`);
        console.log('');
      });
    }
    
    // Detalhes das sessões ativas
    console.log('📋 DETALHES DAS SESSÕES ATIVAS:');
    console.log('-'.repeat(80));
    activeSessions.forEach(s => {
      const updatedAt = s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt);
      const minutesAgo = Math.round((now - updatedAt) / 1000 / 60);
      const secondsAgo = Math.round((now - updatedAt) / 1000);
      
      console.log(`\n👤 ${s.colaboradorNome || s.userEmail}`);
      console.log(`   Email: ${s.userEmail}`);
      console.log(`   SessionId: ${s.sessionId}`);
      console.log(`   isActive: ${s.isActive}`);
      console.log(`   chatStatus: ${s.chatStatus || 'null/undefined'}`);
      console.log(`   Último update: ${minutesAgo}min ${secondsAgo % 60}s atrás (${updatedAt.toISOString()})`);
      if (s.loginTimestamp) {
        const loginTime = s.loginTimestamp instanceof Date ? s.loginTimestamp : new Date(s.loginTimestamp);
        const sessionAge = Math.round((now - loginTime) / 1000 / 60);
        console.log(`   Login há: ${sessionAge}min`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Diagnóstico concluído');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro ao diagnosticar sessões:', error);
  } finally {
    await client.close();
  }
}

diagnoseSessions();

