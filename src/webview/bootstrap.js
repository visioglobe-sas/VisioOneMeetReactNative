// Run last, after core.js and every feature's webview.js: every message handler is
// registered by now, so React Native can be told the page is listening.
window.MapCore.start()
