import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { parametrosDTO, ParametrosEAFResponse } from '../models/admPerfiles/propiedades.model';
import { Session } from '../models/general/session.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private localStorageService;
  
  private currentSession: Session = null;
  private prop$ = new Subject<typeof localStorage>();

  constructor(private router: Router  ) {
    this.localStorageService = localStorage;
    this.currentSession = this.loadSessionData();

  }

  loadSessionData(): Session {
    var sessionStr = this.localStorageService.getItem('session');
    return (sessionStr) ? <Session>JSON.parse(sessionStr) : null;
  }

  setCurrentSession(session: Session): void {
    this.currentSession = session;
    this.localStorageService.setItem('session', JSON.stringify(session));
    // this.localStorageService.setItem('session',this.secService.encriptString(JSON.stringify(session).toString()));
    this.prop$.next(this.localStorageService);
  }

  getProp$(): Observable<typeof localStorage> {
    return this.prop$.asObservable();
  }

  getCurrentSession(): Session {
    return this.currentSession;
  }

  removeItem(item: string): void {
    this.localStorageService.removeItem(item);
    this.currentSession = null;
  }

  isAuthenticated(): boolean {
    return (this.getCurrentToken() != null) ? true : false;
  };

  getCurrentToken(): string {
    var session = this.getCurrentSession();
    return (session && session.token) ? session.token : null;
  };

  logout(): void {
    this.localStorageService.clear();
    this.router.navigate(['/login']);
  }

  getValuePropiedad(nombrePropiedadBusqueda: string): string {
    var session = this.getCurrentSession();
    if (session == null) {
      return '';
    }
    try {
      var propiedad: parametrosDTO[] = session.propiedades.filter(propiedad => propiedad.nombre === nombrePropiedadBusqueda);
    } catch (error) {

    }
    return (propiedad && propiedad.length > 0) ? propiedad[0].valor : nombrePropiedadBusqueda;
  }

  actualizarPropiedad(parametro: any) {
     this.currentSession.propiedades = parametro;
      this.setCurrentSession(this.currentSession); 
  }
  actualizarPropiedadEspecifica(nombrePropiedad: any, nuevoValor:any) {
    var session = this.getCurrentSession();
    if (session == null) {
      return '';
    }
    try {
      const idx = session.propiedades.map(object => object.nombre).indexOf(nombrePropiedad);
      session.propiedades[idx].valor  = nuevoValor;
      this.setCurrentSession(session); 
    } catch (error) {
      console.log("ERROR: error actualizando propiedad en caché");
    }
  }
}
