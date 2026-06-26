/** @type {import('next').NextConfig} */

/*
  Content-Security-Policy
  ------------------------------------------------------------------
  Scoped to what the app actually loads today (no external CDNs, no
  analytics, wallet is mocked).  See docs/security-headers.md for the
  rationale behind each directive, the unavoidable `unsafe-inline` on
  styles, and a concrete path to tighten the policy later.

  Quick reference for future wallet integration:
    connect-src additions: https://*.infura.io wss://*.infura.io (MetaMask RPC)
                           wss://relay.walletconnect.com          (WalletConnect relay)
    script-src may also need the provider's injection origin.
*/
// Build CSP directives conditionally based on environment
const cspDirectives = ["default-src 'self'"];
if (process.env.NODE_ENV === 'development') {
  // Development: allow unsafe-eval for Fast Refresh and unsafe-inline for Tailwind styles
  cspDirectives.push("script-src 'self' 'unsafe-eval'");
  cspDirectives.push("style-src 'self' 'unsafe-inline'");
} else {
  // Production: tighten CSP
  cspDirectives.push("script-src 'self'");
  cspDirectives.push("style-src 'self'");
}
cspDirectives.push(
  "img-src 'self' data:'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
);
const cspHeader = cspDirectives.join('; ');

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

          // Bonus hardening headers (not part of the original spec but
          // recommended by OWASP and the security community):
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
