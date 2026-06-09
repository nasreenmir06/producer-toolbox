import { useState, useEffect } from 'react';
import { Text } from '@mantine/core';

export default function BPMDetector() {
    const [isDragging, setIsDragging] = useState(false);
    const [detectedBPM, setDetectedBPM] = useState("Waiting for file...");

    // listen for results from offscreeen
    useEffect(() => {
        const handleMessage = (message) => {
            console.log('BPMDetector received message:', message);
            if (message.target === 'popup-ui' && message.results) {
                console.log('Received analysis results:', message.results);
                setDetectedBPM(`${message.results.bpm} BPM`);
            } else if (message.error) {
                console.error('Analysis error:', message.error);
                setDetectedBPM('Error analyzing file');
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    const handleDrop = async (e) => {
        // dont open the audio file in a new tab
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;

        // check that uploaded file is a supported audio file type
        const allowed = ['audio/mpeg', 'audio/wav', 'audio/wave'];
        if (!allowed.includes(file.type)) {
            setDetectedBPM('Error: only MP3 and WAV files are supported');
            return;
        }

        console.log('File dropped:', file.name, 'Size:', file.size);
        setDetectedBPM("Analyzing...");

        const reader = new FileReader();
        reader.onerror = () => {
            console.error('FileReader error:', reader.error);
            setDetectedBPM('Error reading file');
        };
        reader.onload = async (e) => {
            try {
                // fetch raw audio data
                const dataUrl = e.target.result;
                console.log('File converted to DataURL, size:', dataUrl.length);

                if (!chrome.offscreen) {
                    console.error('chrome.offscreen not available');
                    setDetectedBPM('Error: offscreen API not available');
                    return;
                }

                const hasDoc = await chrome.offscreen.hasDocument();
                console.log('Offscreen document exists:', hasDoc);

                // create offscreen doc if it doesn't exist
                if (!hasDoc) {
                    console.log('Creating offscreen document...');
                    try {
                        await chrome.offscreen.createDocument({
                            url: chrome.runtime.getURL('offscreen.html'),
                            reasons: ['AUDIO_PLAYBACK'],
                            justification: 'Analyze audio file for BPM'
                        });
                        console.log('Offscreen document created successfully');
                    } catch (createErr) {
                        console.error('Failed to create offscreen document:', createErr);
                        setDetectedBPM('Error: Failed to create analyzer');
                        return;
                    }
                }

                // send data to background
                console.log('Sending audio data to background for relay...');
                try {
                    await chrome.runtime.sendMessage({
                        target: 'offscreen-analyzer',
                        data: { dataUrl }
                    });
                    console.log('Message sent successfully');
                } catch (err) {
                    console.error('Failed to send message:', err);
                    setDetectedBPM('Error: Could not start analysis');
                }

            } catch (error) {
                console.error('Error setting up offscreen:', error);
                setDetectedBPM('Error setting up analyzer');
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            <div style={{ padding: '10px' }}>
                <Text><strong>BPM:</strong> {detectedBPM}</Text>
            </div>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                style={{
                    border: "2px dashed #aaa",
                    padding: "40px",
                    backgroundColor: isDragging ? "#ccc" : "#fff"
                }}
            >
                Drag & drop here
            </div>
        </>
    );
}