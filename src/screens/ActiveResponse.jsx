import { useState } from 'react';
import '../Styles/ActiveResponse.css';
import logo from '../assets/splash-logo.png';

function ActiveResponse({ emergency }) {
  const [responseStatus, setResponseStatus] =
    useState('responding');

  if (!emergency) {
    return (
      <main className="active-response-screen">
        <section className="response-complete-screen">
          <div className="complete-icon">
            !
          </div>

          <h1>
            Response Not Found
          </h1>

          <p>
            The emergency response information
            could not be loaded.
          </p>
        </section>
      </main>
    );
  }

  const emergencyId =
    emergency.id || emergency._id;

  const latitude =
    emergency.location?.latitude;

  const longitude =
    emergency.location?.longitude;

  const handleOpenNavigation = () => {
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      console.error(
        'Requester location is unavailable'
      );

      return;
    }

    const mapUrl =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    window.open(
      mapUrl,
      '_blank'
    );
  };

  const handleCallRequester = () => {
    console.log(
      'Calling requester'
    );

    console.log(
      'Requester contact integration will be connected later'
    );
  };

  const handleMarkArrived = () => {
    setResponseStatus('arrived');

    console.log(
      'Responder marked as arrived'
    );

    console.log(
      'Emergency ID:',
      emergencyId
    );
  };

  const handleCompleteResponse = () => {
    if (responseStatus !== 'arrived') {
      return;
    }

    setResponseStatus('completed');

    console.log(
      'Emergency response completed'
    );

    console.log(
      'Emergency ID:',
      emergencyId
    );
  };

  /*
   * ================= COMPLETED =================
   */

  if (responseStatus === 'completed') {
    return (
      <main className="active-response-screen">

        <section className="response-complete-screen">

          <div className="complete-logo">
            <img
              src={logo}
              alt="AidConnect"
            />
          </div>

          <div className="complete-icon">
            ✓
          </div>

          <div className="completion-badge">
            RESPONSE COMPLETED
          </div>

          <h1>
            Response Completed
          </h1>

          <p>
            The emergency response has been
            successfully marked as completed.
          </p>

          <div className="completion-card">

            <span>
              REQUEST ID
            </span>

            <strong>
              {emergencyId}
            </strong>

            <span>
              EMERGENCY TYPE
            </span>

            <strong>
              {emergency.type ||
                'Emergency'}
            </strong>

            <span>
              RESPONSE STATUS
            </span>

            <strong className="completion-success">
              Completed ✓
            </strong>

          </div>

          <button
            type="button"
            className="back-dashboard-button"
            onClick={() =>
              window.location.reload()
            }
          >
            RETURN TO DASHBOARD
          </button>

        </section>

      </main>
    );
  }

  return (
    <main className="active-response-screen">

      {/* ================= HEADER ================= */}

      <header className="active-response-header">

        <div className="response-app-name">

          <img
            src={logo}
            alt="AidConnect"
            className="response-app-logo"
          />

          <span>
            AidConnect
          </span>

        </div>

        <div className="responding-status">

          <span className="responding-dot"></span>

          {responseStatus === 'arrived'
            ? 'ARRIVED'
            : 'RESPONDING'}

        </div>

      </header>


      {/* ================= MAIN ================= */}

      <div className="active-response-content">

        {/* ================= TITLE ================= */}

        <section className="response-title-section">

          <span className="response-label">
            {responseStatus === 'arrived'
              ? 'AT INCIDENT'
              : 'ACTIVE RESPONSE'}
          </span>

          <h1>
            {emergency.type ||
              'Emergency'}
          </h1>

          <p>
            Request ID: {emergencyId}
          </p>

        </section>


        {/* ================= LOCATION ================= */}

        <section className="response-location-card">

          <div className="card-heading">

            <span className="heading-icon">
              📍
            </span>

            <strong>
              REQUESTER LOCATION
            </strong>

          </div>

          <div className="location-address">

            <strong>
              {emergency.location?.address ||
                'GPS location available'}
            </strong>

            <span>
              Requester location received
            </span>

          </div>


          {/* Map */}

          <div className="response-map">

            <div className="map-road response-road-one"></div>

            <div className="map-road response-road-two"></div>

            <div className="map-road response-road-three"></div>

            <div className="map-route"></div>

            <div className="requester-marker">
              📍
            </div>

            <div className="responder-marker">
              🚗
            </div>

          </div>


          <button
            type="button"
            className="navigation-button"
            onClick={handleOpenNavigation}
          >
            🗺️ OPEN NAVIGATION
          </button>

        </section>


        {/* ================= ETA ================= */}

        <section className="eta-card">

          <div className="eta-icon">
            🚗
          </div>

          <div>

            <span>
              ESTIMATED ARRIVAL
            </span>

            <strong>
              --
            </strong>

          </div>

          <div className="eta-status">
            {responseStatus === 'arrived'
              ? 'ARRIVED'
              : 'EN ROUTE'}
          </div>

        </section>


        {/* ================= EMERGENCY DETAILS ================= */}

        <section className="ai-response-card">

          <div className="card-heading">

            <span className="heading-icon">
              ✦
            </span>

            <strong>
              EMERGENCY DETAILS
            </strong>

          </div>

          <p>
            {emergency.description ||
              'Emergency assistance required.'}
          </p>

          <div className="analysis-placeholder">

            <span>
              AI ANALYSIS
            </span>

            <small>
              Additional AI analysis will be
              displayed here when available.
            </small>

          </div>

        </section>


        {/* ================= REQUESTER ================= */}

        <section className="requester-card">

          <div className="card-heading">

            <span className="heading-icon">
              👤
            </span>

            <strong>
              REQUESTER
            </strong>

          </div>

          <div className="requester-info">

            <div className="requester-avatar">
              ?
            </div>

            <div>

              <strong>
                Emergency Requester
              </strong>

              <span>
                Identity protected
              </span>

            </div>

            <button
              type="button"
              className="call-button"
              onClick={handleCallRequester}
            >
              📞
            </button>

          </div>

          <p className="contact-note">
            Contact the requester if additional
            information is required.
          </p>

        </section>


        {/* ================= STATUS ================= */}

        <section className="arrival-status">

          <div className="status-line">

            <span
              className={
                responseStatus === 'arrived'
                  ? 'status-dot arrived'
                  : 'status-dot'
              }
            ></span>

            <div>

              <strong>
                {responseStatus === 'arrived'
                  ? 'You have arrived'
                  : 'You are responding'}
              </strong>

              <p>
                {responseStatus === 'arrived'
                  ? 'Requester location reached. Response is now active on site.'
                  : 'Keep navigation active while travelling to the requester.'}
              </p>

            </div>

          </div>

        </section>


        {/* ================= ACTIONS ================= */}

        <section className="response-actions">

          {responseStatus === 'responding' && (

            <button
              type="button"
              className="arrived-button"
              onClick={handleMarkArrived}
            >
              ✓ MARK AS ARRIVED
            </button>

          )}

          {responseStatus === 'arrived' && (

            <button
              type="button"
              className="complete-button complete-full"
              onClick={handleCompleteResponse}
            >
              ✓ COMPLETE RESPONSE
            </button>

          )}

        </section>


        <p className="response-disclaimer">

          Your live location may be shared with the
          requester while the response is active.

        </p>

      </div>


      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="response-bottom-navigation">

        <button type="button">

          <span>
            ⚠
          </span>

          <small>
            Alerts
          </small>

        </button>

        <button
          type="button"
          className="active"
        >

          <span>
            🗺
          </span>

          <small>
            Response
          </small>

        </button>

        <button type="button">

          <span>
            ⚙
          </span>

          <small>
            Settings
          </small>

        </button>

      </nav>

    </main>
  );
}

export default ActiveResponse;