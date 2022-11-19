import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';

import { ValidToken } from 'src/app/models/auth/auth.model';
import { cursorparametros, parametrosDTO, ParametrosEAFResponse } from '../models/admPerfiles/propiedades.model';
import { Session } from '../models/general/session.model';
import { Constantes } from '../shared/Constantes';
import { AdmPerfilesService } from './api-adm-perfiles.service';
import { GeneralService } from './api-ser-general.service';

import { AuthTokenService } from './auth-token.service';
import { StorageService } from './storage.service';
import { WSLigaCampeonesService } from './wsliga-campeones.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  tokenCambio: ValidToken[] = [];
  constructor(private router: Router
    , private activatedRoute: ActivatedRoute
    , private cookieService: CookieService
    , private storageService: StorageService
    , private ligaService: WSLigaCampeonesService
    , private admPerfilesService: AdmPerfilesService
    , private generalService: GeneralService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Observable<boolean>(obs => {
      //const token = route.queryParams.token;
      if (route.routeConfig.path == "cambiarContrasena/:token") {

         //CONSULTAR PROPIEDADES
        this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          this.actualizarPropiedadesSesion (parametrosEAFResponse.cursorparametros.parametros);
          this.ligaService.cargarInformacionBasica();
          
          let token = new String(route.params.token);
          token = token.substring(1, token.length);
          
          this.ligaService.validarToken(token).subscribe((tokenValido: ValidToken) => {
            if (tokenValido.codigo != -1) {
              obs.next(true);
              return true;
            }
            else {
              obs.next(false);
              return false;
            }
          }, error => {
            obs.next(false);
          });
        });//fin cargue de propiedades        
      }
      else {
        if (this.cookieService.get('token')) {
          obs.next(true);
        }
        else{
          this.storageService.logout();
          obs.next(false);
        }
       
      }
    });
  }


  actualizarPropiedadesSesion(cursorparametros: parametrosDTO[]){
    let session: Session = {
      token: null,
      uuid: this.generalService.UUID,
      propiedades: cursorparametros
    };
    this.storageService.setCurrentSession(session);
  }
}
