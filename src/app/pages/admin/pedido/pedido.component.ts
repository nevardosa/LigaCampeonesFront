import { Component, OnInit } from '@angular/core';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';
import { DTOHistoricoRedencionModel, Pedido, PedidoModel, RequestHistoricoRedencionModel, ResponseHistoricoRedencionModel } from '../../../models/pedido.model';
import * as FileSaver from 'file-saver';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const NAME_FILE_EXCEL_DOWNLOAD = 'RTA_PEDIDOS.xlsx';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from 'src/app/services/storage.service';
import { ValidacionesPropias } from '../../../shared/validacionesPersonalizadas';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})

export class PedidoComponent implements OnInit {
  [x: string]: any;
  tamanoPagina: number;
  numPag: number = 1;
  totalRegistros: number;
  mostrar: boolean = false;
  formaConsultaRegistros: FormGroup;
  formularioBusqueda: FormGroup;
  strJson: string;
  vacio: string;
  totalPaginas;
  pedido: PedidoModel = new PedidoModel();
  pedidoRequest: RequestHistoricoRedencionModel;
  pedidos: DTOHistoricoRedencionModel[] = [];
  cargaCompleta: boolean = false;
  token: string = null;
  public formFechas: FormGroup;
  minDate: Date;
  maxDate: Date;
  fInicio: string = null;
  fFin: string = null;

  constructor(private ligaService: WSLigaCampeonesService
    , private fb: FormBuilder
    , private formBuilder: FormBuilder
    , private cookieService: CookieService
    , private storageService: StorageService
    , private authTokenService: AuthTokenService) {
    this.formFechas = this.formBuilder.group({
      fechaInicio: [null],
      fechaFin: [null]
    });

    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 100, 0, 1);
    this.maxDate = new Date();

  }



  ngOnInit(): void {
    this.pedidoRequest = new RequestHistoricoRedencionModel;
    this.tamanoPagina = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.crearFormulario();
    this.cargarDatosTabla(1);
    this.mostrar = !(this.totalRegistros > 0);

  }
  cambiarPagina(pagina: number) {
    this.cargarDatosTabla(pagina);
  }

  cargarDatosTabla(pagina: number) {
    if (pagina != this.numPag && pagina != null) {
      this.numPag = pagina;
    }
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.cargaCompleta = false;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarHistoricoRedencion(this.pedidoRequest, this.numPag, this.tamanoPagina, this.token).subscribe((resp: ResponseHistoricoRedencionModel) => {

        if (resp.codigo == Constantes.CODIGO_EXITOSO) {
          this.pedidos = resp.outHistoricoRedencionDto;
        }
        this.cargaCompleta = true;
        this.totalRegistros = resp.totalRegistros;
        let auxpag: number = resp.totalRegistros / this.tamanoPagina;
        let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
        this.totalPaginas = new Array(auxNum);
        Swal.close();
      }
      );
    });
  }

  crearFormulario() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formularioBusqueda = this.fb.group({
      inptNombre: ['', [Validators.required]],
      inptCategoria: ['', []],
      inptProducto: ['', []],
      inptDepartamento: ['', []],
      inptEstado: ['', []]
    });

    this.formaConsultaRegistros = this.fb.group({
      inputRegistros: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]]
    });
    this.setTamanoPagina(this.tamanoPagina);
  }

  get RegistrosNoValido() {
    return this.formaConsultaRegistros.get('inputRegistros').invalid && this.formaConsultaRegistros.get('inputRegistros').touched;
  }

  //mesnajes de validacion al formulario
  count_validation_messages = {
    'inputRegistros': [
      { type: 'required', message: 'La cantidad de registros por pagina es obligatoria' },
      { type: 'pattern', message: 'La cantidad de registros no debe contener caracteres alfanumericos' },
      { type: 'tamanoCero', message: 'La cantidad de registros a mostrar no puede ser cero' }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  getAnteriorPagina() {
    this.limpiarPaginador();
    var botones = document.getElementsByClassName('numeracion-paginacion');
    this.numPag = this.numPag - 1;
    for (var i = botones.length; i > 0; i--) {
      if (i - 1 == this.numPag) {
        botones[i - 2].classList.add('active');
      }
    }
    this.cargarDatosTabla(null);
  }
  getSiguientePagina() {
    this.limpiarPaginador();
    var botones = document.getElementsByClassName('numeracion-paginacion');
    for (var i = 0; i < botones.length; i++) {
      if (i + 1 == this.numPag) {
        botones[i + 1].classList.add('active');
      }
    }
    this.numPag = this.numPag + 1;
    this.cargarDatosTabla(null);
  }

  getCantidadRegistros(): number {
    return this.formaConsultaRegistros.get("inputRegistros").value;
  }
  setTamanoPagina(cantidadRegistros: number) {
    this.formaConsultaRegistros.patchValue({
      inputRegistros: cantidadRegistros,
    });
  }
  cambiarCantRegistros() {
    this.pedidoRequest = new RequestHistoricoRedencionModel;
    if (this.formaConsultaRegistros.valid) {
      this.tamanoPagina = this.getCantidadRegistros();
      this.setTamanoPagina(this.tamanoPagina);
      this.numPag = 1;
      this.buscar();
    }
  }
  descargarPedidos(value: any) {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    
    if (value.fechaInicio && value.fechaFin) {
      this.fInicio = value.fechaInicio.getDate().toString() +"/"+ (value.fechaInicio.getMonth() + 1) +"/"+ value.fechaInicio.getFullYear();
      this.fFin = value.fechaFin.getDate().toString() +"/"+ (value.fechaFin.getMonth() + 1) +"/"+ value.fechaFin.getFullYear();
    }
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarDetallePedidos(this.strJson, this.fInicio, this.fFin, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "RESUMEN_PEDIDOS_" + new Date());
        this.formFechas.reset();
        this.fInicio = null;
        this.fFin = null;
        Swal.close();
      });
    });
  }
  async buscar() {
    this.pedidoRequest = new RequestHistoricoRedencionModel();
    this.pedidoRequest.nombre = this.formularioBusqueda.get('inptNombre').value != '' ? this.formularioBusqueda.get('inptNombre').value : this.vacio;
    this.pedidoRequest.departamento = this.formularioBusqueda.get('inptDepartamento').value != '' ? this.formularioBusqueda.get('inptDepartamento').value : this.vacio;
    this.pedidoRequest.producto = this.formularioBusqueda.get('inptProducto').value != '' ? this.formularioBusqueda.get('inptProducto').value : this.vacio;;
    this.pedidoRequest.estado = this.formularioBusqueda.get('inptEstado').value != '' ? this.formularioBusqueda.get('inptEstado').value : this.vacio;;
    this.cargarDatosTabla(1);
    await this.sleep(1000);
    this.mostrar = (this.totalRegistros > 0);

  }
  limpiar() {
    this.mostrar = !(this.totalRegistros > 0);
    this.crearFormulario();
    this.pedidoRequest = new RequestHistoricoRedencionModel();
    this.cargarDatosTabla(1);
  }
  private sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  limpiarForm() {
    this.formFechas.reset();
  }

  validarFormFechas() {

    if (this.formFechas.get('fechaInicio').value || this.formFechas.get('fechaFin').value) {
      return true
    } else { }
    return false
  }


}
