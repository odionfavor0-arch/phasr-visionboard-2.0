import { staticFile } from 'remotion'

// Self-hosted @font-face rules. The sandboxed Chromium Remotion renders with
// cannot validate the TLS cert for fonts.googleapis.com at render time
// (ERR_CERT_AUTHORITY_INVALID), so every video was silently falling back to
// a default system font despite the CSS asking for Inter/Fraunces — this
// fixes it for real by removing the network dependency entirely.
export const FONT_FACES = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('${staticFile('fonts/Inter-400.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 500;
  src: url('${staticFile('fonts/Inter-500.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  src: url('${staticFile('fonts/Inter-600.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  src: url('${staticFile('fonts/Inter-700.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 800;
  src: url('${staticFile('fonts/Inter-800.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 900;
  src: url('${staticFile('fonts/Inter-900.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 400;
  src: url('${staticFile('fonts/Fraunces-400.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 500;
  src: url('${staticFile('fonts/Fraunces-500.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 600;
  src: url('${staticFile('fonts/Fraunces-600.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 700;
  src: url('${staticFile('fonts/Fraunces-700.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Fraunces';
  font-style: italic;
  font-weight: 500;
  src: url('${staticFile('fonts/Fraunces-Italic-500.woff2')}') format('woff2');
}
@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 700;
  src: url('${staticFile('fonts/Caveat-700.woff2')}') format('woff2');
}
`
