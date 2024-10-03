function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

document.addEventListener('DOMContentLoaded', function() {
    injectScript(chrome.runtime.getURL('scripts/content_script.js'), 'body');
});

window.addEventListener('message', (message) => {
    console.log('Message received:', message.data.message);
    if (message.source !== window) return;

    if (message.data.message === 'FROM_MEDIA_HANDLER') {
        console.log('Sending message to background:', message.data.body);
        chrome.runtime.sendMessage(message.data.body, (response) => {
            console.log('Response from background:', response);
        });
    }
})