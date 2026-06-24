import { useState, useRef } from 'react';
import { Button, Group, Badge, Text } from '@mantine/core';
import { Mic, Square } from 'lucide-react';
import { PitchDetector } from "pitchy";

export default function PitchDetectorComponent() {
    const [isRecording, setIsRecording] = useState(false);
    const [pitchData, setPitchData] = useState({ note: null, hz: null });

    const streamRef = useRef(null);
    const audioContextRef = useRef(null);

    function getNoteFromFrequency(frequency) {
        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        // A4 is 440Hz, math formula to find semitone distance from A4
        // chose A4 as reference point because it's the standard tuning pitch for music
        const semitone = Math.round(12 * (Math.log2(frequency / 440)));
        const noteIndex = (semitone + 69) % 12;
        const octave = Math.floor((semitone + 69) / 12) - 1;
        return `${notes[noteIndex]}${octave}`;
    }

    const startCapture = async() => {
        // start mic capture
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            } 
        });
        const audioContext = new AudioContext();
        // source node for mic stream
        const source = audioContext.createMediaStreamSource(stream);

        streamRef.current = stream; // store stream
        audioContextRef.current = audioContext; // store audio context
        setIsRecording(true);

        // main logic
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // standard size for accuracy
        source.connect(analyser); // send mic to analyzer so we can do math on it

        const detector = PitchDetector.forFloat32Array(analyser.fftSize);  
        const input = new Float32Array(detector.inputLength);

        let noteHistory = []; // track recent detections
        
        const updatePitch = () => {
            // make sure mic stream is still live
            if (!streamRef.current) return;
            
            // get audio snapshot
            analyser.getFloatTimeDomainData(input);
            const [pitch, clarity] = detector.findPitch(input, audioContext.sampleRate);
            
            if (clarity > 0.8) { // make sure note is clear enough to be used, so random noise is not picked up as a frequency
                const note = getNoteFromFrequency(pitch);
                noteHistory.push(note);
                
                // keep history size at 5 frames
                if (noteHistory.length > 5) noteHistory.shift();

                // only update state if the last 5 frames are all the same note (improve confidnence in displayed note)
                if (noteHistory.every(n => n === note)) {
                    setPitchData({ note: note, hz: pitch.toFixed(1) });
                }
            } else {
                // clear history if clarity drops
                noteHistory = []; 
            }
            requestAnimationFrame(updatePitch);
        };
        updatePitch(); // start the loop

    };

    const stopCapture = () => {
        // should only be 1 track (audio) in the stream but just in case, loop through all tracks and stop them
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
            track.stop(); // turn of mic
            });
            streamRef.current = null;
        }
        // close context, free up resources
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsRecording(false);
        setPitchData({ note: null, hz: null });
    };

    return (
    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
      <Text size="xl" fw={700}>
        {pitchData.note ? `${pitchData.note} (${pitchData.hz} Hz)` : "Waiting for audio..."}
      </Text>

      {isRecording && <Badge color="red" variant="dot" mb="sm">Recording Audio...</Badge>}
    </div>
  );
}