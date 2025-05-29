import React, { useState } from 'react';
import './App.css';

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

  const getWeatherIcon = (code) => {
    const icons = {
      0: '☀️',
      1: '🌤',
      2: '⛅',
      3: '☁️',
      45: '🌫',
      51: '🌧',
      61: '🌧',
      80: '🌦',
      95: '⛈',
    };
    return icons[code] || '🌈';
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Consulta de CEP + Previsão do Tempo</h1>
        <p className="subtitle">Encontre endereços e condições climáticas em todo o Brasil</p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          id="cep"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite um CEP (ex: 01001000 ou 01001-000)"
          className="input"
        />
        <button 
          type="submit" 
          disabled={loading.cep}
          className="button"
        >
          {loading.cep ? 'Buscando...' : 'Buscar Informações'}
        </button>
      </form>
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {(loading.cep || loading.meteo) && (
        <div className="loading">
          <p>Carregando informações...</p>
        </div>
      )}
      
      {(endereco || previsao) && (
        <div className="results-container">
          {endereco && (
            <div className="card address-card">
              <h2 className="card-title">
                <span role="img" aria-label="Localização">📍</span> Endereço Encontrado
              </h2>
              <div className="weather-details">
                <div className="detail-item">
                  <span className="detail-label">CEP</span>
                  <span className="detail-value">{endereco.cep}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Endereço</span>
                  <span className="detail-value">{endereco.address}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Bairro</span>
                  <span className="detail-value">{endereco.district}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cidade/UF</span>
                  <span className="detail-value">{endereco.city}/{endereco.state}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Latitude</span>
                  <span className="detail-value">{endereco.lat}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Longitude</span>
                  <span className="detail-value">{endereco.lng}</span>
                </div>
              </div>
            </div>
          )}
          
          {previsao && (
            <div className="card weather-card">
              <h2 className="card-title">
                <span role="img" aria-label="Tempo">🌤</span> Previsão do Tempo
              </h2>
              
              {previsao.current_weather && (
                <div className="weather-now">
                  <div className="weather-icon">
                    {getWeatherIcon(previsao.current_weather.weathercode)}
                  </div>
                  <div className="current-temp">
                    {previsao.current_weather.temperature}°C
                  </div>
                  <div>
                    <div className="weather-condition">
                      {interpretarWeatherCode(previsao.current_weather.weathercode)}
                    </div>
                    <div className="weather-feels-like">
                      Sensação {Math.round(previsao.current_weather.temperature - 1)}°C
                    </div>
                  </div>
                </div>
              )}
              
              <div className="weather-details">
                <div className="detail-item">
                  <span className="detail-label">Vento</span>
                  <span className="detail-value">{previsao.current_weather.windspeed} km/h</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Direção</span>
                  <span className="detail-value">{previsao.current_weather.winddirection}°</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Umidade</span>
                  <span className="detail-value">{previsao.hourly.relativehumidity_2m[0]}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Pressão</span>
                  <span className="detail-value">1012 hPa</span>
                </div>
              </div>
              
              {previsao.daily && (
                <div className="forecast-container">
                  <h3 className="forecast-title">Previsão para os próximos dias</h3>
                  <div className="forecast-days">
                    {previsao.daily.time.slice(0, 7).map((date, index) => (
                      <div key={index} className="forecast-day">
                        <div className="day-name">
                          {new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </div>
                        <div className="weather-icon">
                          {getWeatherIcon(previsao.daily.weathercode[index])}
                        </div>
                        <div className="day-temp">
                          <span className="temp-max">{previsao.daily.temperature_2m_max[index]}°</span>
                          <span className="temp-min">{previsao.daily.temperature_2m_min[index]}°</span>
                        </div>
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
