export default function Home() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#2563eb', fontSize: '3rem', marginBottom: '1rem' }}>
        VeloHub
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
        Plataforma de Conhecimento
      </p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>
          ✅ Site Funcionando!
        </h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          Se você está vendo esta mensagem, o site está funcionando corretamente no Vercel!
        </p>
        <p style={{ color: '#666', lineHeight: '1.6', marginTop: '1rem' }}>
          <strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
