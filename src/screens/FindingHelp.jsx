import { useEffect, useRef, useState } from 'react';
import '../Styles/FindingHelp.css';

const API_BASE_URL = 'https://aidconnect-l105.onrender.com';

function FindingHelp({ emergency, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  // Voice upload / AI states
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [voiceUploadMessage, setVoiceUploadMessage] = useState('');

  // Cancel states
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  // Prevent duplicate uploads
  const uploadStartedRef = useRef(false);

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(recordingTimeoutRef.current);

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // =========================
  // UPLOAD VOICE NOTE
  // =========================

  const uploadVoiceNote = async (blob) => {
    if (!blob) {
      console.log('No voice recording available');
      return;
    }

    if (!emergency?.id) {
      console.error('Emergency ID is missing');

      alert(
        'Emergency ID is missing. Please try again.'
      );

      return;
    }

    const token = localStorage.getItem(
      'aidconnect_token'
    );

    if (!token) {
      console.error(
        'Authentication token is missing'
      );

      alert(
        'Authentication token is missing. Please login again.'
      );

      return;
    }

    // Prevent duplicate upload
    if (uploadStartedRef.current) {
      return;
    }

    uploadStartedRef.current = true;

    try {
      setIsUploading(true);
      setVoiceUploadMessage('');
      setAiAnalysis(null);
      setAiStatus(null);

      const formData = new FormData();

      formData.append(
        'voiceNote',
        blob,
        'emergency-voice-note.webm'
      );

      console.log(
        'Uploading voice note automatically...'
      );

      const response = await fetch(
        `${API_BASE_URL}/api/emergencies/${emergency.id}/voice`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data = await response.json();

      console.log(
        'Voice upload response:',
        data
      );

      if (!response.ok) {
        console.error(
          'Voice upload failed:',
          data
        );

        setVoiceUploadMessage(
          data.message ||
            'Unable to upload voice note'
        );

        return;
      }

      // =========================
      // VOICE UPLOAD SUCCESS
      // =========================

      setVoiceUploadMessage(
        data.message ||
          'Voice note sent successfully'
      );

      // =========================
      // AI ANALYSIS AVAILABLE
      // =========================

      if (data.aiAnalysis) {
        setAiAnalysis(
          data.aiAnalysis
        );

        setAiStatus('available');

        console.log(
          'AI analysis received:',
          data.aiAnalysis
        );
      }

      // =========================
      // AI TEMPORARILY UNAVAILABLE
      // =========================

      else if (
        data.aiStatus === 'unavailable'
      ) {
        setAiStatus('unavailable');

        console.log(
          'AI analysis is temporarily unavailable.'
        );
      }

      // =========================
      // UNKNOWN AI STATUS
      // =========================

      else {
        setAiStatus('unknown');

        console.log(
          'Voice uploaded but AI status was not provided.'
        );
      }
    } catch (error) {
      console.error(
        'Voice upload request failed:',
        error
      );

      setVoiceUploadMessage(
        'Unable to connect to the server'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // =========================
  // START RECORDING
  // =========================

  const startRecording = async () => {
    if (isRecording || isUploading) {
      return;
    }

    try {
      setVoiceUploadMessage('');
      setAiAnalysis(null);
      setAiStatus(null);
      setAudioBlob(null);

      uploadStartedRef.current = false;

      // Request microphone permission
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      console.log(
        'Microphone permission granted'
      );

      // =========================
      // MEDIA RECORDER
      // =========================

      let mimeType = 'audio/webm';

      if (
        MediaRecorder.isTypeSupported(
          'audio/webm;codecs=opus'
        )
      ) {
        mimeType =
          'audio/webm;codecs=opus';
      } else if (
        MediaRecorder.isTypeSupported(
          'audio/webm'
        )
      ) {
        mimeType = 'audio/webm';
      } else {
        mimeType = '';
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      const audioChunks = [];

      // =========================
      // AUDIO DATA
      // =========================

      mediaRecorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // =========================
      // RECORDING STOPPED
      // =========================

      mediaRecorder.onstop = async () => {
        console.log(
          '5-second voice recording completed'
        );

        clearInterval(timerRef.current);
        clearTimeout(
          recordingTimeoutRef.current
        );

        setIsRecording(false);
        setRecordingTime(5);

        // Stop microphone
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        // Create audio blob
        const finalBlob = new Blob(
          audioChunks,
          {
            type:
              mimeType || 'audio/webm',
          }
        );

        console.log(
          'Audio blob created:',
          finalBlob
        );

        console.log(
          'Audio size:',
          finalBlob.size,
          'bytes'
        );

        setAudioBlob(finalBlob);

        // =========================
        // AUTOMATIC UPLOAD
        // =========================

        await uploadVoiceNote(
          finalBlob
        );
      };

      // =========================
      // RECORDING ERROR
      // =========================

      mediaRecorder.onerror = (
        event
      ) => {
        console.error(
          'MediaRecorder error:',
          event
        );

        clearInterval(
          timerRef.current
        );

        clearTimeout(
          recordingTimeoutRef.current
        );

        setIsRecording(false);

        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      };

      // =========================
      // START
      // =========================

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      console.log(
        'Voice recording started'
      );

      // =========================
      // COUNTDOWN
      // =========================

      timerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previousTime) => {
              if (previousTime >= 4) {
                return 5;
              }

              return previousTime + 1;
            }
          );
        }, 1000);

      // =========================
      // AUTO STOP AFTER 5 SECONDS
      // =========================

      recordingTimeoutRef.current =
        setTimeout(() => {
          console.log(
            '5 seconds completed. Stopping recording...'
          );

          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current
              .state !== 'inactive'
          ) {
            mediaRecorderRef.current.stop();
          }
        }, 5000);
    } catch (error) {
      console.error(
        'Microphone access failed:',
        error
      );

      setIsRecording(false);

      alert(
        'Microphone access is required to record a voice note.'
      );
    }
  };

  // =========================
  // MANUAL STOP
  // =========================

  const stopRecording = () => {
    clearInterval(timerRef.current);
    clearTimeout(
      recordingTimeoutRef.current
    );

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // =========================
  // CANCEL EMERGENCY
  // =========================

  const handleCancel = async () => {
    if (!emergency?.id) {
      console.error(
        'Emergency ID is missing'
      );

      return;
    }

    const token = localStorage.getItem(
      'aidconnect_token'
    );

    if (!token) {
      console.error(
        'Authentication token is missing'
      );

      return;
    }

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    try {
      setIsCancelling(true);
      setCancelMessage('');

      const response = await fetch(
        `${API_BASE_URL}/api/emergencies/${emergency.id}/cancel`,
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
        console.error(
          'Cancel request failed:',
          data
        );

        alert(
          data.message ||
            'Unable to cancel emergency'
        );

        return;
      }

      console.log(
        'Emergency cancelled successfully:',
        data
      );

      setCancelMessage(
        'Emergency request cancelled successfully'
      );

      setTimeout(() => {
        if (onCancel) {
          onCancel();
        }
      }, 1200);
    } catch (error) {
      console.error(
        'Cancel request failed:',
        error
      );

      alert(
        'Unable to connect to the server'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <main className="finding-help-screen">

      {/* HEADER */}
      <header className="finding-help-header">

        <div className="app-name">

          <div className="app-icon">
            AC
          </div>

          <div>
            <span className="app-title">
              AidConnect
            </span>

            <span className="app-subtitle">
              Emergency Assistance
            </span>
          </div>

        </div>

        <span className="searching-status">

          <span className="status-dot"></span>

          SEARCHING

        </span>

      </header>

      {/* MAIN CONTENT */}
      <section className="finding-help-content">

        {/* SEARCH ICON */}
        <div className="searching-icon-wrapper">

          <div className="searching-icon">
            🔎
          </div>

        </div>

        <p className="emergency-label">
          EMERGENCY REQUEST ACTIVE
        </p>

        <h1>
          Finding Help
        </h1>

        <p className="finding-description">
          We are searching for nearby verified
          responders who can assist you.
        </p>

        {/* SEARCH STATUS */}
        <div className="search-status-card">

          <div className="loading-indicator"></div>

          <div className="status-content">

            <strong>
              Searching nearby responders
            </strong>

            <p>
              Official responders and verified
              AidConnect users
            </p>

          </div>

        </div>

        {/* RESPONDER COUNT */}
        <div className="responder-count-card">

          <div className="responder-icon">
            👥
          </div>

          <div>

            <strong>
              10
            </strong>

            <span>
              verified responders nearby
            </span>

          </div>

        </div>

        {/* LOCATION */}
        {emergency?.address && (
          <div className="emergency-location-card">

            <div className="location-icon">
              📍
            </div>

            <div>

              <span>
                YOUR EMERGENCY LOCATION
              </span>

              <strong>
                {emergency.address}
              </strong>

            </div>

          </div>
        )}

        {/* VOICE SECTION */}
        <section className="voice-section">

          <p className="section-label">
            OPTIONAL VOICE NOTE
          </p>

          <h2>
            Tell us what happened
          </h2>

          <p className="voice-description">
            Record up to 5 seconds. Your voice
            note can help responders understand
            the situation faster.
          </p>

          {/* RECORDING CIRCLE */}
          <div
            className={`recording-circle ${
              isRecording
                ? 'recording-active'
                : ''
            }`}
          >

            {isRecording ? (
              <>
                <span className="recording-time">
                  {recordingTime}
                </span>

                <small>
                  SEC
                </small>
              </>
            ) : isUploading ? (
              <span className="microphone-icon">
                ⏳
              </span>
            ) : (
              <span className="microphone-icon">
                🎙️
              </span>
            )}

          </div>

          {/* RECORD BUTTON */}
          {!isRecording &&
            !audioBlob &&
            !isUploading && (

              <button
                type="button"
                className="record-button"
                onClick={
                  startRecording
                }
              >
                <span>
                  🎙
                </span>

                RECORD 5 SECONDS

              </button>
            )}

          {/* RECORDING BUTTON */}
          {isRecording && (

            <button
              type="button"
              className="stop-recording-button"
              onClick={
                stopRecording
              }
            >
              STOP RECORDING
            </button>

          )}

          {/* UPLOADING */}
          {isUploading && (

            <div className="voice-upload-status">

              <div className="loading-indicator"></div>

              <div>

                <strong>
                  Sending voice note...
                </strong>

                <p>
                  Your voice note is being
                  sent to AidConnect.
                </p>

              </div>

            </div>

          )}

          {/* UPLOAD SUCCESS */}
          {voiceUploadMessage &&
            !isUploading && (

              <div className="voice-upload-status">

                <span className="success-icon">
                  ✓
                </span>

                <div>

                  <strong>
                    Voice note sent
                  </strong>

                  <p>
                    {voiceUploadMessage}
                  </p>

                </div>

              </div>

            )}

          {/* AI ANALYSIS */}
          {aiStatus === 'available' &&
            aiAnalysis && (

              <div className="ai-analysis-card">

                <div className="ai-header">

                  <div className="ai-icon">
                    AI
                  </div>

                  <div>

                    <p className="section-label">
                      AI EMERGENCY ANALYSIS
                    </p>

                    <span>
                      Analysis complete
                    </span>

                  </div>

                </div>

                <div className="ai-severity">

                  <strong>
                    Severity
                  </strong>

                  <span>
                    {aiAnalysis.severity}
                  </span>

                </div>

                <div className="ai-summary">

                  <strong>
                    Summary
                  </strong>

                  <p>
                    {aiAnalysis.summary}
                  </p>

                </div>

              </div>

            )}

          {/* AI UNAVAILABLE */}
          {aiStatus === 'unavailable' && (

            <div className="ai-unavailable-message">

              <div className="ai-warning-icon">
                AI
              </div>

              <div>

                <strong>
                  Voice note uploaded
                </strong>

                <span>
                  AI analysis is temporarily
                  unavailable.
                </span>

              </div>

            </div>

          )}

        </section>

        {/* CANCEL SUCCESS */}
        {cancelMessage && (

          <p className="cancel-success-message">
            ✓ {cancelMessage}
          </p>

        )}

        {/* CANCEL */}
        <button
          type="button"
          className="cancel-request-button"
          onClick={handleCancel}
          disabled={
            isCancelling ||
            isUploading
          }
        >
          {isCancelling
            ? 'CANCELLING...'
            : 'CANCEL EMERGENCY REQUEST'}
        </button>

      </section>

    </main>
  );
}

export default FindingHelp;