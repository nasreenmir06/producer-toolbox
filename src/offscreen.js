console.log('Offscreen.js loaded');
import toWav from 'audiobuffer-to-wav';

// connect to background
const backgroundPort = chrome.runtime.connect({ name: 'offscreen-port' });

// BPM detector CODE
let bpmDetectorPromise = null;

// initialize bpm detector
async function initBPMDetector() {
    if (bpmDetectorPromise) return bpmDetectorPromise;
    bpmDetectorPromise = import('web-audio-beat-detector').then(m => m);
    return bpmDetectorPromise;
}

// analyze audio and return BPM
async function analyzeAudio(dataUrl) {
    try {
        const { analyze } = await initBPMDetector();

        console.log('Fetching audio from dataUrl...');
        const response = await fetch(dataUrl);
        const arrayBuffer = await response.arrayBuffer();
        console.log('Decoding audio buffer...');

        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log('Detecting BPM...');
        const tempo = await analyze(audioBuffer);
        const bpm = Math.round(tempo);

        console.log('Analysis complete:', { bpm });
        return { bpm };

    } catch (err) {
        console.error('Analysis error:', err);
        return { bpm: 0, error: err.message };
    }
}

// listen for messages from background
backgroundPort.onMessage.addListener((message) => {
    console.log('OFFSCREEN RECEIVED PORT MESSAGE:', message.target);
    
    if (message.target === 'offscreen-bpm-detector') {
        analyzeAudio(message.data.dataUrl).then(results => {
            chrome.runtime.sendMessage({ target: 'popup-ui', results });
        });
    }
    
    if (message.target === 'offscreen-strip-silence') {
        stripSilence(message.data.dataUrl).then(results => {
            chrome.runtime.sendMessage({ target: 'strip-silence', results });
        });
    }
});

// STRIP SILENCE CODE

// helper function for strip silence
function getTrimPoints(audioBuffer, threshold = 0.02) {
    const channelData = audioBuffer.getChannelData(0);
    let start = 0;
    let end = channelData.length - 1;

    // find first sample above threshold
    while (start < end && Math.abs(channelData[start]) < threshold) start++;
    // find last sample above threshold
    while (end > start && Math.abs(channelData[end]) < threshold) end--;

    return { start, end };
}

// strip silence from sample and return updated audio file
async function stripSilence(dataUrl) {
    try {
        // fetch and decode
        const response = await fetch(dataUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const { start, end } = getTrimPoints(audioBuffer);
        const duration = end - start;

        // create new buffer for trimmed audio
        const newBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            duration,
            audioBuffer.sampleRate
        );

        // copy trimmed audio into new buffer
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const channel = audioBuffer.getChannelData(i);
            newBuffer.copyToChannel(channel.subarray(start, end), i);
        }

        // encode to wav
        const wavData = toWav(newBuffer); 
        const wavBlob = new Blob([wavData], { type: 'audio/wav' });
        
        // return url for download
        const reader = new FileReader();
        const downloadUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(wavBlob);
        });
        return { downloadUrl };

    } catch (err) {
        console.error('Strip error:', err);
        return { success: false, error: err.message };
    }
}

console.log('Offscreen port message listener registered');