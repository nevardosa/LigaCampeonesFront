import { HttpClient, HttpHeaders} from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { parametrosDTO, ParametrosEAFRequest, ParametrosEAFResponse } from '../models/admPerfiles/propiedades.model';
import { Token } from '../models/auth/auth.model';
import { PerfilModel, respuestaPerfilModel } from '../models/perfil.model';
import { loginSuccessModel } from '../models/user/user.model';
import { Constantes } from '../shared/Constantes';
import { AdmPerfilesService } from './api-adm-perfiles.service';
import { AuthTokenService } from './auth-token.service';
import { StorageService } from './storage.service';


// import 'rxjs/add/operator/publishReplay';
// import { ReplaySubject } from 'rxjs/ReplaySubject';
// import { pluck, share, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataStorageByStatesService {
  private url;
  private perfiles$ = new Subject<PerfilModel[]>();
  private perfilSeleccionado$ = new Subject<PerfilModel>();
  private prop$ = new Subject<parametrosDTO[]>();
  private listaPropiedades: parametrosDTO[] = [];

  //para que los demas modulos sepan cual fue el perfil logueado
  private idPerfilLogueado$ = new Subject<Number>();
  private idPerfilLogueado: Number;

  constructor(private http: HttpClient
    , private storageService: StorageService
    , private authTokenService: AuthTokenService) {

    this.prop$.subscribe(prop => {
      this.cargarPerfiles();
      this.url = Constantes.ENDPOINT_LIGA_CAMPEONES;
    });
  }

  setIdPerfilLogueado$(id: number) {
    this.idPerfilLogueado = id;
    this.idPerfilLogueado$.next(id);
  }

  cargarPerfiles() {
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      let headers = new HttpHeaders();
      headers = headers.append('authorization', `Bearer ${resp.token}`);

      return this.http.post(`${this.url}/perfil/admPerfiles?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`,
        new PerfilModel(), { headers: headers }).subscribe((resp: respuestaPerfilModel) => {
          this.perfiles$.next(resp.listaPerfiles);
        });
    });
  }

  getPerfiles$(): Observable<PerfilModel[]> {
    return this.perfiles$.asObservable();
  }

  perfilSeleccionado(perfil: PerfilModel) {
    this.perfilSeleccionado$.next(perfil);
  }

  getPerfilSeleccionado$(): Observable<PerfilModel> {
    return this.perfilSeleccionado$.asObservable();
  }

  // cargarPropiedades() {
  //   //CONSULTAR PROPIEDADES
  //   this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
  //     this.prop$.next(parametrosEAFResponse.cursorparametros.parametros);
  //     this.listaPropiedades = parametrosEAFResponse.cursorparametros.parametros;
  //   });//fin cargue de propiedades
  // }


  // getProperties$(): Observable<parametrosDTO[]> {
  //   return this.prop$.asObservable();
  // }

  // getValuePropiedad(nombrePropiedadBusqueda: string): string {
  //   try {
  //     var propiedad: parametrosDTO[] = this.listaPropiedades.filter(propiedad => propiedad.nombre === nombrePropiedadBusqueda);
  //   } catch (error) {
  //     console.log(error);
  //   }
  //   return (propiedad && propiedad.length > 0) ? propiedad[0].valor : nombrePropiedadBusqueda;
  // }

  validarSuccessFactor(usuario: string) {
    let user = new loginSuccessModel();
    user.documentNumber = usuario;
    let headers = new HttpHeaders();
    headers = headers.append('system', 'EAF');

    return this.http.post(`${this.storageService.getValuePropiedad(Constantes.ENDPOINT_SUCCESS_FACTOR)}`, user, { headers: headers });
  }
}