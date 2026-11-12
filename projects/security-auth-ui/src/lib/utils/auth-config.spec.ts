import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { authInterceptor } from "../interceptor/authInterceptor";
import { AUTH_CONFIG, provideAuthConfig, safeReturnUrl } from "./auth-config";
import { SKIP_AUTH_REDIRECT, SKIP_CSRF } from "./auth-context";
import { OauthService } from "../service/auth.service";

describe("Configurable authentication", () => {
    let http: HttpTestingController;
    let client: HttpClient;
    let navigate: jasmine.Spy;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideAuthConfig({
                    apiBaseUrl: "/backend",
                    sessionPath: "/api/session",
                    csrfPath: "/api/csrf",
                    loginRoute: "/entrar",
                    defaultAfterLoginRoute: "/inicio",
                }),
                provideRouter([]),
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        client = TestBed.inject(HttpClient);
        navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
    });
    afterEach(() => http.verify());

    it("checks the configured session without redirecting on 401", () => {
        TestBed.inject(OauthService)
            .isLoggedIn()
            .subscribe((value) => expect(value).toBeFalse());
        http.expectOne("/backend/api/session").flush(null, { status: 401, statusText: "Unauthorized" });
        expect(navigate).not.toHaveBeenCalled();
    });

    it("uses the configured login route for expired sessions", () => {
        client.get("/backend/api/data").subscribe({ error: () => {} });
        http.expectOne("/backend/api/data").flush(null, { status: 401, statusText: "Unauthorized" });
        expect(navigate).toHaveBeenCalledWith(["/entrar"], { queryParams: { returnUrl: "/" } });
    });

    it("obtains CSRF from the configured endpoint before logout", () => {
        TestBed.inject(OauthService).logout().subscribe();
        http.expectOne("/backend/api/csrf").flush({ headerName: "X-CSRF-TOKEN", token: "value" });
        const logout = http.expectOne("/backend/logout");
        expect(logout.request.headers.get("X-CSRF-TOKEN")).toBe("value");
        logout.flush(null);
    });

    it("allows an explicit CSRF exception without disabling the default", () => {
        client.post("/backend/public", {}, { context: new HttpContext().set(SKIP_CSRF, true) }).subscribe();
        const request = http.expectOne("/backend/public");
        expect(request.request.headers.has("X-CSRF-TOKEN")).toBeFalse();
        http.expectNone("/backend/api/csrf");
        request.flush(null);
    });

    it("allows callers to handle their own unauthorized response", () => {
        client
            .get("/backend/data", { context: new HttpContext().set(SKIP_AUTH_REDIRECT, true) })
            .subscribe({ error: () => {} });
        http.expectOne("/backend/data").flush(null, { status: 401, statusText: "Unauthorized" });
        expect(navigate).not.toHaveBeenCalled();
    });

    it("does not intercept unrelated URLs sharing the prefix", () => {
        client.post("/backend-other/data", {}).subscribe();
        http.expectOne("/backend-other/data").flush(null);
        http.expectNone("/backend/api/csrf");
    });

    it("rejects external return destinations and the configured login route", () => {
        const config = TestBed.inject(AUTH_CONFIG);
        for (const value of [
            "https://evil.example",
            "//evil.example",
            "/%2fevil.example",
            "/entrar",
            "/entrar?x=1",
            "/\\evil",
            "/%5cevil",
            "/%zz",
        ]) {
            expect(safeReturnUrl(value, config)).withContext(value).toBe("/inicio");
        }
        expect(safeReturnUrl("/restaurantes?page=2", config)).toBe("/restaurantes?page=2");
    });
});
