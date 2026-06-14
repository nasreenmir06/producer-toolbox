import { useState, useEffect } from 'react';
import { Text } from '@mantine/core';
import '@mantine/dropzone/styles.css';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload } from '@tabler/icons-react';

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
                        setDetectedBPM('Error: Failed to create detector');
                        return;
                    }
                }

                // send data to background
                console.log('Sending audio data to background for relay...');
                try {
                    await chrome.runtime.sendMessage({
                        target: 'offscreen-bpm-detector',
                        data: { dataUrl }
                    });
                    console.log('Message sent successfully');
                } catch (err) {
                    // ignore no response errors
                    if (!err.message.includes('message channel closed') && !err.message.includes('no tab')) {
                        setDetectedBPM('Error: Could not start analysis');
                    }
                }

            } catch (error) {
                console.error('Error setting up offscreen:', error);
                setDetectedBPM('Error setting up detector');
            }
        };
        reader.readAsDataURL(file);
    };

    return (
    <>
        <div style={{ padding: '10px' }}>
            <Text><strong>BPM:</strong> {detectedBPM}</Text>
        </div>
        <Dropzone
            onDrop={(files) => handleDrop({ dataTransfer: { files }, preventDefault: () => {} })}
            accept={['audio/mpeg', 'audio/wav', 'audio/wave']}
            onReject={() => setDetectedBPM('Error: only MP3 and WAV files are supported')}
            style={{ backgroundColor: 'white' }}
            mb = "sm"
        >
            <div style={{ textAlign: 'center' }}>
                <Dropzone.Idle><IconCloudUpload size={40} color="gray" /></Dropzone.Idle>
                <Text ta="center" c="dimmed">Drag & drop here</Text>
            </div>
        </Dropzone>
    </>
    );
}