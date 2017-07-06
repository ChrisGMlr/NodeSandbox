chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        id: 'main',
        innerBounds: {
            top: 0,
            left: 0,
            width: screen.width,
            height: screen.height
        },
        frame: {
            type: 'none'
        },
        resizable: false
    });
});