# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in studying.works, please help us by reporting it responsibly.

### How to Report

**DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, report via one of these methods:

1. **GitHub Security Advisory (Preferred)**
   - Go to the [Security tab](../../security/advisories)
   - Click "Report a vulnerability"
   - Fill out the private advisory form

2. **Email**
   - Send to: [Hocquetben@winchesterthurston.org]
   - Subject: "SECURITY: [Brief Description]"
   - Include details and steps to reproduce
   - Please add any screenshots.
   - 
### Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Avoid accessing or modifying other users' data
- Act in good faith to avoid privacy violations

We will:
- Not take legal action against good-faith security research

---

## Security Overview

**Data Storage:** User Data & BKT Training models are stored on Google Firebase

**Authentication:** We use Google OAuth via Firebase. Sessions expire after 7 days.

**Third-Party Services:**
- Firebase Authentication (Google)
- GitHub Pages (hosting)
- Cloudflare CDN (Tailwind CSS)

For more details, see our [Privacy Policy](https://studying.works/privacy.html).

---

## Contact

- **Security Issues:** [hocquetben@winchesterthurston.org]
- **GitHub Issues:** For non-security bugs only

---

Claude assisted in creating this for accuracy of all details.

**Last Updated:** October 2024
