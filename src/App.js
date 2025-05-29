import React, { useState } from 'react';

function App() {
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState(null);
  const [previsao, setPrevisao] = useState(null);
  const [loading, setLoading] = useState({ cep: false, meteo: false });
  const [error, setError] = useState(null);

  const buscarPrevisaoTempo = async (lat, lng) => {
    setLoading(prev => ({ ...prev, meteo: true }));
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`
      );
      const data = await response.json();
      setPrevisao(data);
    } catch (err) {
      console.error("Erro ao buscar previsão:", err);
    } finally {
      setLoading(prev => ({ ...prev, meteo: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading({ cep: true, meteo: false });
    setError(null);
    setEndereco(null);
    setPrevisao(null);
    
    try {
      const cepNumerico = cep.replace(/\D/g, '');
      
      if (cepNumerico.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
      }
      
      const cepResponse = await fetch(`https://cep.awesomeapi.com.br/json/${cepNumerico}`);
      const cepData = await cepResponse.json();
      
      if (cepData.status === 404) {
        throw new Error('CEP não encontrado');
      }
      
      setEndereco(cepData);
      await buscarPrevisaoTempo(cepData.lat, cepData.lng);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, cep: false }));
    }
  };

  // Função para interpretar códigos de tempo
  const interpretarWeatherCode = (code) => {
    const codes = {
      0: 'Céu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Nevoeiro',
      51: 'Chuvisco leve',
      61: 'Chuva leve',
      80: 'Pancadas de chuva',
      95: 'Trovoada',
    };
    return codes[code] || `Condição desconhecida (${code})`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Consulta de CEP com Previsão do Tempo</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="cep">Digite o CEP: </label>
          <input
            type="text"
            id="cep"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="Ex: 01001000 ou 01001-000"
            style={{ padding: '8px', width: '100%', maxWidth: '300px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading.cep}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: loading.cep ? '#cccccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {loading.cep ? 'Buscando...' : 'Buscar Endereço e Tempo'}
        </button>
      </form>
      
      {(loading.cep || loading.meteo) && <p>Carregando dados...</p>}
      
      {error && (
        <div style={{ 
          padding: '10px', 
          border: '1px solid #ff4444', 
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          color: '#ff4444',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {(endereco || previsao) && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          justifyContent: 'space-between' 
        }}>
          {endereco && (
            <div style={{ 
              flex: '1', 
              minWidth: '300px', 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>Dados do Endereço</h3>
              <p><strong>CEP:</strong> {endereco.cep}</p>
              <p><strong>Endereço:</strong> {endereco.address}</p>
              <p><strong>Bairro:</strong> {endereco.district}</p>
              <p><strong>Cidade:</strong> {endereco.city}</p>
              <p><strong>Estado:</strong> {endereco.state}</p>
              <p><strong>Coordenadas:</strong> {endereco.lat}, {endereco.lng}</p>
            </div>
          )}
          
          {previsao && (
            <div style={{ 
              flex: '1', 
              minWidth: '300px', 
              padding: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f0f8ff'
            }}>
              <h3>Previsão do Tempo</h3>
              {previsao.current_weather && (
                <div>
                  <p><strong>Agora:</strong> {previsao.current_weather.temperature}°C</p>
                  <p><strong>Condição:</strong> {interpretarWeatherCode(previsao.current_weather.weathercode)}</p>
                  <p><strong>Vento:</strong> {previsao.current_weather.windspeed} km/h</p>
                </div>
              )}
              
              {previsao.daily && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Próximos Dias</h4>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                    {previsao.daily.time.map((date, index) => (
                      <div key={index} style={{ 
                        padding: '10px', 
                        border: '1px solid #ccc', 
                        borderRadius: '4px',
                        minWidth: '100px'
                      }}>
                        <p><strong>{new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })}</strong></p>
                        <p>Máx: {previsao.daily.temperature_2m_max[index]}°C</p>
                        <p>Mín: {previsao.daily.temperature_2m_min[index]}°C</p>
                        <p>{interpretarWeatherCode(previsao.daily.weathercode[index])}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
