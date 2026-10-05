import { useEffect, useState } from 'react';

import Splash from './screens/Splash';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Home from './screens/Home';
import FindingHelp from './screens/FindingHelp';
import ResponderHome from './screens/ResponderHome';
import ActiveResponse from './screens/ActiveResponse';
import ActiveRequest from './screens/ActiveRequest';

function App() {
  // Splash is ALWAYS the first screen
  const [showSplash, setShowSplash] = useState(true);

  // Screen shown AFTER splash
  const [currentScreen, setCurrentScreen] =
    useState(null);

  const [emergency, setEmergency] =
    useState(null);

  const [responseEmergency, setResponseEmergency] =
    useState(null);

  // =========================
  // SPLASH
  // =========================

  useEffect(() => {
    const timer = setTimeout(() => {
      const token =
        localStorage.getItem('aidconnect_token');

      if (token) {
        setCurrentScreen('home');
      } else {
        setCurrentScreen('login');
      }

      setShowSplash(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // =========================
  // ALWAYS SHOW SPLASH FIRST
  // =========================

  if (showSplash) {
    return <Splash />;
  }

  // =========================
  // LOGIN
  // =========================

  if (currentScreen === 'login') {
    return (
      <Login
        onLoginSuccess={() =>
          setCurrentScreen('home')
        }
        onSignup={() =>
          setCurrentScreen('signup')
        }
      />
    );
  }

  // =========================
  // SIGNUP
  // =========================

  if (currentScreen === 'signup') {
    return (
      <Signup
        onLogin={() =>
          setCurrentScreen('login')
        }
      />
    );
  }

  // =========================
  // HOME
  // =========================

  if (currentScreen === 'home') {
    return (
      <>
        {/* =========================
            TEMPORARY TEST BUTTONS
        ========================= */}

        {/* Test Responder Home */}
        <button
          onClick={() =>
            setCurrentScreen('responderHome')
          }
          style={{
            position: 'fixed',
            top: '130px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 14px',
            border: 'none',
            borderRadius: '10px',
            background: '#1d4ed8',
            color: '#fff',
            fontWeight: '700',
            fontSize: '12px',
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          TEST RESPONDER
        </button>

        {/* Test Active Request */}
        <button
          onClick={() =>
            setCurrentScreen('activeRequest')
          }
          style={{
            position: 'fixed',
            top: '185px',
            right: '20px',
            zIndex: 9999,
            padding: '10px 14px',
            border: 'none',
            borderRadius: '10px',
            background: '#536fe5',
            color: '#fff',
            fontWeight: '700',
            fontSize: '12px',
            boxShadow:
              '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          TEST ACTIVE REQUEST
        </button>

        {/* =========================
            HOME SCREEN
        ========================= */}

        <Home
          onEmergencyCreated={(
            createdEmergency
          ) => {
            setEmergency(
              createdEmergency
            );

            setCurrentScreen(
              'findingHelp'
            );
          }}
        />
      </>
    );
  }

  // =========================
  // FINDING HELP
  // =========================

  if (
    currentScreen === 'findingHelp'
  ) {
    return (
      <FindingHelp
        emergency={emergency}
        onCancel={() =>
          setCurrentScreen('home')
        }
      />
    );
  }

  // =========================
  // ACTIVE REQUEST
  // =========================

  if (
    currentScreen === 'activeRequest'
  ) {
    return (
      <ActiveRequest
        emergency={emergency}
        onCancel={() =>
          setCurrentScreen('home')
        }
      />
    );
  }

  // =========================
  // RESPONDER HOME
  // =========================

  if (
    currentScreen === 'responderHome'
  ) {
    return (
      <ResponderHome
        onStartResponse={(
          acceptedEmergency
        ) => {
          setResponseEmergency(
            acceptedEmergency
          );

          setCurrentScreen(
            'activeResponse'
          );
        }}
      />
    );
  }

  // =========================
  // ACTIVE RESPONSE
  // =========================

  if (
    currentScreen === 'activeResponse'
  ) {
    return (
      <ActiveResponse
        emergency={
          responseEmergency
        }
      />
    );
  }

  return null;
}

export default App;