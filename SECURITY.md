# Security Policy & Incident Response

## 🛡️ Security Philosophy

File Converter is engineered under a **defense-in-depth, local-first, privacy-by-design** standard adhering to **OWASP ASVS Level 2** guidelines:

1. **Client-Side Isolation**: Over 95% of file transformations execute directly within the user's browser memory using WebAssembly (WASM) and HTML5 Canvas. No document bytes leave the client machine.
2. **Ephemeral Backend Sandboxing**: When advanced format conversion (e.g. PDF to Word DOCX) utilizes the compatibility microservice, inputs are processed in cryptographically randomized volatile directories and deleted immediately upon task completion or 15-minute TTL expiration.
3. **No File Logging**: File contents, binary streams, extracted text, and original filesystem paths are strictly excluded from all application logs.
4. **Content Security Policy (CSP)**: Strict origin allowlists, `object-src 'none'`, `frame-ancestors 'none'`, and nosniff protection against XSS, clickjacking, and script injection.

---

## 🚨 Incident Response & Emergency Procedures

In the event of a suspected security event or vulnerability report:

### 1. Key & Secret Revocation
- Rotate any compromised environment variables immediately in the Vercel Project Settings and redeploy.
- Revoke and regenerate GitHub access tokens and deploy keys.

### 2. Emergency Backend Isolation
- If backend microservice abuse is detected, set `NEXT_PUBLIC_API_URL` to empty or trigger Vercel Edge Firewall challenge/block rules.
- Local browser conversions will continue functioning uninterrupted.

### 3. Vercel Deployment Rollback
- To instantly revert to a verified immutable prior deployment:
  ```bash
  vercel rollback [DEPLOYMENT_ID]
  ```

---

## 🔒 Reporting a Vulnerability

We welcome responsible security research. If you discover a vulnerability:

1. **Email**: Contact `security@fileconvertor.in`.
2. **Details to Provide**:
   - Description of vulnerability and OWASP category.
   - Proof of Concept (PoC) steps to reproduce.
   - Impact assessment.
3. **Response SLA**: Initial triage within 24 hours.

Please do not perform destructive denial-of-service tests or attempt to access other users' data.
