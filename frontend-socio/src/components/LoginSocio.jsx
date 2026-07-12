import { useState } from 'react';
import { login } from '../utils/authService';

export function LoginSocio({ irARegistro, onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      let datosSocio = await login(email, password);
    

      // 4. Le avisamos a App.jsx que todo salió bien y le pasamos los datos
      onLoginExitoso(datosSocio);

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(err.message || 'Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#009ee3', marginBottom: '1.5rem' }}>
        Ingreso de Socios
      </h2>
      
      <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.9rem', color: '#555' }}>Email</label>
          <input 
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={estilos.input} placeholder="tu@email.com"
          />
        </div>
        
        <div>
          <label style={{ fontSize: '0.9rem', color: '#555' }}>Contraseña</label>
          <input 
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            style={estilos.input} placeholder="********"
          />
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem', margin: '0' }}>{error}</p>}

        <button type="submit" disabled={cargando} style={estilos.botonPrimario}>
          {cargando ? 'Iniciando...' : 'Ingresar al Club'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
        <p>¿Es tu primera vez en la app?</p>
        <button onClick={irARegistro} style={estilos.botonSecundario}>
          Configurar mi cuenta
        </button>
      </div>
    </div>
  );
}

const estilos = {
  input: {
    width: '100%', padding: '0.8rem', marginTop: '0.3rem', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'
  },
  botonPrimario: {
    width: '100%', padding: '1rem', backgroundColor: '#009ee3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem'
  },
  botonSecundario: {
    background: 'none', border: 'none', color: '#009ee3', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'
  }
};