import '../Styles/Home.css';
import logo from '../assets/splash-logo.png';
import { Geolocation } from '@capacitor/geolocation';
import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'https://aidconnect-l105.onrender.com';

function Home({ onEmergencyCreated }) {

  // =========================
  // LOCATION STATE
  // =========================

  const [location, setLocation] = useState(null);

  const [locationName, setLocationName] = useState(
    'Getting your location...'
  );

  const [locationLoading, setLocationLoading] = useState(true);

  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);


  // =========================
  // RESPONDER STATE
  // =========================

  const [responders, setResponders] = useState([]);

  const [respondersLoading, setRespondersLoading] =
    useState(true);


  // =========================
  // SOS LONG PRESS STATE
  // =========================

  const sosTimerRef = useRef(null);

  const [sosHolding, setSosHolding] = useState(false);

  const [sosCountdown, setSosCountdown] = useState(0);

  const sosCountdownTimerRef = useRef(null);


  // =========================================================
  // GET READABLE LOCATION NAME
  // =========================================================

  const getLocationName = async (latitude, longitude) => {

    try {

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      const address = data.address || {};

      const locationParts = [
        address.road,
        address.neighbourhood,
        address.suburb,
        address.city ||
        address.town ||
        address.village
      ].filter(Boolean);


      if (locationParts.length > 0) {

        setLocationName(
          locationParts
            .slice(0, 2)
            .join(', ')
        );

      } else {

        setLocationName('Current location');

      }

    } catch (error) {

      console.error(
        'Address lookup failed:',
        error
      );

      setLocationName('Current location');

    }

  };


  // =========================================================
  // GET CURRENT DEVICE LOCATION
  // =========================================================

  const getCurrentLocation = async () => {

    try {

      setLocationLoading(true);

      setLocationPermissionDenied(false);


      // -----------------------------------------
      // CHECK LOCATION PERMISSION
      // -----------------------------------------

      let permissions =
        await Geolocation.checkPermissions();


      console.log(
        'Location permission:',
        permissions.location
      );


      // -----------------------------------------
      // REQUEST PERMISSION IF NEEDED
      // -----------------------------------------

      if (
        permissions.location !== 'granted'
      ) {

        permissions =
          await Geolocation.requestPermissions();


        console.log(
          'Requested location permission:',
          permissions.location
        );

      }


      // -----------------------------------------
      // PERMISSION DENIED
      // -----------------------------------------

      if (
        permissions.location !== 'granted'
      ) {

        console.error(
          'Location permission denied'
        );


        setLocationPermissionDenied(true);

        setLocationLoading(false);

        setLocationName(
          'Location permission required'
        );


        return null;

      }


      // -----------------------------------------
      // GET GPS LOCATION
      // -----------------------------------------

      const position =
        await Geolocation.getCurrentPosition({

          enableHighAccuracy: true,

          timeout: 15000,

          maximumAge: 5000,

        });


      const latitude =
        position.coords.latitude;


      const longitude =
        position.coords.longitude;


      const currentLocation = {

        latitude,

        longitude,

      };


      console.log(
        'Current coordinates:',
        currentLocation
      );


      // -----------------------------------------
      // SAVE LOCATION
      // -----------------------------------------

      setLocation(
        currentLocation
      );


      // -----------------------------------------
      // GET READABLE ADDRESS
      // -----------------------------------------

      await getLocationName(
        latitude,
        longitude
      );


      setLocationLoading(false);


      return currentLocation;


    } catch (error) {

      console.error(
        'Location error:',
        error
      );


      setLocationLoading(false);


      setLocationName(
        'Unable to get location'
      );


      return null;

    }

  };


  // =========================================================
  // LOAD NEARBY RESPONDERS
  // =========================================================

  const loadNearbyResponders = async (
    currentLocation
  ) => {

    if (!currentLocation) {

      setResponders([]);

      setRespondersLoading(false);

      return;

    }


    const token =
      localStorage.getItem(
        'aidconnect_token'
      );


    if (!token) {

      console.error(
        'No authentication token found'
      );


      setResponders([]);

      setRespondersLoading(false);

      return;

    }


    try {

      setRespondersLoading(true);


      /*
       * Expected backend endpoint:
       *
       * GET /api/responders/nearby
       *
       * Query:
       * latitude
       * longitude
       */


      const response = await fetch(

        `${API_BASE_URL}/api/responders/nearby?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}`,

        {

          method: 'GET',

          headers: {

            Authorization:
              `Bearer ${token}`,

          },

        }

      );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          'Nearby responders request failed:',
          data
        );


        setResponders([]);

        return;

      }


      const responderList =
        Array.isArray(data.responders)
          ? data.responders
          : [];


      setResponders(
        responderList
      );


      console.log(
        'Nearby responders:',
        responderList
      );


    } catch (error) {

      console.error(
        'Unable to load nearby responders:',
        error
      );


      setResponders([]);

    } finally {

      setRespondersLoading(false);

    }

  };


  // =========================================================
  // INITIAL LOCATION
  // =========================================================

  useEffect(() => {

    const initializeHome =
      async () => {

        const currentLocation =
          await getCurrentLocation();


        if (currentLocation) {

          await loadNearbyResponders(
            currentLocation
          );

        } else {

          setRespondersLoading(false);

        }

      };


    initializeHome();

  }, []);


  // =========================================================
  // SOS
  // =========================================================

  const handleSOS = async () => {

    const token =
      localStorage.getItem(
        'aidconnect_token'
      );


    if (!token) {

      alert(
        'Please login again.'
      );

      return;

    }


    // -----------------------------------------
    // USE EXISTING LOCATION
    // -----------------------------------------

    let currentLocation =
      location;


    // -----------------------------------------
    // GET LOCATION AGAIN IF NECESSARY
    // -----------------------------------------

    if (!currentLocation) {

      currentLocation =
        await getCurrentLocation();

    }


    // -----------------------------------------
    // LOCATION STILL UNAVAILABLE
    // -----------------------------------------

    if (!currentLocation) {

      alert(
        'Location permission is required to send an emergency request.'
      );

      return;

    }


    try {

      console.log(
        'Sending SOS with location:',
        currentLocation
      );


      const response =
        await fetch(

          `${API_BASE_URL}/api/emergencies`,

          {

            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,

            },

            body: JSON.stringify({

              type: 'Emergency',

              latitude:
                currentLocation.latitude,

              longitude:
                currentLocation.longitude,

              address:
                locationName,

              description:
                'Emergency assistance required',

            }),

          }

        );


      const data =
        await response.json();


      if (!response.ok) {

        console.error(
          'Emergency creation failed:',
          data
        );


        alert(
          data.message ||
          'Unable to create emergency'
        );


        return;

      }


      console.log(
        'Emergency created successfully:',
        data.emergency
      );


      // -----------------------------------------
      // MOVE TO FINDING HELP SCREEN
      // -----------------------------------------

      if (onEmergencyCreated) {

        onEmergencyCreated(
          data.emergency
        );

      }


    } catch (error) {

      console.error(
        'Emergency request failed:',
        error
      );


      alert(
        'Unable to connect to the AidConnect server.'
      );

    }

  };


  // =========================================================
  // SOS LONG PRESS HANDLERS
  // =========================================================

  const startSOSPress = () => {

    // Prevent multiple timers
    if (sosTimerRef.current) {
      return;
    }


    console.log(
      'SOS button pressed - hold for 3 seconds'
    );


    setSosHolding(true);

    setSosCountdown(3);


    // -----------------------------------------
    // VISUAL COUNTDOWN
    // -----------------------------------------

    let remaining = 3;


    sosCountdownTimerRef.current =
      setInterval(() => {

        remaining -= 1;

        if (remaining > 0) {

          setSosCountdown(
            remaining
          );

        }

      }, 1000);


    // -----------------------------------------
    // 3 SECOND SOS TIMER
    // -----------------------------------------

    sosTimerRef.current =
      setTimeout(async () => {

        console.log(
          'SOS 3-second hold completed'
        );


        // Stop countdown
        if (sosCountdownTimerRef.current) {

          clearInterval(
            sosCountdownTimerRef.current
          );

          sosCountdownTimerRef.current = null;

        }


        setSosHolding(false);

        setSosCountdown(0);


        sosTimerRef.current = null;


        // TRIGGER REAL SOS
        await handleSOS();

      }, 3000);

  };


  const cancelSOSPress = () => {

    // If the SOS already triggered,
    // there is nothing to cancel.
    if (!sosTimerRef.current) {

      setSosHolding(false);

      return;

    }


    console.log(
      'SOS hold cancelled'
    );


    clearTimeout(
      sosTimerRef.current
    );


    sosTimerRef.current = null;


    if (sosCountdownTimerRef.current) {

      clearInterval(
        sosCountdownTimerRef.current
      );

      sosCountdownTimerRef.current = null;

    }


    setSosHolding(false);

    setSosCountdown(0);

  };


  // =========================================================
  // CLEAN UP SOS TIMERS
  // =========================================================

  useEffect(() => {

    return () => {

      if (sosTimerRef.current) {

        clearTimeout(
          sosTimerRef.current
        );

      }


      if (sosCountdownTimerRef.current) {

        clearInterval(
          sosCountdownTimerRef.current
        );

      }

    };

  }, []);


  // =========================================================
  // OTHER ACTIONS
  // =========================================================

  const handleSilentText = () => {

    console.log(
      'Silent text selected'
    );

  };


  const handleAlertAll = () => {

    console.log(
      'Alerting nearby responders'
    );

  };


  const handleViewMap = () => {

    console.log(
      'Opening responder map'
    );

  };


  const handleEmergencyContacts = () => {

    console.log(
      'Opening emergency contacts'
    );

  };


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <main className="home-screen">


      {/* ================= HEADER ================= */}

      <header className="home-header">

        <div className="app-brand">

          <img
            src={logo}
            alt="AidConnect"
            className="home-logo"
          />


          <div className="brand-text">

            <strong>
              AidConnect
            </strong>

            <span>
              Emergency assistance
            </span>

          </div>

        </div>


        <div className="header-actions">

          <span className="secure-status">
            ● Secure
          </span>


          <button
            type="button"
            className="header-icon-button"
            aria-label="Notifications"
          >
            🔔
          </button>


          <button
            type="button"
            className="header-icon-button"
            aria-label="Profile"
          >
            👤
          </button>

        </div>

      </header>


      {/* ================= CURRENT LOCATION ================= */}

      <section className="location-section">

        <div className="location-info">

          <div className="location-icon">
            📍
          </div>


          <div className="location-text">

            <small>
              Current Location
            </small>


            <p>

              {locationLoading

                ? 'Getting your location...'

                : locationName}

            </p>

          </div>

        </div>


        <span
          className="gps-status"
          style={{
            color:
              location
                ? undefined
                : '#d64545'
          }}
        >

          {location

            ? 'GPS Active'

            : locationPermissionDenied

              ? 'Permission Off'

              : 'GPS Off'}

        </span>

      </section>


      {/* ================= EMERGENCY ASSISTANCE ================= */}

      <section className="emergency-section">

        <div className="emergency-heading">

          <span className="emergency-badge">
            EMERGENCY
          </span>


          <h1>
            Need immediate help?
          </h1>


          <p className="emergency-description">

            Press and hold the button for 3 seconds
            to alert nearby responders.

          </p>

        </div>


        {/* ================= SOS BUTTON ================= */}

        <button

          type="button"

          className={`sos-button ${
            sosHolding
              ? 'sos-button-holding'
              : ''
          }`}

          onMouseDown={
            startSOSPress
          }

          onMouseUp={
            cancelSOSPress
          }

          onMouseLeave={
            cancelSOSPress
          }

          onTouchStart={
            startSOSPress
          }

          onTouchEnd={
            cancelSOSPress
          }

          onTouchCancel={
            cancelSOSPress
          }

          onContextMenu={(event) => {
            event.preventDefault();
          }}

        >

          <span className="sos-symbol">
            ⚠
          </span>


          <strong>

            {sosHolding

              ? sosCountdown

              : 'SOS'}

          </strong>


          <small>

            {sosHolding

              ? 'KEEP HOLDING...'

              : 'HOLD FOR 3 SECONDS'}

          </small>

        </button>


        <div className="dispatch-status">

          <span className="dispatch-dot"></span>

          Immediate dispatch enabled

        </div>

      </section>


      {/* ================= SILENT TEXT ================= */}

      <section className="alternative-assistance">

        <button
          type="button"
          onClick={handleSilentText}
          className="silent-text-button"
        >

          <span className="silent-icon">
            💬
          </span>


          <span className="silent-text-content">

            <strong>
              Silent Text
            </strong>


            <small>
              Request help without speaking
            </small>

          </span>


          <span className="arrow">
            →
          </span>

        </button>

      </section>


      {/* ================= NEARBY RESPONDERS ================= */}

      <section className="responders-section">

        <div className="section-header">

          <div>

            <h2>
              Nearby Responders
            </h2>


            <p>
              People who can help near you
            </p>

          </div>


          <button
            type="button"
            onClick={handleViewMap}
            className="view-map-button"
          >
            MAP →
          </button>

        </div>


        <div className="responders-card">

          <div className="responder-info">

            <div className="responder-avatars">

              {responders.length > 0 ? (

                responders
                  .slice(0, 2)
                  .map(
                    (responder, index) => (

                      <span

                        key={
                          responder._id ||
                          responder.id ||
                          index
                        }

                      >

                        👤

                      </span>

                    )
                  )

              ) : (

                <>

                  <span>
                    👨‍🚒
                  </span>

                  <span>
                    👨‍⚕️
                  </span>

                </>

              )}

            </div>


            <div className="responder-count">

              <strong>

                {respondersLoading

                  ? 'Finding responders...'

                  : `${responders.length} Verified Responders`}

              </strong>


              <p>

                {respondersLoading

                  ? 'Checking your area'

                  : 'Within 2.5 miles of you'}

              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleAlertAll}
            className="alert-all-button"
            disabled={
              responders.length === 0
            }
          >

            ALERT ALL

          </button>

        </div>

      </section>


      {/* ================= EMERGENCY CONTACTS ================= */}

      <button
        type="button"
        className="emergency-contacts"
        onClick={handleEmergencyContacts}
      >

        <span>
          📞
        </span>


        <span>
          Manage Emergency Contacts
        </span>


        <span className="contacts-arrow">
          →
        </span>

      </button>


      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-navigation">

        <button
          type="button"
          className="nav-item active"
        >

          <span>
            ⚠
          </span>

          <small>
            SOS
          </small>

        </button>


        <button
          type="button"
          className="nav-item"
        >

          <span>
            🗺
          </span>

          <small>
            Map
          </small>

        </button>


        <button
          type="button"
          className="nav-item"
        >

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

export default Home;