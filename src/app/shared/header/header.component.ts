import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { CategoriaModel, respuestaCategoriaModel } from '../../models/categoria.model';
import { WSLigaCampeonesService } from '../../services/wsliga-campeones.service';
import { Constantes } from '../Constantes';
import { Observable, Subject } from 'rxjs';
import { resumenPuntosDTO } from '../../models/puntos-canjes.model';
import { StorageService } from '../../services/storage.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { DataStorageByStatesService } from 'src/app/services/data-storage-by-states.service';
import { PerfilModel, PerfilxCategoria, registroResponseCategoriaXPerfil, responseCategoriaXPerfil, respuestaPerfilModel } from 'src/app/models/perfil.model';
import Swal from 'sweetalert2';
import { PqrsComponent } from 'src/app/pages/pqrs/pqrs.component';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  public menu = this.cookieService.get('token');
  public admin = this.cookieService.get('admin');
  listaCategorias: registroResponseCategoriaXPerfil[] = [];
  private nombreUsuario;
  token: string = null;
  puntos$: Observable<number>;
  puntosActuales: number = 0;

  idPerfilLogueado: number;
  perfilLogueado : PerfilModel = new PerfilModel();
  vReferir :boolean =  false;
  
  activacionPqrs: boolean = false;

  constructor(private router: Router
    , private cookieService: CookieService
    , private ligaService: WSLigaCampeonesService
    , private storageService: StorageService
    , private authTokenService: AuthTokenService
    , private dataStorage: DataStorageByStatesService) {
    this.nombreUsuario = cookieService.get(Constantes.NOMBRE_USUARIO);
  }
 
  ngOnInit(): void {
    this.idPerfilLogueado = Number(this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO));
    if(this.idPerfilLogueado  ){
      this.cargarCategorias();
      this.consultarPerfiles();
    }
    const admin = this.cookieService.get(Constantes.ADMIN); 
    if (admin && admin != Constantes.TRUE) {
      // this.cargarCategorias();
      this.authTokenService.authToken().subscribe((resp: Token) => {
        this.token = resp.token
        this.ligaService.consultarResumenPuntos(this.cookieService.get(Constantes.CEDULA), this.token);
        this.puntos$ = this.ligaService.getPuntos$();
        this.puntos$.subscribe(puntos => this.puntosActuales = puntos);
      });
    }
  }
  activarMenuPQR(){
    try{
      let lista = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_CONFIGURACION_MSJ));
    
      lista.forEach(element => {
        if (element.llave == Constantes.PROP_PQR_ACTIVACION) {
          this.activacionPqrs = element.valor;
        }
      });
    } catch(e) {
      this.activacionPqrs = false;
    }
   
    return  this.activacionPqrs;
  }

  cerrarSesion() {
    this.storageService.logout();
    this.cookieService.delete('token', '/');
    this.cookieService.delete('admin', '/');
    this.cookieService.deleteAll();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      let perfilxCategoria: PerfilxCategoria = new PerfilxCategoria() ;
      perfilxCategoria.idPerfil = this.idPerfilLogueado;
      this.ligaService.consultarPerfilxCategoria(perfilxCategoria, this.token).subscribe((resp: responseCategoriaXPerfil) => {
        resp.listaPerfilesXCategoria.forEach(categoria => {
          if (categoria.estado == 1) {
            this.listaCategorias.push(categoria);
          }
        });
      });
    });
  }


  consultarPerfiles(){
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      this.perfilLogueado.idPerfil = this.idPerfilLogueado;
      this.ligaService.consultarPerfiles(this.perfilLogueado, this.token).subscribe((response: respuestaPerfilModel) => {
        Swal.close();

        if (response.codigo != Constantes.CODIGO_EXITOSO) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo consultar la informacion',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f53201'
          });
        }

        if (response.codigo == Constantes.CODIGO_EXITOSO && response.listaPerfiles) {
          this.perfilLogueado = response.listaPerfiles[0];
          this.vReferir = (this.perfilLogueado.isReferido == Constantes.CONST_REFERIR);
          return;
        }
        
      });
    });
  }

}
