import React, { useState, useEffect } from 'react';
import './App.css';

// Dữ liệu tĩnh 8 thành phố
const CITY_DATA = [
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lng: 107.5909 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9404, lng: 108.4583 },
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
];

// Map mã thời tiết ra giao diện thô mộc
const parseWeather = (code) => {
  if (code === 0) return { text: 'Trời Nắng Trong', class: 'bg-clear' };
  if (code <= 3) return { text: 'Nhiều Mây', class: 'bg-cloudy' };
  if (code <= 48) return { text: 'Sương Mù', class: 'bg-cloudy' };
  if (code <= 67) return { text: 'Có Mưa', class: 'bg-rain' };
  if (code <= 82) return { text: 'Mưa Rào', class: 'bg-rain' };
  if (code >= 95) return { text: 'Dông Bão', class: 'bg-thunder' };
  return { text: 'Bình Thường', class: 'bg-cloudy' };
};

// Icon nét dày (strokeWidth="3") hợp với phong cách Neo-brutalism
const BrutalIcon = ({ code, size = 40 }) => {
  const type = parseWeather(code).class;
  const stroke = "currentColor";
  
  if (type === 'bg-clear') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  );
  if (type === 'bg-rain') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>
  );
  if (type === 'bg-thunder') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/>
    </svg>
  );
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M17.5 19A4.5 4.5 0 0 0 16 10a6 6 0 0 0-11.2 2A4 4 0 0 0 5 19h12.5z"/>
    </svg>
  );
};

// Loại bỏ dấu để search
const normalizeStr = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function App() {
  const [activeCity, setActiveCity] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [uiState, setUiState] = useState({ isLoading: false, isError: false });
  const [tempUnit, setTempUnit] = useState('C');
  const [keyword, setKeyword] = useState('');
  
  const [favCities, setFavCities] = useState(() => {
    const saved = localStorage.getItem('my_fav_cities');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('my_fav_cities', JSON.stringify(favCities));
  }, [favCities]);

  const loadWeather = async (cityObj) => {
    if (!cityObj) return;
    setUiState({ isLoading: true, isError: false });
    try {
      const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${cityObj.lat}&longitude=${cityObj.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh&forecast_days=7`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("API failed");
      const jsonData = await res.json();
      setApiData(jsonData);
      setUiState({ isLoading: false, isError: false });
    } catch (e) {
      setUiState({ isLoading: false, isError: true });
    }
  };

  const handlePickCity = (city) => {
    setActiveCity(city);
    loadWeather(city);
  };

  const handlePin = (id, e) => {
    e.stopPropagation();
    setFavCities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const renderTemp = (val) => {
    if (val == null) return '--';
    return tempUnit === 'F' ? Math.round((val * 9/5) + 32) : Math.round(val);
  };

  const listToRender = CITY_DATA
    .filter(c => normalizeStr(c.name).includes(normalizeStr(keyword)))
    .sort((a, b) => favCities.includes(b.id) - favCities.includes(a.id));

  return (
    <div className="container">
      {/* HEADER */}
      <header className="brutal-box header">
        <h1>Dự báo thời tiết 8 thành phố Việt Nam</h1>
        <div className="unit-switch">
          <button onClick={() => setTempUnit('C')} className={tempUnit === 'C' ? 'active' : ''}>°C</button>
          <button onClick={() => setTempUnit('F')} className={tempUnit === 'F' ? 'active' : ''}>°F</button>
        </div>
      </header>

      <div className="app-grid">
        {/* SIDEBAR TÌM KIẾM */}
        <aside>
          <input 
            type="text" 
            placeholder="TÌM THÀNH PHỐ..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-bar"
          />
          <div className="city-list">
            {listToRender.map(c => {
              const isPinned = favCities.includes(c.id);
              return (
                <div key={c.id} onClick={() => handlePickCity(c)} className={`city-item ${activeCity?.id === c.id ? 'active' : ''}`}>
                  <span>{c.name}</span>
                  <button onClick={(e) => handlePin(c.id, e)} className={`star-btn ${isPinned ? 'fav' : ''}`}>
                    ★
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* NỘI DUNG CHÍNH */}
        <main className="right-panel">
          
          {!activeCity && !uiState.isLoading && (
            <div className="brutal-box status-msg">
              <BrutalIcon code={0} size={60} />
              <p style={{marginTop: 15}}>CHƯA CHỌN THÀNH PHỐ NÀO</p>
            </div>
          )}

          {uiState.isLoading && !apiData && (
            <div className="brutal-box status-msg" style={{ background: '#ffe600' }}>
              <p>ĐANG TẢI DỮ LIỆU...</p>
            </div>
          )}

          {uiState.isError && !uiState.isLoading && (
            <div className="brutal-box status-msg" style={{ background: '#ffcccc' }}>
              <p>LỖI MẠNG! KHÔNG THỂ LẤY DỮ LIỆU.</p>
              <button onClick={() => loadWeather(activeCity)} className="btn-retry">THỬ LẠI</button>
            </div>
          )}

          {apiData && !uiState.isError && (
            <>
              {/* THỜI TIẾT HIỆN TẠI */}
              <div className={`brutal-box current-weather ${parseWeather(apiData.current.weather_code).class}`}>
                <div className="weather-header">
                  <div>
                    <h2>{activeCity.name}</h2>
                    <p className="update-text">CẬP NHẬT: {new Date(apiData.current.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <BrutalIcon code={apiData.current.weather_code} size={80} />
                </div>
                
                <div className="weather-body">
                  <span className="temp-huge">{renderTemp(apiData.current.temperature_2m)}°</span>
                  <span className="desc-text">{parseWeather(apiData.current.weather_code).text}</span>
                </div>

                <div className="weather-footer">
                  <span>ĐỘ ẨM: {apiData.current.relative_humidity_2m}%</span>
                  <span>SỨC GIÓ: {apiData.current.wind_speed_10m} km/h</span>
                </div>
              </div>

              {/* DỰ BÁO 7 NGÀY */}
              <div className="brutal-box forecast-section">
                <h3>Dự báo 7 ngày</h3>
                <div className="forecast-grid">
                  {apiData.daily.time.map((tStr, i) => {
                    const dateObj = new Date(tStr);
                    const label = i === 0 ? 'HÔM NAY' : dateObj.toLocaleDateString('vi-VN', { weekday: 'short' }).toUpperCase();
                    
                    return (
                      <div key={tStr} className="day-card">
                        <div className="d-name">{label}</div>
                        <div className="d-date">{dateObj.getDate()}/{dateObj.getMonth() + 1}</div>
                        <BrutalIcon code={apiData.daily.weather_code[i]} size={40} />
                        <div className="d-temps">
                          <span className="t-max">{renderTemp(apiData.daily.temperature_2m_max[i])}°</span>
                          <span className="t-min">{renderTemp(apiData.daily.temperature_2m_min[i])}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}