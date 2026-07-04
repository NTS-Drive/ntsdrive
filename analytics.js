/*
 * NTS_Drive shared GA4 loader.
 * To activate: replace GA_MEASUREMENT_ID below with the real ID from
 * Google Analytics (Admin > Data Streams > your stream > Measurement ID).
 * Every page includes this one file, so updating the ID here updates
 * tracking across the whole site.
 */
(function () {
  var GA_MEASUREMENT_ID = 'G-2C3G7CTX8Y';

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  // Expose a small helper other pages can call for custom events.
  window.ntsTrack = function (eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  };
})();
