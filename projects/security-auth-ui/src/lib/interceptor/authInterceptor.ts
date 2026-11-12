import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, switchMap, throwError } from "rxjs";
import { CsrfService } from "../service/csrf.service";
import { AUTH_CONFIG, authEndpoint, isAuthApiUrl } from "../utils/auth-config";
import { SKIP_AUTH_REDIRECT, SKIP_CSRF } from "../utils/auth-context";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const config = inject(AUTH_CONFIG);
    if (!isAuthApiUrl(config, request.url)) return next(request);

    const csrf = inject(CsrfService);
    const router = inject(Router);
    const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
    const response =
        safeMethod || request.context.get(SKIP_CSRF)
            ? next(request)
            : csrf
                  .getToken()
                  .pipe(
                      switchMap(({ headerName, token }) =>
                          next(request.clone({ setHeaders: { [headerName]: token } })),
                      ),
                  );

    return response.pipe(
        catchError((error: HttpErrorResponse) => {
            const path = request.url.split(/[?#]/)[0];
            const isSessionCheck = path === authEndpoint(config, config.sessionPath);
            const onLoginPage =
                router.url.split(/[?#;]/)[0].replace(/\/$/, "") === config.loginRoute.replace(/\/$/, "");
            if (error.status === 401 && !isSessionCheck && !request.context.get(SKIP_AUTH_REDIRECT) && !onLoginPage) {
                void router.navigate([config.loginRoute], { queryParams: { returnUrl: router.url } });
            }
            return throwError(() => error);
        }),
    );
};
