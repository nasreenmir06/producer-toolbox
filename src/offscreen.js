console.log('Offscreen.js loaded');

// connect to background
const backgroundPort = chrome.runtime.connect({ name: 'offscreen-port' });

let bpmAnalyzerPromise = null;

// initialize bpm analyzer
async function initBPMAnalyzer() {
    if (bpmAnalyzerPromise) return bpmAnalyzerPromise;
    bpmAnalyzerPromise = import('web-audio-beat-detector').then(m => m);
    return bpmAnalyzerPromise;
}

// analyze audio and return BPM
async function analyzeAudio(dataUrl) {
    try {
        const { analyze } = await initBPMAnalyzer();

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
    if (message.target === 'offscreen-analyzer') {
        console.log('Starting audio analysis in offscreen...');
        analyzeAudio(message.data.dataUrl).then(results => {
            console.log('Sending results back to UI:', results);
            chrome.runtime.sendMessage({
                target: 'popup-ui',
                results: results
            }).catch(err => {
                console.error('Failed to send results:', err);
            });
        });
    }
});

console.log('Offscreen port message listener registered');