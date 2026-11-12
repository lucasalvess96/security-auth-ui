import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { firstValueFrom, Observable, of } from "rxjs";
import { OauthService } from "../service/auth.service";
import { authGuard } from "./authGuard";

describe("authGuard", () => {
    let auth: jasmine.SpyObj<OauthService>;
    beforeEach(() => {
        auth = jasmine.createSpyObj("OauthService", ["isLoggedIn"]);
        TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: OauthService, useValue: auth }] });
    });

    const runGuard = () =>
        TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, { url: "/restaurantes?pagina=2" } as RouterStateSnapshot),
        ) as Observable<boolean | UrlTree>;

    it("allows a session confirmed by the backend", async () => {
        auth.isLoggedIn.and.returnValue(of(true));
        expect(await firstValueFrom(runGuard())).toBeTrue();
    });

    it("returns a login UrlTree preserving the requested route", async () => {
        auth.isLoggedIn.and.returnValue(of(false));
        const result = await firstValueFrom(runGuard());
        expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
            "/login?returnUrl=%2Frestaurantes%3Fpagina%3D2",
        );
    });
});
