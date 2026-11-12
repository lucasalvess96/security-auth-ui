import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { authInterceptor } from "./authInterceptor";

describe("authInterceptor", () => {
    let client: HttpClient;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
            ],
        });
        client = TestBed.inject(HttpClient);
        http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());

    it("sends reads without a Bearer header or a CSRF lookup", () => {
        client.get("/api/restaurantes/pagination").subscribe();
        const request = http.expectOne("/api/restaurantes/pagination");
        expect(request.request.headers.has("Authorization")).toBeFalse();
        http.expectNone("/api/csrf");
        request.flush([]);
    });

    it("obtains a CSRF token before a mutation and attaches its declared header", () => {
        client.post("/api/restaurantes/create", { nome: "Teste" }).subscribe();
        http.expectNone("/api/restaurantes/create");
        http.expectOne("/api/csrf").flush({ token: "csrf-value", headerName: "X-CSRF-TOKEN" });
        const request = http.expectOne("/api/restaurantes/create");
        expect(request.request.headers.get("X-CSRF-TOKEN")).toBe("csrf-value");
        expect(request.request.headers.has("Authorization")).toBeFalse();
        request.flush({});
    });

    it("does not send CSRF or enable credentials for third-party requests", () => {
        client.post("https://example.com/api/data", {}).subscribe();
        const request = http.expectOne("https://example.com/api/data");
        expect(request.request.headers.has("X-CSRF-TOKEN")).toBeFalse();
        expect(request.request.withCredentials).toBeFalse();
        http.expectNone("/api/csrf");
        request.flush({});
    });

    it("redirects expired API sessions to login", () => {
        const router = TestBed.inject(Router);
        const navigate = spyOn(router, "navigate").and.resolveTo(true);
        client.get("/api/restaurantes/pagination").subscribe({ error: () => {} });
        http.expectOne("/api/restaurantes/pagination").flush(null, { status: 401, statusText: "Unauthorized" });
        expect(navigate).toHaveBeenCalledWith(["/login"], { queryParams: { returnUrl: "/" } });
    });

    it("does not redirect on forbidden responses or retry mutations", () => {
        const navigate = spyOn(TestBed.inject(Router), "navigate");
        client.post("/api/restaurantes/create", {}).subscribe({ error: () => {} });
        http.expectOne("/api/csrf").flush({ token: "csrf", headerName: "X-CSRF-TOKEN" });
        http.expectOne("/api/restaurantes/create").flush(null, { status: 403, statusText: "Forbidden" });
        expect(navigate).not.toHaveBeenCalled();
        http.expectNone("/api/restaurantes/create");
    });
});
