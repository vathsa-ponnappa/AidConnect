import '../styles/Splash.css';
import logo from '../assets/splash-logo.png';

function Splash() {
  return (
    <main className="splash-screen">
      <div className="splash-glow splash-glow-blue"></div>
      <div className="splash-glow splash-glow-red"></div>

      <div className="splash-content">
        <div className="logo-container">
          <img
            src={logo}
            alt="AidConnect"
            className="splash-logo"
          />
        </div>
      </div>
    </main>
  );
}

export default Splash;