import { useState } from 'react';
import '../Styles/Signup.css';
import logo from '../assets/splash-logo.png';

function Signup({ onLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',

    emergencyContact1: {
      name: '',
      mobile: '',
      relationship: '',
    },

    emergencyContact2: {
      name: '',
      mobile: '',
      relationship: '',
    },
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleContactChange = (contactNumber, event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [contactNumber]: {
        ...previousData[contactNumber],
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage('');
    setError('');

    const {
      fullName,
      email,
      mobile,
      password,
      confirmPassword,
      emergencyContact1,
      emergencyContact2,
    } = formData;

    // Password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Emergency contact validation
    if (
      !emergencyContact1.name ||
      !emergencyContact1.mobile ||
      !emergencyContact1.relationship ||
      !emergencyContact2.name ||
      !emergencyContact2.mobile ||
      !emergencyContact2.relationship
    ) {
      setError('Please complete both emergency contacts');
      return;
    }

    // Prevent duplicate emergency contacts
    if (
      emergencyContact1.mobile.trim() ===
      emergencyContact2.mobile.trim()
    ) {
      setError(
        'Emergency contacts must have different mobile numbers'
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        'http://10.0.2.2:5000/api/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName,
            email,
            mobile,
            password,

            emergencyContacts: [
              emergencyContact1,
              emergencyContact2,
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || 'Unable to create account'
        );
        return;
      }

      setMessage(data.message);

      setFormData({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',

        emergencyContact1: {
          name: '',
          mobile: '',
          relationship: '',
        },

        emergencyContact2: {
          name: '',
          mobile: '',
          relationship: '',
        },
      });

      console.log('Account created:', data.user);
    } catch (error) {
      console.error(
        'Signup request failed:',
        error
      );

      setError(
        'Unable to connect to the server'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="signup-screen">

      {/* Background decoration */}
      <div className="signup-glow signup-glow-blue"></div>
      <div className="signup-glow signup-glow-red"></div>

      <div className="signup-container">

        {/* Logo */}
        <div className="signup-brand">
          <img
            src={logo}
            alt="AidConnect"
            className="signup-logo"
          />
        </div>

        {/* Heading */}
        <div className="signup-heading">
          <h1>Create Account</h1>

          <p>
            Join AidConnect and stay connected with help.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* =========================================
              PERSONAL DETAILS CARD
          ========================================== */}

          <section className="signup-card signup-section-card">

            <div className="signup-section-heading">
              <div className="signup-section-icon">
                👤
              </div>

              <div>
                <h2>Personal Details</h2>

                <p>
                  Enter your basic account information.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">
                Mobile Number
              </label>

              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="Enter your mobile number"
                value={formData.mobile}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

          </section>


          {/* =========================================
              EMERGENCY CONTACTS CARD
          ========================================== */}

          <section className="signup-card emergency-contacts-card">

            <div className="signup-section-heading">
              <div className="signup-section-icon emergency-icon">
                🆘
              </div>

              <div>
                <h2>Emergency Contacts</h2>

                <p>
                  Add two trusted people who can be
                  notified when you need help.
                </p>
              </div>
            </div>


            {/* CONTACT 1 */}

            <div className="contact-block">

              <div className="contact-block-header">
                <span className="contact-number">
                  01
                </span>

                <span>
                  Emergency Contact 1
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="contact1Name">
                  Contact Name
                </label>

                <input
                  type="text"
                  id="contact1Name"
                  name="name"
                  placeholder="Enter contact name"
                  value={
                    formData.emergencyContact1.name
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact1',
                      event
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact1Mobile">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  id="contact1Mobile"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={
                    formData.emergencyContact1.mobile
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact1',
                      event
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact1Relationship">
                  Relationship
                </label>

                <select
                  id="contact1Relationship"
                  name="relationship"
                  value={
                    formData.emergencyContact1
                      .relationship
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact1',
                      event
                    )
                  }
                  required
                >
                  <option value="">
                    Select relationship
                  </option>

                  <option value="Mother">
                    Mother
                  </option>

                  <option value="Father">
                    Father
                  </option>

                  <option value="Brother">
                    Brother
                  </option>

                  <option value="Sister">
                    Sister
                  </option>

                  <option value="Spouse">
                    Spouse
                  </option>

                  <option value="Friend">
                    Friend
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

            </div>


            {/* CONTACT 2 */}

            <div className="contact-block">

              <div className="contact-block-header">
                <span className="contact-number">
                  02
                </span>

                <span>
                  Emergency Contact 2
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="contact2Name">
                  Contact Name
                </label>

                <input
                  type="text"
                  id="contact2Name"
                  name="name"
                  placeholder="Enter contact name"
                  value={
                    formData.emergencyContact2.name
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact2',
                      event
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact2Mobile">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  id="contact2Mobile"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={
                    formData.emergencyContact2.mobile
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact2',
                      event
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact2Relationship">
                  Relationship
                </label>

                <select
                  id="contact2Relationship"
                  name="relationship"
                  value={
                    formData.emergencyContact2
                      .relationship
                  }
                  onChange={(event) =>
                    handleContactChange(
                      'emergencyContact2',
                      event
                    )
                  }
                  required
                >
                  <option value="">
                    Select relationship
                  </option>

                  <option value="Mother">
                    Mother
                  </option>

                  <option value="Father">
                    Father
                  </option>

                  <option value="Brother">
                    Brother
                  </option>

                  <option value="Sister">
                    Sister
                  </option>

                  <option value="Spouse">
                    Spouse
                  </option>

                  <option value="Friend">
                    Friend
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

            </div>

          </section>


          {/* Error / Success */}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {message && (
            <p className="form-success">
              {message}
            </p>
          )}


          {/* Create Account */}

          <button
            type="submit"
            className="create-account-button"
            disabled={isLoading}
          >
            {isLoading
              ? 'Creating Account...'
              : 'Create Account'}
          </button>

        </form>


        {/* Login */}

        <p className="login-link">
          Already have an account?{' '}

          <span onClick={onLogin}>
            Login
          </span>
        </p>

      </div>
    </main>
  );
}

export default Signup;