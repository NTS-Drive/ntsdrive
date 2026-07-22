(function () {
  var style = document.createElement('style');
  style.textContent = [
    '#nts-feedback-widget {',
    '  position: fixed; bottom: 14px; right: 14px; z-index: 3000;',
    '  font-family: "Pretendard","IBM Plex Sans KR",sans-serif;',
    '  font-size: 11.5px; text-decoration: none; color: #6b7280;',
    '  background: rgba(255,255,255,0.92); border: 1px solid #e0e0de;',
    '  border-radius: 999px; padding: 6px 12px; display: inline-flex;',
    '  align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);',
    '  transition: color 0.15s ease, border-color 0.15s ease;',
    '}',
    '#nts-feedback-widget:hover { color: #2F5DA8; border-color: #2F5DA8; }',
    '@media (max-width: 760px) { #nts-feedback-widget { bottom: 84px; } }'
  ].join('\n');
  document.head.appendChild(style);

  var link = document.createElement('a');
  link.id = 'nts-feedback-widget';
  link.href = 'mailto:myer@kakao.com?subject=NTS_Drive%20Feedback';
  link.innerHTML = '\u2709\uFE0F Feedback: myer@kakao.com';
  document.body.appendChild(link);
})();
