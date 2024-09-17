import React, { useState } from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';
import axios from 'axios';
import { FaPlay, FaStop } from 'react-icons/fa';
import './AudioRecorder.css'

const AudioRecorder = () => {
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);

  const handleStop = async (blobUrl) => {
    try {
      const response = await fetch(blobUrl);
      const audioBlob = await response.blob();

      // Prepare form data
      const formData = new FormData();
      formData.append('file', audioBlob, 'recordedAudio.wav');

      // Send audio file to Azure Function
      const result = await axios.post(
        'http://localhost:7071/api/processAudio',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setAnswer(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="audio-recorder-container">
      <h1>Real-Time Audio Q&A Assistant</h1>

      <ReactMediaRecorder
        audio
        onStop={(blobUrl) => {
          handleStop(blobUrl);
          setMediaBlobUrl(blobUrl);
        }}
        render={({ startRecording, stopRecording, mediaBlobUrl }) => (
          <div>
            <button
              className={`icon-button ${isRecording ? 'stop' : 'start'}`}
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                  setIsRecording(true);
                }
              }}
            >
              {isRecording ? <FaStop size={24} /> : <FaPlay size={24} />}
            </button>

            {isRecording && (
              <div className="sound-wave">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            )}
          </div>
        )}
      />


      {mediaBlobUrl && (
        <div className="results">
          <h3>Question:</h3>
          {mediaBlobUrl && (
            <div className="audio-container">
              <audio src={mediaBlobUrl} controls />
            </div>
          )}
          <h3>Suggested Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
