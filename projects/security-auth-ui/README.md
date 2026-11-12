# security-auth-ui

Biblioteca Angular 18.2 para integrar aplicações com um backend OAuth2/OIDC que usa sessão HTTP e CSRF. Não é uma aplicação executável: não possui servidor, páginas de login ou rotas de negócio. A autorização dos dados continua no backend.

## Compilar e distribuir localmente

Na raiz deste workspace:

```powershell
npm ci
npm test
npm run pack:lib
```

O build fica em `dist/security-auth-ui`. O comando de empacotamento gera `security-auth-ui-0.0.1.tgz` na raiz. No frontend consumidor:

```powershell
npm install "C:/project workspace/security-auth-ui/security-auth-ui-0.0.1.tgz"
```

O pacote também pode ser publicado em um registro npm privado. A biblioteca exige Angular 18.2; outras versões principais precisam de validação e ajuste de compatibilidade.

## Registrar na aplicação

```typescript
import { provideSecurityAuth } from 'security-auth-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideSecurityAuth({
      apiBaseUrl: '/backend',
      sessionPath: '/api/session',
      csrfPath: '/api/csrf',
      logoutPath: '/logout',
      authorizationPath: '/oauth2/authorization/google',
      loginRoute: '/entrar',
      defaultAfterLoginRoute: '/inicio',
    }),
  ],
};
```

A aplicação deve declarar suas próprias rotas `/entrar` e `/inicio` e configurar o proxy correspondente. Os endpoints são concatenados com `apiBaseUrl`. No exemplo, `/backend/api/session` deve chegar a `/api/session` no servidor. Os valores padrão são base `/api`, sessão `/session`, CSRF `/csrf`, logout `/logout`, autorização `/oauth2/authorization/google`, login `/login` e destino `/`.

`provideSecurityAuth` já registra `HttpClient` e o interceptor. Para aplicações que precisam configurar HTTP separadamente, use os providers abaixo em vez dele, evitando registrar o interceptor duas vezes:

```typescript
provideAuthConfig({ loginRoute: '/entrar', defaultAfterLoginRoute: '/inicio' }),
provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
```

## Proteger telas e fazer login

```typescript
import { authGuard, OauthService } from 'security-auth-ui';

const routes: Routes = [
  { path: 'area-restrita', canActivate: [authGuard], component: AreaRestritaComponent },
];

// Em um componente: private readonly auth = inject(OauthService);
// this.auth.loginWithGoogle();
// this.auth.isLoggedIn().subscribe(...);
// this.auth.logout().subscribe(...);
```

O guard preserva a URL desejada no parâmetro `returnUrl`. A página de login deve guardar esse destino antes de sair para o Google, recuperá-lo após o retorno e validá-lo com `safeReturnUrl(candidate, inject(AUTH_CONFIG))` antes de navegar. O serviço não navega automaticamente ao concluir a autenticação.

O backend e o Google Cloud continuam responsáveis pelo callback OAuth2 e pelo destino de retorno após autenticar. O nome da página Angular pode variar sem renomear o callback do Spring.

## Erros e CSRF

Somente URLs sob a base configurada são interceptadas. GET, HEAD e OPTIONS não buscam CSRF. As demais operações obtêm um token e enviam o cabeçalho indicado pelo backend, inclusive no logout. A consulta de sessão converte 401 em `false`; falhas de servidor continuam sendo erros.

401 nas demais chamadas encaminha ao login configurado, preservando a rota. 403 é propagado para a aplicação apresentar o acesso negado, sem redirecionamento automático. A biblioteca não adiciona Bearer tokens nem habilita cookies entre origens distintas; o uso padrão é com proxy na mesma origem.

```typescript
import { HttpContext } from '@angular/common/http';
import { SKIP_CSRF, SKIP_AUTH_REDIRECT } from 'security-auth-ui';

http.post('/backend/public', body, {
  context: new HttpContext().set(SKIP_CSRF, true),
});

http.get('/backend/optional-session', {
  context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
});
```

Use `SKIP_CSRF` apenas se a política do servidor permitir explicitamente essa operação sem token. `permitAll()` não desabilita CSRF. Nenhuma dessas opções remove proteções no backend.

Exportações: `provideSecurityAuth`, `provideAuthConfig`, `AUTH_CONFIG`, `AuthConfig`, `OauthService`, `CsrfService`, `CsrfToken`, `authGuard`, `authInterceptor`, `safeReturnUrl`, `SKIP_CSRF` e `SKIP_AUTH_REDIRECT`.
