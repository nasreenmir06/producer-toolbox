import { useState, useRef } from 'react';
import { Button, Group, Badge } from '@mantine/core';
import { Mic, Square, Download } from 'lucide-react';

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // if chunk updates, recording breaks due to re renders, 
  // so use refs for persistence when recording streamed audio
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

  const startCapture = async () => {
    // screen capture prompt so user can share the tab they want to record audio from
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      streamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 44100 }); // fun fact 44.1khz is the industry standard sample rate for high def audio
      audioContextRef.current = audioContext;

      // convert to audio node
      const source = audioContext.createMediaStreamSource(stream);
      // create output
      const destination = audioContext.createMediaStreamDestination();
      // hook them up together
      source.connect(destination);
      
      // set up recorder
      const recorder = new MediaRecorder(destination.stream);
      // save audio
      mediaRecorderRef.current = recorder;
      // clear out old audio
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // stich chunks into file
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        // decode back to raw audio
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        // convert to wav (my fav audio format, best for hq audio)
        const wavBlob = bufferToWav(audioBuffer);
        // create dl link
        const url = URL.createObjectURL(wavBlob);
        
        setAudioUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      };

      // start recording
      recorder.start();
      // show recording ui
      setIsRecording(true);
      // clear old dl data if it exists
      setAudioUrl(null);

    } catch (err) {
      console.error("Capture failed:", err);
    }
  };

  const stopCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // kill the recording
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      // kill the stream
      streamRef.current.getTracks().forEach(track => track.stop());

      // like in the studio - turn off the recording tape, but also turn off the mic
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      <Group mb="md">
        {!isRecording ? (
          <Button leftSection={<Mic size={18} />} color="red" onClick={startCapture}>
            Start Recording
          </Button>
        ) : (
          <Button leftSection={<Square size={18} />} color="gray" onClick={stopCapture}>
            Stop Recording
          </Button>
        )}
      </Group>

      {isRecording && <Badge color="red" variant="dot" mb="sm">Recording High-Res Audio...</Badge>}
      
      {/* when download link is ready, show download button */}
      {audioUrl && (
        <Button 
          variant="outline" 
          component="a" 
          href={audioUrl} 
          download="sample_capture.wav" 
          leftSection={<Download size={18} />}
        >
          Download .WAV
        </Button>
      )}
    </div>
  );
}

// audio buffer to wav helper function
// full disclaimer i did not write this myself,
// i found it online and am using it for my project 
// because i myself am not educated enough on how 
// software records audio to write this function myself
function bufferToWav(abuffer) {
  let numOfChan = abuffer.numberOfChannels,
    length = abuffer.length * numOfChan * 2 + 44,
    buffer = new ArrayBuffer(length),
    view = new DataView(buffer),
    channels = [], i, sample,
    offset = 0,
    pos = 0;

  // Write WAV container header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);                      // block align
  setUint16(16);                                 // bits per sample
  setUint32(0x61746164);                         // "data" chunk
  setUint32(length - pos - 4);                   // chunk length

  // Write interleaved samples
  for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0; // scale to 16-bit
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
}