function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

document.addEventListener('DOMContentLoaded', function () {
    injectScript(chrome.runtime.getURL('scripts/content_script.js'), 'body');
});

window.addEventListener('message', (message) => {
    try {
        console.log('Message received:', message.data.message);
        if (message.source !== window) return;

        if (message.data.message === 'FROM_MEDIA_HANDLER') {
            console.log('Sending message to background:', message.data.body);
            chrome.runtime.sendMessage(message.data.body, (response) => {
                console.log('Response from background:', response);
            });
        }
    } catch (error) {
        if (error.message === 'Extension context invalidated') {
            console.warn('Extension context invalidated. Please reload the extension.');
        } else {
            console.error('Error handling message event:', error);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        console.log('Message received from background:', message);
        if (message.msg === 'MEDIA_INFOS') {
            window.postMessage({
                message: 'FROM_CONTENT_LOADER',
                body: message.msg
            }, '*');
            sendResponse("Successfully sent message to content loader.");
            return true;
        }
    } catch (error) {
        if (error.message === 'Extension context invalidated') {
            console.warn('Extension context invalidated. Please reload the extension.');
        } else {
            console.error('Error handling runtime message:', error);
        }
        sendResponse("Error handling runtime message.");
    }
});