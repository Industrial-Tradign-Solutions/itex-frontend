import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Messages } from "@config/messages";
import { AuthService } from "@services/security";
import { catchError, Observable, throwError } from "rxjs";

const MESSAGES = Messages.config.interceptors.auth;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authSV = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error.errorMessage === MESSAGES.token_error_signature) {
          error.error.errorMessage = MESSAGES.token_error_signature_response;
          this.logoutAction();
        } else if(error.error.errorMessage === MESSAGES.disable_system) {
          this.logoutAction();
        }
        return throwError(() => error );
      })
    );
  }

  private logoutAction() {
    setTimeout(() => {
      this.authSV.logoutAction();
      window.location.reload();
    }, 5000);
  }
}
