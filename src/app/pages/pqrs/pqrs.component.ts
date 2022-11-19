import { Component, Input, OnInit } from '@angular/core';
import { Form, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Token } from 'src/app/models/auth/auth.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { HistoricoPqrsRequestModel, PQRModel, requestConsultarPQRModel, responseConsultaPQRModel } from 'src/app/models/pqr.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import * as FileSaver from 'file-saver';
import Swal from 'sweetalert2';
import { CategoriaModel, respuestaCategoriaModel } from 'src/app/models/categoria.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-pqrs',
  templateUrl: './pqrs.component.html',
  styleUrls: ['./pqrs.component.css']
})
export class PqrsComponent implements OnInit {
  numPag: number = 0;
  tamanoPagina: number;
  token: string = null;
  listaPQR: PQRModel[] = [];

  cargacompleta: boolean = false;
  totalRegistros: number = 0;

  lstMotivos: any[] = null;
  formReportePQRS: FormGroup;
  formularioBusqueda: FormGroup;
  minDate: Date;
  maxDate: Date;
  listaCategoriasFull: CategoriaModel[] = [];
  listaCategoriasActivas: CategoriaModel[] = [];
  requestConsulta: requestConsultarPQRModel;
  listPerfiles: PerfilModel[];
  listCanales: string[] = [];
  listTipoSolicitud: string[] = [];
  activacion: boolean = false;

  constructor(
    private ligaService: WSLigaCampeonesService
    , private authTokenService: AuthTokenService
    , private fb: FormBuilder
    , private cookieService: CookieService
    , private generalService: GeneralService
    , private activatedRoute: ActivatedRoute
    , private router: Router
    , private storageService: StorageService
  ) {

    this.formularioBusqueda = this.fb.group({
      cedulaUsuario: [null],
      canal: ['', []],
      idPQR: [null],
      tipoSolicitud: ['', []],
      idCategoria: ['', []],
      fechaRegistro: [null],
      fechaRegistroFin: [null],
      estado: ['', []],
      tipoReporte: ['', []]
    });
  }

  ngOnInit(): void {
    let lista = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_CONFIGURACION_MSJ));
    lista.forEach(element => {
      if (element.llave == Constantes.PROP_PQR_ACTIVACION) {
        this.activacion = element.valor;
      }
    });

    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    this.tamanoPagina = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.cargarCategorias();
    this.consultarMotivos();
    this.consultaPqrs(1);
    this.cargarCanales();
    this.cargarTipoSpolicitud();
    Swal.close();
  }

  consultaPqrs(pagina: number) {
    if (pagina != this.numPag && pagina != null) {
      this.numPag = pagina;
    }

    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();


    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      let request: requestConsultarPQRModel = new requestConsultarPQRModel();
      request  = this.formularioBusqueda.value;
      request.numPagina = pagina;
      request.tamanoPagina = this.tamanoPagina;
      
      request.fechaRegistro = (request.fechaRegistro != null ) ?  new Date(formatDate(request.fechaRegistro, 'yyyy-MM-dd 00:00:00', 'en-US')) : request.fechaRegistro ;
      request.fechaRegistroFin = (request.fechaRegistroFin != null ) ?  new Date(formatDate(request.fechaRegistroFin, 'yyyy-MM-dd 23:59:59', 'en-US')) : request.fechaRegistroFin ;
      
      request.tipoReporte = Constantes.CONST_TIPO_REPORTE_PQR_RESUMIDO;

      this.ligaService.consultarPQR(request, this.token).subscribe((response: responseConsultaPQRModel) => {

        Swal.close();
        if (response.codigo != Constantes.CODIGO_EXITOSO) {
          this.generalService.mostrarMensaje('ERROR', response.descripcion, "success");
          return;
        }
        this.totalRegistros = response.totalRegistros;
        this.cargacompleta = true;

        this.listaPQR = response.listaPqrs;

      });
    });
  }

  definirColorEstadoPQR(estadoPQR: string) {
    let color: string;
    switch (estadoPQR) {
      case Constantes.CONST_ESTADO_PQR_RECIBIDA: color = '#FF5733'; break;
      case Constantes.CONST_ESTADO_PQR_EN_REVISION: color = '#3498DB'; break;
      case Constantes.CONST_ESTADO_PQR_ATENDIDA: color = '#F1C40F'; break;
      default: color = '#48C9B0'; //CERRADA
        return color;
    }
  }

  irDetallePQR(idPqr) {
    let perfilLogueado = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO);
    if (perfilLogueado == Constantes.PROP_ID_PERFIL_ADMIN) {
      this.router.navigate([`administrador/pqrs/:${idPqr}`]);
    } else {
      this.router.navigate([`usuario/pqrs/:${idPqr}`]);
    }

  }

  descargarReportePQRS() {

    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {

      this.token = resp.token
      this.ligaService.decargarReportePQRS(this.formularioBusqueda.value, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "REPORTE_PQRS_" + new Date());
        Swal.close();
      });
    });
  }

  cargarCategorias() {

    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let categoria: CategoriaModel = new CategoriaModel();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarCategorias(categoria, this.token).subscribe((resp: respuestaCategoriaModel) => {
        if (resp.codigo == Constantes.CODIGO_EXITOSO) {
          this.listaCategoriasFull = resp.listaCategorias;
          resp.listaCategorias.forEach(element => {
            if (element.estado == 1) {
              categoria = element;
              this.listaCategoriasActivas.push(categoria);
            }
          });
        } else {
          this.generalService.mostrarMensaje("Error", "No fue posible cargar las categorias", "error");
        }

      });
    });
  }

  cargarCanales() {
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPerfiles(new PerfilModel(), this.token).subscribe((responsePerfil: respuestaPerfilModel) => {
        this.listPerfiles = responsePerfil.listaPerfiles;
        this.listPerfiles.forEach(element => {
          let canales = element.canales;
          let stringSeparado = canales.split('|');
          stringSeparado.forEach(item => {
            this.listCanales.push(item);
          });
        });
        this.listCanales = this.listCanales.filter((el, i, a) => i === a.indexOf(el))
      });
    });
  }

  cargarTipoSpolicitud() {
    const lista = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_TIPO_SOLICITUD));
    lista.forEach(element => {
      this.listTipoSolicitud.push(element.nombre)
    });
  }
  limpiarForm(form: FormGroup) {
    form.reset();
  }

  consultarMotivos() {
    let motivos: string = '';
    this.listaCategoriasActivas.forEach(item => {
      motivos = item.listaMotivoPqrs;
    });
  }

  esPerfilAdministrador() {
    let perfilLogueado = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO);
    return perfilLogueado == Constantes.PROP_ID_PERFIL_ADMIN;
  }
  redireccionarCreacionPQR() {
    if (this.esPerfilAdministrador()) {
      this.descargarReporte();
    } else {
      this.router.navigate([`usuario/pqrs/${Constantes.CONST_REGISTRO_NUEVO}`]);
    }
  }
  descargarReporte() {

  }

}
