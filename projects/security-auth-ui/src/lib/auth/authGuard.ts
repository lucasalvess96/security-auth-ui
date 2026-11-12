import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import { AUTH_CONFIG } from "../utils/auth-config";
import { OauthService } from "../service/auth.service";

export const authGuard: CanActivateFn = (_route, state) => {
    const auth = inject(OauthService);
    const config = inject(AUTH_CONFIG);
    const router = inject(Router);

    return auth.isLoggedIn().pipe(
        map(
            (authenticated) =>
                authenticated ||
                router.createUrlTree([config.loginRoute], {
                    queryParams: { returnUrl: state.url },
                }),
        ),
    );
};
