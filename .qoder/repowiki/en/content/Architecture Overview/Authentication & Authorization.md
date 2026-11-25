# Authentication & Authorization

<cite>
**Referenced Files in This Document**
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.types.ts](file://src/types/auth.types.ts)
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [page.tsx (admin login)](file://src/app/admin/auth/login/page.tsx)
- [logout page.tsx](file://src/app/logout/page.tsx)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document describes the authentication and authorization system for the application, focusing on:
- JWT-based authentication flow
- Role-based access control (RBAC) with user roles
- Multi-step registration process with OTP verification
- Integration with Firebase Authentication for social sign-in
- Token management strategy and session handling
- Protected route behavior and logout flows
- Security considerations and token refresh mechanisms

The system uses HTTP-only cookies to store a server-issued JWT access token, attaches it to API requests via a centralized HTTP client, and routes users based on their role after successful authentication.

## Project Structure
Authentication-related code is organized into services, hooks, types, UI pages, and shared libraries:
- Services: API endpoints for auth and OTP
- Hooks: React Query wrappers for mutations
- Types: Payloads, responses, and user models
- UI: Registration, OTP verification, login, and logout pages
- Libraries: HTTP client and Firebase configuration

```mermaid
graph TB
subgraph "UI"
R["Register Page<br/>register.tsx"]
O["OTP Dialog<br/>otp.tsx"]
AL["Admin Login Page<br/>admin/auth/login/page.tsx"]
LG["Logout Page<br/>logout/page.tsx"]
end
subgraph "Hooks"
HA["Auth Mutations<br/>use-auth.ts"]
HO["OTP Mutations<br/>use-otp.ts"]
HS["Social Auth Hook<br/>use-social-auth.ts"]
end
subgraph "Services"
SA["Auth Service<br/>auth.service.ts"]
SO["OTP Service<br/>otp.service.ts"]
end
subgraph "Libraries"
API["HTTP Client<br/>api.ts"]
FB["Firebase Config<br/>firebase.ts"]
end
R --> HA
R --> HO
O --> HO
AL --> HA
LG --> HA
HA --> SA
HO --> SO
HS --> SA
HS --> FB
SA --> API
SO --> API
```

**Diagram sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [page.tsx (admin login)](file://src/app/admin/auth/login/page.tsx)
- [logout page.tsx](file://src/app/logout/page.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)

**Section sources**
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [page.tsx (admin login)](file://src/app/admin/auth/login/page.tsx)
- [logout page.tsx](file://src/app/logout/page.tsx)

## Core Components
- HTTP client: Centralized fetch wrapper that reads the JWT from cookies and attaches it as an Authorization header for all API calls. It also handles error normalization and JSON parsing.
- Auth service: Exposes endpoints for register, login (phone/email), social login (Google/Apple), password reset/change, and logout.
- OTP service: Handles sending OTPs (email or phone) and verifying OTPs, returning either a verification token or full login tokens depending on context.
- Social auth hook: Orchestrates Firebase popup sign-in, obtains FCM token, calls backend social login, stores the JWT cookie, and redirects by role.
- Registration flow: Collects user info, sends registration request, opens OTP dialog, verifies OTP, stores JWT, and navigates based on role.
- Logout flow: Calls server logout endpoint, removes JWT cookie, clears local state and query cache, and redirects to login.

Key data contracts:
- Roles: user, provider, admin
- OTP types: signup, forgot, login, changeEmail, changePhone
- Responses include accessToken and refreshToken; user object includes role and profile completion flags

**Section sources**
- [api.ts](file://src/lib/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [auth.types.ts](file://src/types/auth.types.ts)

## Architecture Overview
The authentication architecture combines server-side JWT issuance with client-side cookie storage and role-based navigation.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Register Page<br/>register.tsx"
participant H as "Auth Hook<br/>use-auth.ts"
participant S as "Auth Service<br/>auth.service.ts"
participant C as "HTTP Client<br/>api.ts"
participant B as "Backend API"
participant OC as "OTP Dialog<br/>otp.tsx"
participant OH as "OTP Hook<br/>use-otp.ts"
participant OS as "OTP Service<br/>otp.service.ts"
U->>UI : Submit name/email/phone
UI->>H : useRegister.mutate(payload)
H->>S : register(payload)
S->>C : POST /auth/register
C->>B : Request with JSON body
B-->>C : {verificationToken}
C-->>S : ApiResponse
S-->>H : Response
H-->>UI : onSuccess -> open OTP dialog
UI->>OC : Show OTP input
U->>OC : Enter OTP
OC->>OH : verifyOtp({ otp }, type="signup", token)
OH->>OS : POST /otp/verify?type=signup
OS->>C : Request with token in URL
C->>B : Request with JSON body + optional token
B-->>C : {accessToken, refreshToken, user}
C-->>OS : ApiResponse
OS-->>OH : Response
OH-->>OC : onSuccess -> setCookie("token")
OC-->>UI : Verified -> navigate by role
```

**Diagram sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)

## Detailed Component Analysis

### JWT-Based Authentication Flow
- The HTTP client reads the JWT from the cookie named token and attaches it as Authorization: Bearer <token> for every request. If no token is present, requests are sent without Authorization.
- Successful login or OTP verification returns an accessToken and refreshToken. The client stores accessToken in a cookie with path "/" and expiration.
- All protected endpoints rely on the presence of this cookie.

```mermaid
flowchart TD
Start(["Request Initiated"]) --> ReadCookie["Read 'token' from cookies"]
ReadCookie --> HasToken{"Token Present?"}
HasToken --> |Yes| AttachHeader["Attach Authorization: Bearer <token>"]
HasToken --> |No| NoAuth["Send without Authorization"]
AttachHeader --> Fetch["Fetch to base_url/base_api/endpoint"]
NoAuth --> Fetch
Fetch --> Ok{"Response OK?"}
Ok --> |Yes| Parse["Parse JSON/text response"]
Ok --> |No| ThrowErr["Throw normalized Error(message)"]
Parse --> End(["Return Data"])
ThrowErr --> End
```

**Diagram sources**
- [api.ts](file://src/lib/api.ts)

**Section sources**
- [api.ts](file://src/lib/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)

### Role-Based Access Control (RBAC)
- Roles: user, provider, admin
- After successful authentication, the client inspects the user.role and navigates accordingly:
  - admin -> /admin/dashboard
  - provider -> /driver if KYC submitted, else /auth/register/info
  - user -> home page (/)
- This logic is implemented in the social auth hook and can be mirrored in other flows where needed.

```mermaid
flowchart TD
A["Login Success"] --> CheckRole["Check user.role"]
CheckRole --> Admin{"role === 'admin'?"}
Admin --> |Yes| GoAdmin["Navigate to /admin/dashboard"]
Admin --> |No| Provider{"role === 'provider'?"}
Provider --> |Yes| Kyc{"isKycSubmitted?"}
Kyc --> |Yes| GoDriver["Navigate to /driver"]
Kyc --> |No| GoInfo["Navigate to /auth/register/info"]
Provider --> |No| Home["Navigate to /"]
```

**Diagram sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.types.ts](file://src/types/auth.types.ts)

**Section sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.types.ts](file://src/types/auth.types.ts)

### Multi-Step Registration Process
- Step 1: User submits name, email, and phone. The app calls register, which returns a verificationToken.
- Step 2: An OTP dialog opens. The user enters the 6-digit code.
- Step 3: The app verifies the OTP using the verificationToken. On success, the server returns accessToken and refreshToken.
- Step 4: The client stores the accessToken in a cookie and navigates based on role.

```mermaid
sequenceDiagram
participant U as "User"
participant RP as "Register Page<br/>register.tsx"
participant AH as "Auth Hook<br/>use-auth.ts"
participant AS as "Auth Service<br/>auth.service.ts"
participant HC as "HTTP Client<br/>api.ts"
participant OP as "OTP Dialog<br/>otp.tsx"
participant OH as "OTP Hook<br/>use-otp.ts"
participant OS as "OTP Service<br/>otp.service.ts"
U->>RP : Submit registration form
RP->>AH : useRegister.mutate(payload)
AH->>AS : register(payload)
AS->>HC : POST /auth/register
HC-->>AS : {verificationToken}
AS-->>RP : onSuccess -> open OTP dialog
RP->>OP : Show OTP input
U->>OP : Enter OTP
OP->>OH : verifyOtp({ otp }, type="signup", token)
OH->>OS : POST /otp/verify?type=signup
OS->>HC : Request with token param
HC-->>OS : {accessToken, refreshToken, user}
OS-->>OH : onSuccess
OH-->>OP : Set cookie("token")
OP-->>RP : Verified -> navigate by role
```

**Diagram sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)

**Section sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)

### Firebase Authentication Integration
- Google and Apple providers are configured via Firebase.
- The social auth hook performs a popup sign-in, retrieves the provider ID token, and optionally collects an FCM token.
- The ID token is sent to the backend social login endpoints (/auth/google, /auth/apple).
- On success, the client stores the server’s accessToken in a cookie and redirects by role.

```mermaid
sequenceDiagram
participant U as "User"
participant SA as "Social Auth Hook<br/>use-social-auth.ts"
participant FB as "Firebase Auth<br/>firebase.ts"
participant AS as "Auth Service<br/>auth.service.ts"
participant HC as "HTTP Client<br/>api.ts"
U->>SA : Click "Continue with Google/Apple"
SA->>FB : signInWithPopup(provider)
FB-->>SA : {idToken, user info}
SA->>SA : getFcmToken()
SA->>AS : loginWithGoogle/Apple({ idToken, fcmToken, role })
AS->>HC : POST /auth/google or /auth/apple
HC-->>AS : {accessToken, refreshToken, user}
AS-->>SA : onSuccess
SA->>SA : setCookie("token")
SA->>SA : redirectForRole(user.role)
```

**Diagram sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [firebase.ts](file://src/lib/firebase.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [api.ts](file://src/lib/api.ts)

**Section sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [firebase.ts](file://src/lib/firebase.ts)
- [auth.service.ts](file://src/services/auth.service.ts)

### OTP Verification System
- OTP types include signup, forgot, login, changeEmail, changePhone.
- Sending OTP:
  - Email: /otp/send-otp-in-email
  - Phone via token: /otp/send-otp-via-token-in-phone
  - Phone direct: /otp/send-otp-via-direct-phone (returns verificationToken)
- Verifying OTP:
  - /otp/verify?type=<type> with optional token parameter when required by flow.

```mermaid
flowchart TD
Start(["OTP Action"]) --> Choose["Choose Type<br/>signup/forgot/login/changeEmail/changePhone"]
Choose --> Send["Send OTP<br/>Email or Phone"]
Send --> Verify["Verify OTP<br/>POST /otp/verify?type=<type>"]
Verify --> Result{"Success?"}
Result --> |Yes| Tokens["Receive accessToken/refreshToken or verificationToken"]
Result --> |No| Retry["Retry or Resend"]
Tokens --> Store["Store token(s) and proceed"]
Retry --> Send
```

**Diagram sources**
- [otp.service.ts](file://src/services/otp.service.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [auth.types.ts](file://src/types/auth.types.ts)

**Section sources**
- [otp.service.ts](file://src/services/otp.service.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [auth.types.ts](file://src/types/auth.types.ts)

### Token Management Strategy and Session Handling
- Storage: The client stores the JWT access token in a cookie named token with path "/" and a fixed maxAge.
- Attachment: The HTTP client automatically attaches the token to requests via Authorization header.
- Scope: Cookies are used across the app; credentials are included in fetch requests.
- Refresh: The server may return a refreshToken in login responses; however, there is no explicit client-side refresh mechanism implemented in the current codebase.

```mermaid
classDiagram
class CookieManager {
+setCookie(name, value, options)
+getCookie(name) string?
+removeCookie(name, options)
}
class HttpClient {
+howl(endpoint, options) Promise
+prowl(endpoint, options) Promise
-getToken() string?
}
CookieManager <.. HttpClient : "reads/writes 'token'"
```

**Diagram sources**
- [api.ts](file://src/lib/api.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [otp.tsx](file://src/app/auth/register/otp.tsx)

**Section sources**
- [api.ts](file://src/lib/api.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [otp.tsx](file://src/app/auth/register/otp.tsx)

### Protected Route Implementation
- Navigation decisions are made post-authentication based on user.role.
- For social login, the hook redirects to admin dashboard, driver area, or home.
- For registration OTP verification, the client navigates to home or provider info page depending on role.

```mermaid
flowchart TD
A["Authenticated"] --> Role["user.role"]
Role --> Admin{"admin"}
Admin --> |Yes| D1["/admin/dashboard"]
Role --> Provider{"provider"}
Provider --> |Yes| Kyc{"isKycSubmitted?"}
Kyc --> |Yes| D2["/driver"]
Kyc --> |No| D3["/auth/register/info"]
Role --> User{"user"}
User --> |Yes| D4["/"]
```

**Diagram sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [otp.tsx](file://src/app/auth/register/otp.tsx)

**Section sources**
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [otp.tsx](file://src/app/auth/register/otp.tsx)

### Logout Flow
- The logout page calls the server logout endpoint, removes the token cookie, clears local user state and query cache, and redirects to login.

```mermaid
sequenceDiagram
participant U as "User"
participant LP as "Logout Page<br/>logout/page.tsx"
participant AS as "Auth Service<br/>auth.service.ts"
participant HC as "HTTP Client<br/>api.ts"
participant Z as "Local State"
participant Q as "Query Cache"
U->>LP : Navigate to /logout
LP->>AS : authService.logout()
AS->>HC : POST /auth/logout
HC-->>AS : Response
LP->>Z : clearUserId()
LP->>Q : qc.clear()
LP->>LP : removeCookie("token")
LP->>LP : window.location.href = "/auth/login"
```

**Diagram sources**
- [logout page.tsx](file://src/app/logout/page.tsx)
- [auth.service.ts](file://src/services/auth.service.ts)
- [api.ts](file://src/lib/api.ts)

**Section sources**
- [logout page.tsx](file://src/app/logout/page.tsx)
- [auth.service.ts](file://src/services/auth.service.ts)

## Dependency Analysis
- Services depend on the HTTP client for network I/O.
- Hooks wrap services with React Query mutations.
- UI components call hooks and manage local state and navigation.
- Firebase integration is isolated in a library module and consumed by the social auth hook.

```mermaid
graph LR
UI["UI Pages<br/>register.tsx, otp.tsx, admin login, logout"] --> Hooks["React Query Hooks<br/>use-auth.ts, use-otp.ts, use-social-auth.ts"]
Hooks --> Services["API Services<br/>auth.service.ts, otp.service.ts"]
Services --> HTTP["HTTP Client<br/>api.ts"]
Hooks --> Firebase["Firebase Config<br/>firebase.ts"]
```

**Diagram sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [page.tsx (admin login)](file://src/app/admin/auth/login/page.tsx)
- [logout page.tsx](file://src/app/logout/page.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)

**Section sources**
- [register.tsx](file://src/app/auth/register/register.tsx)
- [otp.tsx](file://src/app/auth/register/otp.tsx)
- [page.tsx (admin login)](file://src/app/admin/auth/login/page.tsx)
- [logout page.tsx](file://src/app/logout/page.tsx)
- [use-auth.ts](file://src/hooks/auth/use-auth.ts)
- [use-otp.ts](file://src/hooks/auth/use-otp.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [otp.service.ts](file://src/services/otp.service.ts)
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)

## Performance Considerations
- Network requests are centralized; ensure proper caching strategies for read operations where applicable.
- Avoid unnecessary re-renders by keeping mutation states minimal and leveraging React Query’s built-in caching.
- Keep cookie size small; only store the access token.
- Defer heavy operations (e.g., FCM token retrieval) until needed.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing Authorization header: Ensure the token cookie exists before making authenticated requests.
- Invalid or expired token: Implement a token refresh mechanism if the server supports refresh tokens.
- CORS or cookie domain issues: Verify base_url and cookie settings match your deployment environment.
- Social login failures: Confirm Firebase project configuration and provider scopes.

**Section sources**
- [api.ts](file://src/lib/api.ts)
- [firebase.ts](file://src/lib/firebase.ts)
- [use-social-auth.ts](file://src/hooks/auth/use-social-auth.ts)

## Conclusion
The authentication and authorization system leverages JWT stored in cookies, a centralized HTTP client for secure requests, and role-based navigation. Registration uses a multi-step OTP flow, while social sign-in integrates with Firebase. Current implementation focuses on storing and using the access token; additional enhancements such as automatic token refresh and robust server-side session invalidation can further improve security and reliability.

[No sources needed since this section summarizes without analyzing specific files]