import { InjectionToken, Provider } from "@angular/core";

export interface AuthConfig {
    apiBaseUrl: string;
    sessionPath: string;
    csrfPath: string;
    authorizationPath: string;
    logoutPath: string;
    loginRoute: string;
    defaultAfterLoginRoute: string;
}

const defaults: Readonly<AuthConfig> = Object.freeze({
    apiBaseUrl: "/api",
    sessionPath: "/session",
    csrfPath: "/csrf",
    authorizationPath: "/oauth2/authorization/google",
    logoutPath: "/logout",
    loginRoute: "/login",
    defaultAfterLoginRoute: "/",
});

export const AUTH_CONFIG = new InjectionToken<Readonly<AuthConfig>>("AUTH_CONFIG", {
    providedIn: "root",
    factory: () => defaults,
});

export function provideAuthConfig(overrides: Partial<AuthConfig> = {}): Provider {
    return { provide: AUTH_CONFIG, useValue: Object.freeze({ ...defaults, ...overrides }) };
}

export function authEndpoint(config: Readonly<AuthConfig>, path: string): string {
    return `${config.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function isAuthApiUrl(config: Readonly<AuthConfig>, url: string): boolean {
    const base = config.apiBaseUrl.replace(/\/$/, "");
    const path = url.split(/[?#]/)[0];
    return path === base || path.startsWith(`${base}/`);
}

export function safeReturnUrl(candidate: string | null, config: Readonly<AuthConfig>): string {
    if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || /[\\\u0000-\u0020]/.test(candidate)) {
        return config.defaultAfterLoginRoute;
    }
    try {
        const decoded = decodeURIComponent(candidate);
        const path = decoded.split(/[?#;]/)[0].replace(/\/$/, "");
        const login = config.loginRoute.replace(/\/$/, "");
        if (
            decoded.startsWith("//") ||
            /[\\\u0000-\u0020]/.test(decoded) ||
            path === login ||
            path.startsWith(`${login}/`)
        ) {
            return config.defaultAfterLoginRoute;
        }
    } catch {
        return config.defaultAfterLoginRoute;
    }
    return candidate;
}
