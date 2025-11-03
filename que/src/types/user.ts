export interface User {
    sub: string;     // User ID (GUID)
    email: string;   // User's email
    username: string;// User's username
    jti: string;     // JWT ID
    iat: number;     // Issued At
    exp: number;     // Expiration Time
    iss: string;     // Issuer
    aud: string;     // Audience
}