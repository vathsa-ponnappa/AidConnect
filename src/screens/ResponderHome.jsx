import { useEffect, useState } from 'react';
import '../Styles/ResponderHome.css';
import logo from '../assets/splash-logo.png';

function ResponderHome({ onStartResponse }) {
  const [requestStatus, setRequestStatus] = useState('loading');
  const [emergencyRequest, setEmergencyRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const API_BASE_URL = 'http://10.0.2.2:5000';

  // ================= FETCH EMERGENCY =================

  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const token = localStorage.getItem('aidconnect_token');

        if (!token) {
          setErrorMessage('Authentication token is missing.');
          setRequestStatus('error');
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/emergencies/nearby`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error('Nearby emergencies failed:', data);

          setErrorMessage(
            data.message || 'Unable to fetch emergency requests.'
          );

          setRequestStatus('error');
          return;
        }

        console.log('Nearby emergencies:', data);

        if (!data.emergencies || data.emergencies.length === 0) {
          setRequestStatus('empty');
          return;
        }

        // Display newest emergency
        const latestEmergency = data.emergencies[0];

        setEmergencyRequest(latestEmergency);
        setRequestStatus('pending');
      } catch (error) {
        console.error('Fetch emergencies error:', error);

        setErrorMessage('Unable to connect to the server.');
        setRequestStatus('error');
      }
    };

    fetchEmergency();
  }, []);

  // ================= ACCEPT =================

  const handleAccept = async () => {
    if (!emergencyRequest?.id) {
      return;
    }

    try {
      setIsResponding(true);

      const token = localStorage.getItem('aidconnect_token');

      if (!token) {
        alert('Authentication token is missing.');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/emergencies/${emergencyRequest.id}/respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'accept',
          }),
        }
      );

      const data = await response.json();

      console.log('Accept response:', data);

      if (!response.ok) {
        alert(data.message || 'Unable to accept emergency.');
        return;
      }

      setRequestStatus('accepted');
    } catch (error) {
      console.error('Accept emergency error:', error);

      alert('Unable to connect to the server.');
    } finally {
      setIsResponding(false);
    }
  };

  // ================= DECLINE =================

  const handleDecline = async () => {
    if (!emergencyRequest?.id) {
      return;
    }

    try {
      setIsResponding(true);

      const token = localStorage.getItem('aidconnect_token');

      if (!token) {
        alert('Authentication token is missing.');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/emergencies/${emergencyRequest.id}/respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'decline',
          }),
        }
      );

      const data = await response.json();

      console.log('Decline response:', data);

      if (!response.ok) {
        alert(data.message || 'Unable to decline emergency.');
        return;
      }

      setRequestStatus('declined');
    } catch (error) {
      console.error('Decline emergency error:', error);

      alert('Unable to connect to the server.');
    } finally {
      setIsResponding(false);
    }
  };

  // ================= MAP =================

  const handleOpenMap = () => {
    if (!emergencyRequest?.location) {
      return;
    }

    const { latitude, longitude } = emergencyRequest.location;

    const mapUrl =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(mapUrl, '_blank');
  };

  // ================= LOADING =================

  if (requestStatus === 'loading') {
    return (
      <main className="responder-home-screen">
        <section className="response-state-card">
          <div className="state-icon loading-state-icon">
            <span className="state-spinner"></span>
          </div>

          <h1>Checking Alerts</h1>

          <p>
            Looking for nearby emergency requests.
          </p>
        </section>
      </main>
    );
  }

  // ================= ERROR =================

  if (requestStatus === 'error') {
    return (
      <main className="responder-home-screen">
        <header className="responder-header">
          <div className="responder-brand">
            <img
              src={logo}
              alt="AidConnect"
              className="responder-logo"
            />

            <div className="responder-brand-text">
              <strong>AidConnect</strong>
              <span>Emergency response</span>
            </div>
          </div>
        </header>

        <section className="response-state-card">
          <div className="state-icon error-state-icon">
            !
          </div>

          <h1>Unable to Load</h1>

          <p>{errorMessage}</p>

          <button
            type="button"
            className="state-retry-button"
            onClick={() => window.location.reload()}
          >
            TRY AGAIN
          </button>
        </section>
      </main>
    );
  }

  // ================= NO REQUEST =================

  if (requestStatus === 'empty') {
    return (
      <main className="responder-home-screen">

        {/* HEADER */}
        <header className="responder-header">

          <div className="responder-brand">
            <img
              src={logo}
              alt="AidConnect"
              className="responder-logo"
            />

            <div className="responder-brand-text">
              <strong>AidConnect</strong>
              <span>Emergency response</span>
            </div>
          </div>

          <div className="header-actions">
            <span className="available-badge">
              ● AVAILABLE
            </span>

            <button type="button" aria-label="Notifications">
              🔔
            </button>

            <button type="button" aria-label="Profile">
              👤
            </button>
          </div>

        </header>

        {/* EMPTY STATE */}
        <section className="response-state-card empty-state-card">

          <div className="state-icon confirmation-icon">
            ✓
          </div>

          <h1>No Active Requests</h1>

          <p>
            There are currently no emergency requests
            requiring your response.
          </p>

          <div className="available-message">
            <span>●</span>
            You are available to help
          </div>

        </section>

        {/* BOTTOM NAV */}
        <nav className="responder-bottom-navigation">

          <button
            type="button"
            className="active"
          >
            <span>⚠</span>
            <small>Alerts</small>
          </button>

          <button type="button">
            <span>🗺</span>
            <small>Map</small>
          </button>

          <button type="button">
            <span>⚙</span>
            <small>Settings</small>
          </button>

        </nav>

      </main>
    );
  }

  // ================= ACCEPTED =================

  if (requestStatus === 'accepted') {
    return (
      <main className="responder-home-screen">

        <section className="response-state-card accepted-state-card">

          <div className="state-icon confirmation-icon">
            ✓
          </div>

          <h1>Request Accepted</h1>

          <p>
            You are now responding to this emergency.
          </p>

          <div className="confirmation-card">

            <strong>
              {emergencyRequest.type}
            </strong>

            <span>
              Emergency ID: {emergencyRequest.id}
            </span>

            <span>
              Location:{' '}
              {emergencyRequest.location?.latitude}
              ,{' '}
              {emergencyRequest.location?.longitude}
            </span>

          </div>

          <button
            type="button"
            className="continue-response-button"
            onClick={() => {
              console.log('START RESPONSE clicked');

              if (onStartResponse) {
                onStartResponse(emergencyRequest);
              }
            }}
          >
            START RESPONSE
          </button>

        </section>

      </main>
    );
  }

  // ================= DECLINED =================

  if (requestStatus === 'declined') {
    return (
      <main className="responder-home-screen">

        <section className="response-state-card declined-state-card">

          <div className="state-icon declined-icon">
            ×
          </div>

          <h1>Request Declined</h1>

          <p>
            You are no longer assigned to this
            emergency request.
          </p>

          <button
            type="button"
            className="continue-response-button"
            onClick={() => window.location.reload()}
          >
            VIEW REQUESTS
          </button>

        </section>

      </main>
    );
  }

  // ================= MAIN SCREEN =================

  return (
    <main className="responder-home-screen">

      {/* ================= HEADER ================= */}

      <header className="responder-header">

        <div className="responder-brand">

          <img
            src={logo}
            alt="AidConnect"
            className="responder-logo"
          />

          <div className="responder-brand-text">
            <strong>AidConnect</strong>
            <span>Emergency response</span>
          </div>

        </div>

        <div className="header-actions">

          <span className="available-badge">
            ● AVAILABLE
          </span>

          <button
            type="button"
            aria-label="Notifications"
          >
            🔔
          </button>

          <button
            type="button"
            aria-label="Profile"
          >
            👤
          </button>

        </div>

      </header>

      {/* ================= NEW ALERT ================= */}

      <section className="alert-banner">

        <div className="alert-title-row">

          <div>

            <span className="new-alert-label">
              NEW ALERT
            </span>

            <h1>
              Immediate Response Required
            </h1>

          </div>

          <span className="live-badge">
            LIVE SOS
          </span>

        </div>

      </section>

      {/* ================= MAIN CONTENT ================= */}

      <div className="responder-content">

        {/* SEVERITY + REQUEST ID */}

        <div className="request-meta-row">

          <span className="severity-badge">
            ⚠ EMERGENCY
          </span>

          <span className="request-id">
            ID: {emergencyRequest.id}
          </span>

        </div>

        {/* ================= EMERGENCY CARD ================= */}

        <section className="emergency-card">

          <div className="card-title">

            <span className="emergency-icon">
              🚨
            </span>

            <div>
              <strong>
                {emergencyRequest.type}
              </strong>

              <small>
                Emergency request
              </small>
            </div>

          </div>

          {/* AI / EMERGENCY SUMMARY */}

          <div className="ai-summary">

            <span className="ai-icon">
              ✦
            </span>

            <p>

              <strong>
                Emergency Details
              </strong>

              <br />

              {emergencyRequest.description ||
                'Emergency assistance required.'}

            </p>

          </div>

          {/* LOCATION */}

          <div className="detail-row">

            <span className="detail-icon">
              📍
            </span>

            <div>

              <small>
                INCIDENT LOCATION
              </small>

              <strong>
                {emergencyRequest.location?.address ||
                  'GPS location available'}
              </strong>

            </div>

          </div>

          {/* GPS */}

          <div className="detail-row">

            <span className="detail-icon">
              🛰
            </span>

            <div>

              <small>
                GPS COORDINATES
              </small>

              <strong>
                {emergencyRequest.location?.latitude}
                ,{' '}
                {emergencyRequest.location?.longitude}
              </strong>

            </div>

          </div>

          {/* CREATED TIME */}

          <div className="detail-row">

            <span className="detail-icon">
              ◷
            </span>

            <div>

              <small>
                CREATED
              </small>

              <strong>
                {new Date(
                  emergencyRequest.createdAt
                ).toLocaleString()}
              </strong>

            </div>

          </div>

        </section>

        {/* ================= LOCATION ================= */}

        <section className="location-section">

          <div className="location-heading">

            <span>
              LOCATION PREVIEW
            </span>

            <button
              type="button"
              onClick={handleOpenMap}
            >
              OPEN FULL MAP →
            </button>

          </div>

          <div className="map-preview">

            <div className="map-road road-one"></div>
            <div className="map-road road-two"></div>
            <div className="map-road road-three"></div>

            <div className="map-marker">
              <span>📍</span>
            </div>

            <div className="map-label">
              Target Incident
            </div>

          </div>

          <div className="coordinates">

            GPS:{' '}
            {emergencyRequest.location?.latitude}
            ,{' '}
            {emergencyRequest.location?.longitude}

          </div>

        </section>

        {/* ================= RESPONSE ACTIONS ================= */}

        <section className="request-actions">

          <button
            type="button"
            className="decline-button"
            onClick={handleDecline}
            disabled={isResponding}
          >

            <span>✕</span>

            {isResponding
              ? 'PLEASE WAIT...'
              : 'DECLINE'}

          </button>

          <button
            type="button"
            className="accept-button"
            onClick={handleAccept}
            disabled={isResponding}
          >

            <span>✓</span>

            {isResponding
              ? 'PLEASE WAIT...'
              : 'ACCEPT'}

          </button>

        </section>

        <p className="request-disclaimer">

          By accepting, you confirm that you are currently
          available and able to assist. GPS location will
          be shared during the response.

        </p>

      </div>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="responder-bottom-navigation">

        <button
          type="button"
          className="active"
        >
          <span>⚠</span>
          <small>Alerts</small>
        </button>

        <button type="button">
          <span>🗺</span>
          <small>Map</small>
        </button>

        <button type="button">
          <span>⚙</span>
          <small>Settings</small>
        </button>

      </nav>

    </main>
  );
}

export default ResponderHome;