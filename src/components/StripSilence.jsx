import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Text, Button } from '@mantine/core';
import '@mantine/dropzone/styles.css';
import { Dropzone } from '@mantine/dropzone';
import { IconCloudUpload } from '@tabler/icons-react';

export default function StripSilence() {
    const [isDragging, setIsDragging] = useState(false);
    const [message, setMessage] = useState("Waiting for file...");
    const [downloadUrl, setDownloadUrl] = useState(null);

    // listen for results from offscreeen
    useEffect(() => {
        const handleMessage = (msg) => {
            console.log('Strip Silence received message:', msg);
            if (msg.target === 'strip-silence' && msg.results) {
                console.log('Received analysis results:');
                setDownloadUrl(msg.results.downloadUrl);
                setMessage(`Stripped silence from audio file`);
            } else if (msg.error) {
                console.error('Analysis error:', msg.error);
                setMessage('Error analyzing file');
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
            setMessage('Error: only MP3 and WAV files are supported');
            return;
        }

        console.log('File dropped:', file.name, 'Size:', file.size);
        setMessage("Analyzing...");

        const reader = new FileReader();
        reader.onerror = () => {
            console.error('FileReader error:', reader.error);
            setMessage('Error reading file');
        };
        reader.onload = async (e) => {
            try {
                // fetch raw audio data
                const dataUrl = e.target.result;
                console.log('File converted to DataURL, size:', dataUrl.length);
                const hasDoc = await chrome.offscreen.hasDocument();
                console.log('Offscreen document exists:', hasDoc);

                // create offscreen doc if it doesn't exist
                if (!hasDoc) {
                    console.log('Creating offscreen document...');
                    try {
                        await chrome.offscreen.createDocument({
                            url: chrome.runtime.getURL('offscreen.html'),
                            reasons: ['AUDIO_PLAYBACK'],
                            justification: 'Analyze audio file to remove silence'
                        });
                        await new Promise(resolve => setTimeout(resolve, 200));
                        console.log('Offscreen document created successfully');
                    } catch (createErr) {
                        console.error('Failed to create offscreen document:', createErr);
                        setMessage('Error: Failed to create analyzer');
                        return;
                    }
                }
                // send data to background
                console.log('Sending audio data to background for relay...');
                try {
                    await chrome.runtime.sendMessage({
                        target: 'offscreen-strip-silence',
                        data: { dataUrl }
                    });
                    console.log('Message sent successfully');
                } catch (err) {
                    console.error('Failed to send message:', err);
                    setMessage('Error: Could not start analysis');
                }
            } catch (error) {
                console.error('Error setting up offscreen:', error);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            {downloadUrl && (
                <Button 
                    variant="outline" 
                    component="a" 
                    href={downloadUrl} 
                    download="stripped.wav" 
                    leftSection={<Download size={18} />}
                    mb = "sm"
                >
                    Download .WAV
                </Button>
            )}
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