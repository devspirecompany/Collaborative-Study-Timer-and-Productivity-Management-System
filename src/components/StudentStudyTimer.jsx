import { useState, useEffect, useRef } from 'react';

const StudentStudyTimer = () => {
  // Timer State
  const [timerInterval, setTimerInterval] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState('study');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [totalTimeForSession, setTotalTimeForSession] = useState(25 * 60);

  // Session tracking
  const [sessionCount, setSessionCount] = useState(0);
  const [totalStudyTimeToday, setTotalStudyTimeToday] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);

  // Settings
  const [autoStartBreak, setAutoStartBreak] = useState(true);
  const [autoStartStudy, setAutoStartStudy] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Mode configurations
  const modeConfig = {
    study: {
      durations: [15, 25, 45, 60],
      defaultIndex: 1,
      label: 'Focus Time',
      color: '#3b82f6'
    },
    break: {
      durations: [5, 10, 15],
      defaultIndex: 0,
      label: 'Short Break',
      color: '#10b981'
    },
    longbreak: {
      durations: [15, 20, 30],
      defaultIndex: 0,
      label: 'Long Break',
      color: '#0ea5e9'
    }
  };

  const [currentDurationIndex, setCurrentDurationIndex] = useState(
    modeConfig[currentMode].defaultIndex
  );

  // Refs for SVG circles
  const progressCircleRef = useRef(null);
  const dailyProgressCircleRef = useRef(null);

  // Initialize timer on mount and mode change
  useEffect(() => {
    const durations = modeConfig[currentMode].durations;
    const newTime = durations[currentDurationIndex] * 60;
    setTimeRemaining(newTime);
    setTotalTimeForSession(newTime);
    updateProgressRing(newTime, newTime);
  }, [currentMode, currentDurationIndex]);

  // Timer interval effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [isRunning, timeRemaining]);

  // Update progress ring whenever time changes
  useEffect(() => {
    updateProgressRing(timeRemaining, totalTimeForSession);
  }, [timeRemaining, totalTimeForSession]);

  // Update daily progress ring
  useEffect(() => {
    const goalSeconds = 4 * 3600;
    const progressPercent = Math.min(100, (totalStudyTimeToday / goalSeconds) * 100);
    updateDailyProgressRing(progressPercent);
  }, [totalStudyTimeToday]);

  // Setup progress circle on mount
  useEffect(() => {
    setupProgressCircle();
  }, []);

  const setupProgressCircle = () => {
    if (progressCircleRef.current) {
      const radius = 140;
      const circumference = radius * 2 * Math.PI;
      progressCircleRef.current.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircleRef.current.style.strokeDashoffset = circumference;
    }
  };

  const updateProgressRing = (remaining, total) => {
    if (progressCircleRef.current) {
      const radius = 140;
      const circumference = radius * 2 * Math.PI;
      const percent = remaining / total;
      const offset = circumference - (percent * circumference);
      progressCircleRef.current.style.strokeDashoffset = offset;
    }
  };

  const updateDailyProgressRing = (percent) => {
    if (dailyProgressCircleRef.current) {
      const radius = 60;
      const circumference = radius * 2 * Math.PI;
      const offset = circumference - ((percent / 100) * circumference);
      dailyProgressCircleRef.current.style.strokeDasharray = `${circumference} ${circumference}`;
      dailyProgressCircleRef.current.style.strokeDashoffset = offset;
    }
  };

  const switchMode = (mode) => {
    if (!isRunning) {
      setCurrentMode(mode);
      setCurrentDurationIndex(modeConfig[mode].defaultIndex);
    }
  };

  const setTimerDuration = (minutes) => {
    if (!isRunning) {
      const durations = modeConfig[currentMode].durations;
      const index = durations.indexOf(minutes);
      setCurrentDurationIndex(index);
      const newTime = minutes * 60;
      setTimeRemaining(newTime);
      setTotalTimeForSession(newTime);
    }
  };

  const startTimer = () => {
    if (!isRunning && timeRemaining > 0) {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (timerInterval) clearInterval(timerInterval);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    const durations = modeConfig[currentMode].durations;
    const newTime = durations[currentDurationIndex] * 60;
    setTimeRemaining(newTime);
    setTotalTimeForSession(newTime);
  };

  const skipSession = () => {
    pauseTimer();
    completeSession();
  };

  const completeSession = () => {
    pauseTimer();

    if (currentMode === 'study') {
      setSessionCount(prev => prev + 1);
      setCompletedSessions(prev => prev + 1);
      setTotalStudyTimeToday(prev => prev + totalTimeForSession);
      setCurrentStreak(prev => prev + 1);
      addRecentSession('Study Session', totalTimeForSession);
    } else {
      addRecentSession(currentMode === 'break' ? 'Short Break' : 'Long Break', totalTimeForSession);
    }

    showCompletionNotification();

    // Auto-start next session
    if (currentMode === 'study' && autoStartBreak) {
      setTimeout(() => {
        switchMode('break');
        if (autoStartStudy) {
          setTimeout(() => startTimer(), 1000);
        }
      }, 2000);
    } else if (currentMode !== 'study' && autoStartStudy) {
      setTimeout(() => {
        switchMode('study');
        setTimeout(() => startTimer(), 1000);
      }, 2000);
    } else {
      resetTimer();
    }
  };

  const addRecentSession = (type, duration) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const minutes = Math.floor(duration / 60);

    const newSession = {
      type,
      time: timeStr,
      duration: minutes,
      isBreak: type.includes('Break')
    };

    setRecentSessions(prev => [newSession, ...prev].slice(0, 5));
  };

  const showCompletionNotification = () => {
    const modeLabel = modeConfig[currentMode].label;

    if (soundNotifications) {
      playNotificationSound();
    }

    if (desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('SpireWorks Study Timer', {
        body: `${modeLabel} completed!`,
        icon: '../imgs/SpireWorksLogo.png'
      });
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getDailyProgressPercent = () => {
    const goalSeconds = 4 * 3600;
    return Math.min(100, Math.round((totalStudyTimeToday / goalSeconds) * 100));
  };

  return (
    <div>
      {/* Top Navigation */}
      <nav className="topnav">
        <div className="nav-left">
          <div className="logo-nav">
            <img src="../imgs/SpireWorksLogo.png" alt="SpireWorks Logo" />
            <h1>SpireWorks</h1>
          </div>
          <div className="search-bar">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search..." />
          </div>
        </div>
        <div className="nav-right">
          <div className="nav-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5a5 5 0 0 1 5 5v2l1.5 3H3.5L5 12v-2a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 17a2 2 0 1 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="notification-badge">3</span>
          </div>
          <div className="user-menu" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
            <div className="user-avatar">AQ</div>
            <div className="user-info">
              <div className="user-name">Ash Quicho</div>
              <div className="user-role">Student</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={`user-dropdown ${userDropdownOpen ? 'active' : ''}`}>
            <a href="#" className="dropdown-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>View Profile</span>
            </a>
            <a href="#" className="dropdown-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m5.66-15.66l-4.24 4.24m0 6.84l-4.24 4.24M23 12h-6m-6 0H1m18.36-5.66l-4.24 4.24m0 6.84l-4.24 4.24"></path>
              </svg>
              <span>Settings</span>
            </a>
            <a href="#" className="dropdown-item logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <a href="StudentDashboard.html" className="menu-item">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3V17H17" />
              <path d="M5 13L9 9L12 12L17 7" />
            </svg>
          </span>
          <span className="menu-text">Dashboard</span>
        </a>
        <a href="StudyTimer.html" className="menu-item active">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6V10L13 11" />
            </svg>
          </span>
          <span className="menu-text">Study Timer</span>
        </a>
        <a href="#" className="menu-item">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 18V16C17 14.8954 16.1046 14 15 14H9C7.89543 14 7 14.8954 7 16V18" />
              <circle cx="12" cy="7" r="3" />
              <path d="M3 18V16C3 14.8954 3.89543 14 5 14H5.5" />
              <circle cx="5" cy="7" r="3" />
            </svg>
          </span>
          <span className="menu-text">Group Study</span>
        </a>
        <a href="#" className="menu-item">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 18L5 15L3 7L10 2L17 7L15 15L10 18Z" />
              <path d="M8 10L10 12L13 9" />
            </svg>
          </span>
          <span className="menu-text">Achievements</span>
        </a>
        <a href="#" className="menu-item">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4C16 2.89543 15.1046 2 14 2Z" />
              <path d="M9 6H11M9 9H11M9 12H11" />
            </svg>
          </span>
          <span className="menu-text">My Files</span>
        </a>
        <a href="#" className="menu-item">
          <span className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13V17M7 10V17M13 7V17M3 17H17" />
            </svg>
          </span>
          <span className="menu-text">Productivity Tracker</span>
        </a>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Study Timer</h1>
            <p className="page-subtitle">Stay focused and track your study sessions</p>
          </div>
          <button className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            View History
          </button>
        </div>

        <div className="timer-container">
          <div className="timer-main-card">
            {/* Mode Selector */}
            <div className="timer-mode-selector">
              <button
                className={`mode-btn ${currentMode === 'study' ? 'active' : ''}`}
                onClick={() => switchMode('study')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V6.5A2.5 2.5 0 0 0 17.5 4H6.5A2.5 2.5 0 0 0 4 6.5V19.5Z"/>
                </svg>
                Study
              </button>
              <button
                className={`mode-btn ${currentMode === 'break' ? 'active' : ''}`}
                onClick={() => switchMode('break')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z"/>
                  <path d="M3 6H21"/>
                  <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10"/>
                </svg>
                Short Break
              </button>
              <button
                className={`mode-btn ${currentMode === 'longbreak' ? 'active' : ''}`}
                onClick={() => switchMode('longbreak')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V21"/>
                  <path d="M20 5L12 9L4 5"/>
                </svg>
                Long Break
              </button>
            </div>

            {/* Timer Display */}
            <div className="timer-display-section">
              <div className="timer-circle">
                <svg className="timer-progress-ring" width="320" height="320">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e40af" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                  <circle className="timer-progress-ring-bg" cx="160" cy="160" r="140" />
                  <circle
                    ref={progressCircleRef}
                    className="timer-progress-ring-fill"
                    cx="160"
                    cy="160"
                    r="140"
                  />
                </svg>
                <div className="timer-inner">
                  <div className="timer-display">{formatTime(timeRemaining)}</div>
                  <div className="timer-session-label">{modeConfig[currentMode].label}</div>
                </div>
              </div>
            </div>

            {/* Preset Selector */}
            <div className="timer-preset-selector">
              {modeConfig[currentMode].durations.map((minutes, index) => (
                <button
                  key={minutes}
                  className={`preset-btn ${index === currentDurationIndex ? 'active' : ''}`}
                  onClick={() => setTimerDuration(minutes)}
                >
                  {minutes}m
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="timer-controls-main">
              <button className="control-btn control-btn-secondary" onClick={resetTimer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                Reset
              </button>
              {!isRunning ? (
                <button className="control-btn control-btn-primary" onClick={startTimer}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Start
                </button>
              ) : (
                <button className="control-btn control-btn-primary" onClick={pauseTimer}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause
                </button>
              )}
              <button className="control-btn control-btn-secondary" onClick={skipSession}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
                Skip
              </button>
            </div>

            {/* Session Info */}
            <div className="session-info">
              <div className="info-item">
                <div className="info-label">Session Count</div>
                <div className="info-value">{sessionCount}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Total Today</div>
                <div className="info-value">{formatTotalTime(totalStudyTimeToday)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Current Goal</div>
                <div className="info-value">4h 0m</div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="timer-sidebar">
            {/* Today's Progress */}
            <div className="card quick-stats">
              <h3 className="card-title-small">Today's Progress</h3>
              <div className="progress-ring-container">
                <svg className="progress-ring-small" width="140" height="140">
                  <circle className="progress-ring-bg-small" cx="70" cy="70" r="60" />
                  <circle
                    ref={dailyProgressCircleRef}
                    className="progress-ring-fill-small"
                    cx="70"
                    cy="70"
                    r="60"
                  />
                </svg>
                <div className="progress-ring-text">
                  <div className="progress-percentage">{getDailyProgressPercent()}%</div>
                  <div className="progress-label-small">of 4h goal</div>
                </div>
              </div>
              <div className="stats-mini">
                <div className="stat-mini">
                  <div className="stat-mini-value">{completedSessions}</div>
                  <div className="stat-mini-label">Completed</div>
                </div>
                <div className="stat-mini">
                  <div className="stat-mini-value">{currentStreak}</div>
                  <div className="stat-mini-label">Streak</div>
                </div>
              </div>
            </div>

            {/* Session Settings */}
            <div className="card session-settings">
              <h3 className="card-title-small">Session Settings</h3>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={autoStartBreak}
                    onChange={(e) => setAutoStartBreak(e.target.checked)}
                  />
                  <span>Auto-start breaks</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={autoStartStudy}
                    onChange={(e) => setAutoStartStudy(e.target.checked)}
                  />
                  <span>Auto-start study sessions</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={soundNotifications}
                    onChange={(e) => setSoundNotifications(e.target.checked)}
                  />
                  <span>Sound notifications</span>
                </label>
              </div>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={desktopNotifications}
                    onChange={(e) => {
                      setDesktopNotifications(e.target.checked);
                      if (e.target.checked) requestNotificationPermission();
                    }}
                  />
                  <span>Desktop notifications</span>
                </label>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="card recent-sessions">
              <h3 className="card-title-small">Recent Sessions</h3>
              <div className="session-list">
                {recentSessions.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No sessions yet today</p>
                  </div>
                ) : (
                  recentSessions.map((session, index) => (
                    <div key={index} className="session-item">
                      <div className="session-item-left">
                        <div className={`session-icon ${session.isBreak ? 'break' : ''}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div className="session-details">
                          <div className="session-type">{session.type}</div>
                          <div className="session-time">{session.time}</div>
                        </div>
                      </div>
                      <div className="session-duration">{session.duration}m</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentStudyTimer;