export interface User {
    sub: string; //Subject
    email: string;
    nameid: string;
    jti: string; //JWT ID
    iat: number; //Issued At
    exp: number; //Expiration Time
    iss: string; //Issuer
    aud: string; //Audience
}