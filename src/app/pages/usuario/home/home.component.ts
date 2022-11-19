import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ProductoModel, respuestaArticuloModel, articulosRTAModel } from '../../../models/articulo.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from '../../../services/storage.service';
import { Observable } from 'rxjs';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  articulosDestacados: articulosRTAModel[] = [];
  articulosMasRedimidos: articulosRTAModel[] = [];
  prueba = new Array(12);
  cargaCompleta: boolean = false;
  puntosActuales: number; //variable para mostrar mensaje warning en la pantalla principal
  puntos$: Observable<number>;
  idsImages: string[] = [];
  token: string = null;
  politicas: boolean = false;
  previewBanners = new Array();

  constructor(private router: Router
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private storageService: StorageService
    , private admPerfilesService: AdmPerfilesService
    , private authTokenService: AuthTokenService) {

  }

  ngOnInit(): void {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let numImg: number = Number(this.storageService.getValuePropiedad(Constantes.CANTIDAD_IMG));
    this.previewBanners = new Array(numImg);
    let posicion: number;
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION_BANNER, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametrosBanner: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        parametrosBanner.forEach(element => {
          posicion = Number(element.nombre.substring(element.nombre.length - 1));
          this.previewBanners[posicion] = element.valor;
        });

        for (let index = 0; index < this.previewBanners.length; index++) {
          if (this.previewBanners[index] != null) {
            this.idsImages.push(this.previewBanners[index]);
          }
        }
      }
    });
    this.cargarArticulosDestacados();
    this.puntosActuales = this.ligaService.puntosActuales;
  }

  cargarArticulosDestacados() {
    let articulo = new ProductoModel();
    articulo.destacado = 1;
    articulo.estado = 1;//indica que el los articulos sean publicados
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarArticulos(articulo, 1, 10, this.token).subscribe((resp: respuestaArticuloModel) => {
        this.articulosDestacados = resp.crudProductosDto;
        this.cargarArticulosMasRedimidos();
      });
    });
  }
  cargarArticulosMasRedimidos() {
    let articulo = new ProductoModel();
    articulo.masRedimido = 1;
    articulo.estado = 1;//indica que el los articulos sean publicados
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarArticulos(articulo, 1, 10, this.token).subscribe((resp: respuestaArticuloModel) => {
        this.articulosMasRedimidos = resp.crudProductosDto;
        this.cargaCompleta = true;
        Swal.close();
        this.loadScripts();
        this.politicas = JSON.parse(this.storageService.getValuePropiedad(Constantes.ESTADO_POLITICAS_VIGENTES));

        if (this.politicas) {
          this.generalService.mostrarMensaje(this.storageService.getValuePropiedad(Constantes.TITULO_POLITICAS_VIGENTES), this.storageService.getValuePropiedad(Constantes.POLITICAS_VIGENTES), '');
        }
      });
    });
  }
  recibirCantidad(idProducto: number, cantidad: number) {
    if (cantidad == 0) {
      this.generalService.mostrarMensaje('ERROR', 'Para redimir debe tener minimo 1 unidad!', 'error');
      return;
    }
    this.router.navigate([`/usuario/redimir/${idProducto}/${cantidad}`]);
  }

  loadScripts() {
    const dynamicScripts = [
      'assets/JS/admin_styles.js'
    ];
    for (let i = 0; i < dynamicScripts.length; i++) {
      const node = document.createElement('script');
      node.src = dynamicScripts[i];
      node.type = 'text/javascript';
      node.async = false;
      document.getElementsByTagName('head')[0].appendChild(node);
    }
  }
}
