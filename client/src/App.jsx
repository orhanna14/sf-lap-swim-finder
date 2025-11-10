import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [pools, setPools] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('by-day'); // 'by-day' only for now
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [availablePools, setAvailablePools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch pools on mount
  useEffect(() => {
    fetchPools();
    fetchSchedules();
  }, []);

  // Check availability when in "now" or "specific" mode
  useEffect(() => {
    if (viewMode === 'now') {
      checkAvailabilityNow();
      // Refresh every 5 minutes
      const interval = setInterval(checkAvailabilityNow, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else if (viewMode === 'specific') {
      checkAvailabilitySpecific();
    }
  }, [viewMode, selectedDate, selectedTime, schedules]);

  async function fetchPools() {
    try {
      const response = await axios.get(`${API_URL}/pools`);
      setPools(response.data);
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    }
  }

  async function fetchSchedules() {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/schedules`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkAvailabilityNow() {
    try {
      const response = await axios.get(`${API_URL}/available`);
      setAvailablePools(response.data.availablePools);
    } catch (error) {
      console.error('Failed to check availability:', error);
    }
  }

  async function checkAvailabilitySpecific() {
    try {
      const response = await axios.get(`${API_URL}/available`, {
        params: {
          date: selectedDate,
          time: selectedTime,
        },
      });
      setAvailablePools(response.data.availablePools);
    } catch (error) {
      console.error('Failed to check availability:', error);
    }
  }

  async function refreshSchedules() {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/schedules/refresh`);
      await fetchSchedules();
    } catch (error) {
      console.error('Failed to refresh schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleFavorite(poolId) {
    setFavorites(prev =>
      prev.includes(poolId)
        ? prev.filter(id => id !== poolId)
        : [...prev, poolId]
    );
  }

  function parseTime(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  function getPoolsByDayAndTime() {
    const timeRanges = {
      'all': [0, 24 * 60],
      'early-morning': [5 * 60, 8 * 60], // 5am - 8am
      'morning': [8 * 60, 12 * 60], // 8am - 12pm
      'midday': [12 * 60, 14 * 60], // 12pm - 2pm
      'afternoon': [14 * 60, 17 * 60], // 2pm - 5pm
      'evening': [17 * 60, 21 * 60], // 5pm - 9pm
    };

    const [minTime, maxTime] = timeRanges[selectedTimeRange] || timeRanges['all'];

    const poolsWithSessions = schedules
      .map(schedule => {
        if (!schedule.lapSwimSessions || schedule.lapSwimSessions.length === 0) {
          return null;
        }

        const matchingSessions = schedule.lapSwimSessions.filter(session => {
          // Check if day matches
          const dayMatch = session.days.some(day =>
            day.toUpperCase().startsWith(selectedDay.substring(0, 3))
          );
          if (!dayMatch) return false;

          // Check if time overlaps with selected range
          if (session.times.length >= 2) {
            const startMinutes = parseTime(session.times[0]);
            const endMinutes = parseTime(session.times[1]);
            if (startMinutes !== null && endMinutes !== null) {
              // Check if session overlaps with selected time range
              return startMinutes < maxTime && endMinutes > minTime;
            }
          }
          return false;
        });

        if (matchingSessions.length > 0) {
          return {
            pool: schedule.pool,
            sessions: matchingSessions,
            isManual: schedule.isManual,
          };
        }
        return null;
      })
      .filter(item => item !== null);

    // Sort by favorites first
    return poolsWithSessions.sort((a, b) => {
      const aFav = favorites.includes(a.pool.id);
      const bFav = favorites.includes(b.pool.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.pool.name.localeCompare(b.pool.name);
    });
  }

  const sortedPools = [...pools].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="app">
      <header className="header">
        <h1>SF Lap Swim Finder</h1>
        <p className="subtitle">Find open lap swimming pools in San Francisco and nearby</p>
      </header>

      <div className="controls">
        <div className="day-time-picker">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="day-select"
          >
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="SUNDAY">Sunday</option>
          </select>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="all">All Times</option>
            <option value="early-morning">Early Morning (5-8 AM)</option>
            <option value="morning">Morning (8 AM-12 PM)</option>
            <option value="midday">Midday (12-2 PM)</option>
            <option value="afternoon">Afternoon (2-5 PM)</option>
            <option value="evening">Evening (5-9 PM)</option>
          </select>
        </div>

        <button onClick={refreshSchedules} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Schedules'}
        </button>
      </div>

      <div className="content">
        <div className="by-day-view">
          <h2>
            {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
            {selectedTimeRange !== 'all' && ` - ${
              selectedTimeRange === 'early-morning' ? 'Early Morning (5-8 AM)' :
              selectedTimeRange === 'morning' ? 'Morning (8 AM-12 PM)' :
              selectedTimeRange === 'midday' ? 'Midday (12-2 PM)' :
              selectedTimeRange === 'afternoon' ? 'Afternoon (2-5 PM)' :
              'Evening (5-9 PM)'
            }`}
          </h2>
          {loading ? (
            <p>Loading schedules...</p>
          ) : (() => {
            const poolsByDay = getPoolsByDayAndTime();
            return poolsByDay.length === 0 ? (
              <p className="no-results">No lap swim sessions available for this day/time</p>
            ) : (
              <div className="pool-grid">
                {poolsByDay.map(({ pool, sessions, isManual }) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    schedule={sessions}
                    isFavorite={favorites.includes(pool.id)}
                    onToggleFavorite={() => toggleFavorite(pool.id)}
                    isManual={isManual}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <footer className="footer">
        <p>
          Data from{' '}
          <a href="https://sfrecpark.org/482/Swimming-Pools" target="_blank" rel="noopener noreferrer">
            SF Recreation & Parks
          </a>
        </p>
        <p className="disclaimer">
          Schedules are updated automatically but may not reflect real-time closures. Always verify before visiting.
        </p>
      </footer>
    </div>
  );
}

function PoolCard({ pool, schedule, isFavorite, onToggleFavorite, isManual }) {
  return (
    <div className="pool-card">
      <div className="pool-header">
        <div>
          <h3>
            {pool.name}
            {isManual && (
              <span className="manual-badge" title="Manually entered schedule">Manual</span>
            )}
          </h3>
          <p className="pool-city">{pool.city}</p>
        </div>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      <p className="pool-address">{pool.address}</p>
      {schedule && schedule.length > 0 && (
        <div className="schedule-preview">
          <h4>Lap Swim Times:</h4>
          {schedule.map((session, idx) => (
            <div key={idx} className="session">
              <span className="days">{session.days.join(', ')}</span>
              <span className="times">{session.times.join(' - ')}</span>
            </div>
          ))}
        </div>
      )}
      <div className="pool-links">
        {pool.scheduleUrl && (
          <a href={pool.scheduleUrl} target="_blank" rel="noopener noreferrer" className="schedule-link">
            View PDF Schedule →
          </a>
        )}
        {pool.detailsUrl && (
          <a href={pool.detailsUrl} target="_blank" rel="noopener noreferrer" className="details-link">
            View Details →
          </a>
        )}
      </div>
    </div>
  );
}

function PoolScheduleCard({ pool, schedule, isFavorite, onToggleFavorite }) {
  return (
    <div className="pool-schedule-card">
      <div className="pool-header">
        <div>
          <h3>
            {pool.name}
            {schedule && schedule.isManual && (
              <span className="manual-badge" title="Manually entered schedule">Manual</span>
            )}
          </h3>
          <p className="pool-city">{pool.city}</p>
        </div>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>
      {schedule && schedule.lapSwimSessions && schedule.lapSwimSessions.length > 0 ? (
        <div className="full-schedule">
          {schedule.lapSwimSessions.map((session, idx) => (
            <div key={idx} className="schedule-session">
              <div className="session-days">{session.days.join(', ')}</div>
              <div className="session-times">{session.times.join(' - ')}</div>
              {session.notes && <div className="session-notes">{session.notes}</div>}
            </div>
          ))}
          {schedule.rawText && (
            <details className="raw-schedule">
              <summary>View raw schedule text</summary>
              <pre>{schedule.rawText}</pre>
            </details>
          )}
          <div className="pool-links">
            {pool.scheduleUrl && (
              <a href={pool.scheduleUrl} target="_blank" rel="noopener noreferrer" className="schedule-link">
                View PDF Schedule →
              </a>
            )}
            {pool.detailsUrl && (
              <a href={pool.detailsUrl} target="_blank" rel="noopener noreferrer" className="details-link">
                View Details →
              </a>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="no-schedule">Schedule not available</p>
          <div className="pool-links">
            {pool.scheduleUrl && (
              <a href={pool.scheduleUrl} target="_blank" rel="noopener noreferrer" className="schedule-link">
                View PDF Schedule →
              </a>
            )}
            {pool.detailsUrl && (
              <a href={pool.detailsUrl} target="_blank" rel="noopener noreferrer" className="details-link">
                View Details →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
