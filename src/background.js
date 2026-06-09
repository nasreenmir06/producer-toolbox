console.log('Background Service Worker loaded');

// launch side panel on click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => console.error(err));

let offscreenPort = null;

// listen for connections from offscreen
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'offscreen-port') {
        console.log('Offscreen connected to background');
        offscreenPort = port;
        port.onDisconnect.addListener(() => {
            console.log('Offscreen disconnected from background');
            offscreenPort = null;
        });
    }
});

// relay messages between UI and offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target === 'offscreen-analyzer') {
        if (offscreenPort) {
            console.log('Relaying analysis request to offscreen via port');
            offscreenPort.postMessage(message);
        } else {
            console.error('No offscreen port available');
        }
        return true;
    }

    // results come back from offscreen, relay to UI
    if (message.target === 'popup-ui') {
        console.log('Forwarding results to UI:', message.results);
        chrome.runtime.sendMessage(message).catch(() => {});
        return true;
    }
});