import { useState } from 'react';
import '../styles/ActiveRequest.css';
import logo from '../assets/splash-logo.png';

function ActiveRequest({ emergency, onCancel }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const responder = emergency?.assignedResponder || null;

  const emergencyId =
    emergency?.id || emergency?._id;

  const handleTrackMap = () => {
    if (
      responder?.location?.latitude &&
      responder?.location?.longitude
    ) {
      const { latitude, longitude } =
        responder.location;

      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        '_blank'
      );
    }
  };

  const handleCallResponder = () => {
    if (responder?.phone) {
      window.location.href =
        `tel:${responder.phone}`;
    }
  };

  const handleCancelEmergency = async () => {
    if (isCancelling) {
      return;
    }

    if (!emergencyId) {
      setCancelError(
        'Unable to identify this emergency request'
      );
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to cancel this emergency request?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsCancelling(true);
      setCancelError('');

      const token =
        localStorage.getItem(
          'aidconnect_token'
        );

      if (!token) {
        setCancelError(
          'Your session has expired. Please login again.'
        );
        return;
      }

      const response = await fetch(
        `http://10.0.2.2:5000/api/emergencies/${emergencyId}/cancel`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Unable to cancel emergency'
        );
      }

      console.log(
        'Emergency cancelled successfully:',
        data
      );

      // Return to Home after successful cancellation
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error(
        'Cancel emergency error:',
        error
      );

      setCancelError(
        error.message ||
        'Unable to cancel emergency'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="active-request-screen">

      {/* Header */}
      <header className="active-request-header">

        <div className="app-name">

          <img
            src={logo}
            alt="AidConnect"
            className="app-logo"
          />

          <span>
            AidConnect
          </span>

        </div>

        <div className="header-actions">

          <span className="active-status">

            <span className="status-dot"></span>

            ACTIVE

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


      {/* Emergency Status */}
      <section className="help-status-section">

        <div className="help-illustration">
          🛡️
        </div>

        <div className="active-request-badge">
          ACTIVE EMERGENCY
        </div>

        <h1>
          Help is on the way.
        </h1>

        <p>
          Your emergency signal has been received
          and responders are dispatched to your
          location.
        </p>

      </section>


      {/* Dispatch Status */}
      <section className="dispatch-card">

        <div className="dispatch-header">

          <div className="dispatch-title">

            <span className="dispatch-icon">
              ◉
            </span>

            <span>
              DISPATCH STATUS
            </span>

          </div>

          <span className="confirmed-status">
            Confirmed
          </span>

        </div>

        <div className="status-details">

          <div className="status-item">

            <small>
              Signal Strength
            </small>

            <strong>
              Strong
            </strong>

          </div>

          <div className="status-divider"></div>

          <div className="status-item">

            <small>
              GPS Lock
            </small>

            <strong>
              Active
            </strong>

          </div>

        </div>

      </section>


      {/* Location Information */}
      <section className="location-info-card">

        <div className="location-info-icon">
          📍
        </div>

        <div>

          <strong>
            Keep your phone nearby
          </strong>

          <p>
            Responders may call you for more details.
            Stay in your current safe location.
          </p>

        </div>

      </section>


      {/* Assigned Responder */}
      <section className="responder-section">

        <p className="section-label">
          ASSIGNED RESPONDER
        </p>

        <div className="responder-card">

          {responder ? (
            <>

              <div className="assigned-responder">

                <div className="responder-avatar">
                  👤
                </div>

                <div className="responder-details">

                  <strong>
                    {responder.name ||
                      'Responder'}
                  </strong>

                  <span>
                    {responder.type ||
                      'Verified AidConnect responder'}
                  </span>

                </div>

                {responder.phone && (
                  <button
                    type="button"
                    onClick={
                      handleCallResponder
                    }
                    className="call-responder"
                    aria-label="Call responder"
                  >
                    📞
                  </button>
                )}

              </div>

              <div className="responder-meta">

                {responder.distance && (
                  <span>
                    📍 {responder.distance}
                  </span>
                )}

                {responder.eta && (
                  <span>
                    🚗 {responder.eta}
                  </span>
                )}

              </div>

              {responder.location?.latitude &&
                responder.location?.longitude && (
                  <button
                    type="button"
                    className="track-map-button"
                    onClick={
                      handleTrackMap
                    }
                  >
                    🗺️ TRACK ON MAP
                  </button>
                )}

            </>
          ) : (

            <div className="responder-waiting">

              <div className="responder-waiting-icon">
                🔎
              </div>

              <div>

                <strong>
                  Finding a responder
                </strong>

                <span>
                  A verified responder will appear
                  here once your request is accepted.
                </span>

              </div>

            </div>

          )}

        </div>

      </section>


      {/* Emergency Contacts */}
      <section className="contacts-section">

        <p className="section-label">
          EMERGENCY CONTACTS
        </p>

        <div className="contact-card">

          <span className="contact-icon">
            ✓
          </span>

          <div>

            <strong>
              Trusted contacts
            </strong>

            <span className="contact-subtext">
              Your 2 saved emergency contacts
            </span>

          </div>

          <span className="contact-status notified">
            Notified
          </span>

        </div>

        <p className="contacts-info">
          Your saved emergency contacts are notified
          when an SOS emergency is activated.
        </p>

      </section>


      {/* Cancel Emergency */}
      <section className="cancel-section">

        {cancelError && (
          <p className="cancel-error">
            {cancelError}
          </p>
        )}

        <button
          type="button"
          className="cancel-button"
          onClick={handleCancelEmergency}
          disabled={isCancelling}
        >
          {isCancelling
            ? 'CANCELLING...'
            : 'CANCEL EMERGENCY SIGNAL'}
        </button>

        <small>
          Incident ID:{' '}
          {emergencyId
            ? `#${String(emergencyId)
                .slice(-6)
                .toUpperCase()}`
            : 'Pending'}
        </small>

      </section>


      {/* Bottom Navigation */}
      <nav className="bottom-navigation">

        <button
          type="button"
          className="nav-active"
        >
          <span className="nav-icon">
            ⚠
          </span>

          <span>
            SOS
          </span>
        </button>

        <button type="button">

          <span className="nav-icon">
            🗺
          </span>

          <span>
            Map
          </span>

        </button>

        <button type="button">

          <span className="nav-icon">
            ⚙
          </span>

          <span>
            Settings
          </span>

        </button>

      </nav>

    </main>
  );
}

export default ActiveRequest;