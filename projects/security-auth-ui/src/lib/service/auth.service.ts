import { DOCUMENT } from "@angular/common";
import { HttpClient, HttpContext, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, of, throwError } from "rxjs";
import { AUTH_CONFIG, authEndpoint } from "../utils/auth-config";
import { SKIP_AUTH_REDIRECT } from "../utils/auth-context";

@Injectable({ providedIn: "root" })
export class OauthService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(AUTH_CONFIG);
    private readonly document = inject(DOCUMENT);

    isLoggedIn(): Observable<boolean> {
        return this.http
            .get<void>(authEndpoint(this.config, this.config.sessionPath), {
                context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
            })
            .pipe(
                map(() => true),
                catchError((error: HttpErrorResponse) => (error.status === 401 ? of(false) : throwError(() => error))),
            );
    }

    loginWithGoogle(): void {
        this.document.defaultView?.location.assign(authEndpoint(this.config, this.config.authorizationPath));
    }

    logout(): Observable<void> {
        return this.http.post<void>(authEndpoint(this.config, this.config.logoutPath), null);
    }
}
