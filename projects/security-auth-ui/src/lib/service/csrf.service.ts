import { HttpClient, HttpContext } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AUTH_CONFIG, authEndpoint } from "../utils/auth-config";
import { SKIP_AUTH_REDIRECT } from "../utils/auth-context";

export interface CsrfToken {
    token: string;
    headerName: string;
    parameterName: string;
}

@Injectable({ providedIn: "root" })
export class CsrfService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(AUTH_CONFIG);

    getToken(): Observable<CsrfToken> {
        return this.http.get<CsrfToken>(authEndpoint(this.config, this.config.csrfPath), {
            context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
        });
    }
}
