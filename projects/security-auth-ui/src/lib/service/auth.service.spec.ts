import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { OauthService } from "./auth.service";

describe("OauthService session authentication", () => {
    let service: OauthService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        service = TestBed.inject(OauthService);
        http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());

    it("checks the server session instead of trusting local storage", () => {
        service.isLoggedIn().subscribe((value) => expect(value).toBeTrue());
        http.expectOne("/api/session").flush(null, { status: 204, statusText: "No Content" });
    });

    it("returns false for an expired session", () => {
        service.isLoggedIn().subscribe((value) => expect(value).toBeFalse());
        http.expectOne("/api/session").flush(null, { status: 401, statusText: "Unauthorized" });
    });

    it("does not disguise a server failure as a logged-out session", () => {
        service
            .isLoggedIn()
            .subscribe({ next: () => fail("expected error"), error: (error) => expect(error.status).toBe(500) });
        http.expectOne("/api/session").flush(null, { status: 500, statusText: "Server Error" });
    });

    it("logs out on the server", () => {
        service.logout().subscribe();
        const request = http.expectOne("/api/logout");
        expect(request.request.method).toBe("POST");
        request.flush(null, { status: 204, statusText: "No Content" });
    });
});
