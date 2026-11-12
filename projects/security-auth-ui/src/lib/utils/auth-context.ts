import { HttpContextToken } from "@angular/common/http";

// Use only when the server explicitly allows the operation without CSRF.
export const SKIP_CSRF = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
