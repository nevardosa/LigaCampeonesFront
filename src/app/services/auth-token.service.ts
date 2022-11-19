import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from '../shared/Constantes';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {  
  userNew: string = '10306845322';
  passNew: string = 'registroNuevo';
  constructor(private http: HttpClient
    , private cookieService: CookieService) {
    
  }

 

  authToken() {
    let url = Constantes.ENDPOINT_LIGA_CAMPEONES;
    let user: string = atob(this.cookieService.get('user'));
    let pass: string = atob(this.cookieService.get('pass'));
    let params = new HttpParams();    
    params = params.append('nombreUsuario', user);
    params = params.append('password', pass.replace("#", "\u0023"));
    return this.http.get(`${url}/auth/token`, { params: params });

  }

  authTokenRegistroNuevo() {
    let url = Constantes.ENDPOINT_LIGA_CAMPEONES;
    let user: string = this.userNew;
    let pass: string = this.passNew;    
    let params = new HttpParams();    
    params = params.append('nombreUsuario', user);
    params = params.append('password', pass.replace("#", "\u0023"));
    return this.http.get(`${url}/auth/token`, { params: params });

  }


}
