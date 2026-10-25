/* Zone — boot. */
(function () {
  'use strict';
  const App = window.App;
  App.applyPrefs();
  App.bootShell();
  // keep the ambience button dot in sync with the focus timer
  App.on('focus', () => App.emit('ambient'));
})();
