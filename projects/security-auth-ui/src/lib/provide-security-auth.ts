import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { authInterceptor } from "./interceptor/authInterceptor";
import { AuthConfig, provideAuthConfig } from "./utils/auth-config";

/** Registers HTTP and authentication providers; configure application routes separately. */
export function provideSecurityAuth(config: Partial<AuthConfig> = {}): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideAuthConfig(config),
        provideHttpClient(withInterceptors([authInterceptor])),
    ]);
}
