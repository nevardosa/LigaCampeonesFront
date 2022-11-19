import { Component, OnInit, ViewChild } from '@angular/core';
import { ResponseResumenPuntos, resumenPuntosDTO } from '../../../models/puntos-canjes.model';
import { RequestPuntosGanadosModel, ResponsePuntosGanadosModel, DTOPuntosGanadosModel } from '../../../models/puntos-canjes.model';
import { RequestHistoricoRedencionModel, ResponseHistoricoRedencionModel, DTOHistoricoRedencionModel } from '../../../models/pedido.model';
import { ResponsePuntosVencidosModel, RequestPuntosVencidosModel, PuntosVencidosDto } from 'src/app/models/puntos-vencidos.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import Swal from 'sweetalert2';
import { Constantes } from 'src/app/shared/Constantes';
import * as FileSaver from 'file-saver';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorageService } from 'src/app/services/storage.service';
import { ValidacionesPropias } from 'src/app/shared/validacionesPersonalizadas';

@Component({
  selector: 'app-puntos-canjes',
  templateUrl: './puntos-canjes.component.html',
  styleUrls: ['./puntos-canjes.component.css']
})
export class PuntosCanjesComponent implements OnInit {
  //data
  redimidos: DTOHistoricoRedencionModel[] = [];
  ganados: DTOPuntosGanadosModel[] = [];
  cargaCompleta: boolean = false;
  cargaPuntosGanados: boolean = false;
  cargaPuntosRedimidos: boolean = false;
  cargaPuntosVencidos: boolean = false;
  resumenPuntos: resumenPuntosDTO[] = [];
  resumenPuntosdetalle: resumenPuntosDTO;
  resumenPuntosVencidos: PuntosVencidosDto[] = [];
  token: string = null;
  cedulaDetalle: string;

  //formularios
  formulario: FormGroup;
  formularioConfiguracion: FormGroup;
  formularioPuntosGanados: FormGroup;
  formularioPuntosVencidos: FormGroup;
  formularioPuntosRedimidos: FormGroup;

  //paginacion Puntos total
  numPag: number = 1;
  totalPaginas;
  tamanoPagina: number;
  totalRegistros: number;

  //paginacion Puntos Ganados
  numPagGanados: number = 1;
  totalPaginasGanados;
  tamanoPaginaGanados: number;
  totalRegistrosGanados: number;

  //paginacion Puntos Vencidos
  numPagVencidos: number = 1;
  totalPaginasVencidos;
  tamanoPaginaVencidos: number;
  totalRegistrosVencidos: number;

  //paginacion Puntos Redimidos
  numPagRedimidos: number = 1;
  totalPaginasRedimidos;
  tamanoPaginaRedimidos: number;
  totalRegistrosRedimidos: number;

  tablaPuntosTotal: number = 1;
  tablaPuntosGanados: number = 2;
  tablaPuntosVencidos: number = 3;
  tablaPuntosRedimidos: number = 4;


  dataSourcePuntos = new MatTableDataSource<resumenPuntosDTO>();
  selection = new SelectionModel<resumenPuntosDTO>();
  ColumnsPuntos: string[] = ['Cedula', 'PGanados', 'PCanjeados', 'PRestantes', 'PVencidos', 'Accion'];
  dataSourcePuntosVencidos = new MatTableDataSource<PuntosVencidosDto>();
  selectionPvencidos = new SelectionModel<resumenPuntosDTO>();
  ColumnsPuntosVencidos: string[] = ['Cedula', 'Celular', 'PGanados', 'PVencidos', 'fActivacion', 'fVencimiento', 'MVencimiento'];
  dataSourcePuntosGanados = new MatTableDataSource<DTOPuntosGanadosModel>();
  selectionPGanados = new SelectionModel<DTOPuntosGanadosModel>();
  ColumnsPuntosGanados: string[] = ['FActivacion', 'Producto', 'Cedula', 'NCta', 'Puntos', 'Estado', 'Descripcion'];
  dataSourcePuntosRedimidos = new MatTableDataSource<DTOHistoricoRedencionModel>();
  selectionPRedimidos = new SelectionModel<DTOHistoricoRedencionModel>();
  ColumnsPuntosRedimidos: string[] = ['FRedencion', 'Producto', 'EspecPremio', 'PRedimidos', 'Estado', 'MRechazo'];

  constructor(
    private fb: FormBuilder,
    private fg: FormBuilder,
    private fv: FormBuilder,
    private fr: FormBuilder
    , private storageService: StorageService
    , private ligaService: WSLigaCampeonesService
    , private authTokenService: AuthTokenService) { }

  ngOnInit(): void {
    this.tamanoPagina = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.cargarResumenPuntosTotal(null);
    this.crearFormulario();
    this.setTamanoPagina(this.tamanoPagina, this.tablaPuntosTotal);
  }

  cargarResumenPuntosTotal(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.resumenPuntos = null;
    this.cargaCompleta = false;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarResumenPuntosSinSuscripcion((cedula != null) ? cedula : null, this.numPag, this.tamanoPagina, this.token).subscribe((resp: ResponseResumenPuntos) => {

        if (resp.codigo == Constantes.CODIGO_EXITOSO) {
          this.resumenPuntos = resp.resumenPuntoDto;
          this.totalRegistros = resp.totalRegistros;
          this.dataSourcePuntos = new MatTableDataSource<resumenPuntosDTO>(this.resumenPuntos);
          let auxpag: number = resp.totalRegistros / this.tamanoPagina;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginas = new Array(auxNum);
          this.cargaCompleta = true;
        }
        Swal.close();
      });
    });
  }


  cargarDetalle(puntos: resumenPuntosDTO) {
    this.limpiartablas();
    this.cedulaDetalle = puntos.cedula;
    this.resumenPuntosdetalle = puntos;
    this.cargarPuntosGanados(this.cedulaDetalle);
    this.cargarPuntosVencidos(this.cedulaDetalle)
    this.cargarPuntosRedimidos(this.cedulaDetalle);
  }

  limpiartablas() {
    this.setPropiedadesDetalle();
    this.dataSourcePuntosGanados = null;
    this.dataSourcePuntosVencidos = null;
    this.dataSourcePuntosRedimidos = null;
    this.cedulaDetalle = null;
    this.resumenPuntosdetalle = null;

  }

  setPropiedadesDetalle() {
    this.tamanoPaginaGanados = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.tamanoPaginaVencidos = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.tamanoPaginaRedimidos = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.setTamanoPagina(this.tamanoPaginaGanados, this.tablaPuntosGanados);
    this.setTamanoPagina(this.tamanoPaginaVencidos, this.tablaPuntosVencidos);
    this.setTamanoPagina(this.tamanoPaginaRedimidos, this.tablaPuntosRedimidos);
    this.numPagGanados = 1;
    this.numPagVencidos = 1;
    this.numPagRedimidos = 1;
  }

  cargarPuntosGanados(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.ganados = null;
    this.cargaPuntosGanados = false;
    let request = new RequestPuntosGanadosModel();
    request.cedulaUsuario = cedula;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPuntosGanados(request, this.numPagGanados, this.tamanoPaginaGanados, this.token).subscribe((resp: ResponsePuntosGanadosModel) => {
        this.cargaPuntosGanados = true;
        if (resp.codigo == Constantes.CODIGO_EXITOSO) {
          this.ganados = resp.outPuntosGanadosDto;
          this.totalRegistrosGanados = resp.totalRegistros;
          this.dataSourcePuntosGanados = new MatTableDataSource<DTOPuntosGanadosModel>(this.ganados);
          let auxpag: number = resp.totalRegistros / this.tamanoPaginaGanados;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasGanados = new Array(auxNum);
        }
        Swal.close();
        ;
      });

    });

  }

  cargarPuntosVencidos(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.resumenPuntosVencidos = null;
    this.cargaPuntosVencidos = false;
    let request = new RequestPuntosVencidosModel()
    request.cedula = cedula;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPuntosVencidos(request, this.numPagVencidos, this.tamanoPaginaVencidos, this.token).subscribe((respPuntos: ResponsePuntosVencidosModel) => {

        if (respPuntos.codigo == Constantes.CODIGO_EXITOSO) {
          this.cargaPuntosVencidos = true;
          this.resumenPuntosVencidos = respPuntos.outPuntosVencidosDto;
          this.totalRegistrosVencidos = respPuntos.totalRegistros;
          this.dataSourcePuntosVencidos = new MatTableDataSource<PuntosVencidosDto>(this.resumenPuntosVencidos);
          let auxpag: number = respPuntos.totalRegistros / this.tamanoPaginaVencidos;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasVencidos = new Array(auxNum);
        }
        Swal.close();
      });
    });
  }


  cargarPuntosRedimidos(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.redimidos = null;
    this.cargaPuntosRedimidos = false;

    let request = new RequestHistoricoRedencionModel();
    request.cedula = cedula;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarHistoricoRedencion(request, this.numPagRedimidos, this.tamanoPaginaRedimidos, this.token).subscribe((resp: ResponseHistoricoRedencionModel) => {
        this.cargaPuntosRedimidos = true;
        if (resp.codigo == Constantes.CODIGO_EXITOSO) {
          this.redimidos = resp.outHistoricoRedencionDto;
          this.totalRegistrosRedimidos = resp.totalRegistros;
          this.dataSourcePuntosRedimidos = new MatTableDataSource<DTOHistoricoRedencionModel>(this.redimidos);
          let auxpag: number = resp.totalRegistros / this.tamanoPaginaRedimidos;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasRedimidos = new Array(auxNum);
        }
        Swal.close();
      });
    });
  }

  descargarDetallePuntos() {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarDetallePuntos(this.cedulaDetalle, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(blob, "DETALLE_PUNTOS_Y_CANJES_" + this.cedulaDetalle);
        Swal.close();
      });
    });
  }


  descargarResumenPuntos(cedula: string) {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarResumenPuntos(cedula, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "RESUMEN_PUNTOS_" + new Date());
        Swal.close();
      });
    });
  }

  descargarResumenPuntosVencidos(cedula: string) {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarPuntosVencidos(cedula, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "RESUMEN_PUNTOS_VENCIDOS" + new Date());
        Swal.close();
      });
    });
  }


  validarDescarga() {
    return (!this.ganados || this.ganados.length == 0) && (!this.redimidos || this.redimidos.length == 0);
  }

  crearFormulario() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formulario = this.fb.group({
      cedula: ['', [Validators.pattern(PATRON_SOLO_DIGITOS)]]
    });

    this.formularioConfiguracion = this.fb.group({
      tamanoPagina: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]
      ]
    });

    this.formularioPuntosGanados = this.fg.group({
      tamanoPagina: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]
      ]
    });

    this.formularioPuntosVencidos = this.fv.group({
      tamanoPagina: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]
      ]
    });

    this.formularioPuntosRedimidos = this.fr.group({
      tamanoPagina: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]
      ]
    });

  }


  buscar() {
    this.numPag = 1;
    this.cargarResumenPuntosTotal(this.getCedula());
  }

  getCedula() {
    return this.formulario.get("cedula").value;
  }


  consultarPagina(pagina: number, num: number) {
    if (num == 1) {
      if (pagina != this.numPag) {
        this.numPag = pagina;
        this.cargarResumenPuntosTotal(null);
      }

    } else if (num == 2) {
      if (pagina != this.numPagGanados) {
        this.numPagGanados = pagina;
        this.cargarPuntosGanados(this.cedulaDetalle);
      }
    } else if (num == 3) {
      if (pagina != this.numPagVencidos) {
        this.numPagVencidos = pagina;
        this.cargarPuntosVencidos(this.cedulaDetalle);
      }
    } else if (num == 4) {
      if (pagina != this.numPagRedimidos) {
        this.numPagRedimidos = pagina;
        this.cargarPuntosRedimidos(this.cedulaDetalle);
      }
    }
  }



  cambiarNumeroRegistros(num: number) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    if (num == 1) {
      this.tamanoPagina = this.getCantidadRegistros(this.tablaPuntosTotal);
      this.numPag = 1;
      this.setTamanoPagina(this.tamanoPagina, this.tablaPuntosTotal);
      this.cargarResumenPuntosTotal(null);

    } else if (num == 2) {
      this.tamanoPaginaGanados = this.getCantidadRegistros(this.tablaPuntosGanados);
      this.numPagGanados = 1;
      this.setTamanoPagina(this.tamanoPaginaGanados, this.tablaPuntosGanados);
      this.cargarPuntosGanados(this.cedulaDetalle);

    }

    else if (num == 3) {
      this.tamanoPaginaVencidos = this.getCantidadRegistros(this.tablaPuntosVencidos);
      this.numPagVencidos = 1;
      this.setTamanoPagina(this.tamanoPaginaVencidos, this.tablaPuntosVencidos);
      this.cargarPuntosVencidos(this.cedulaDetalle);


    } else if (num == 4) {
      this.tamanoPaginaRedimidos = this.getCantidadRegistros(this.tablaPuntosRedimidos);
      this.numPagRedimidos = 1;
      this.setTamanoPagina(this.tamanoPaginaRedimidos, this.tablaPuntosRedimidos);
      this.cargarPuntosRedimidos(this.cedulaDetalle);
    }

  }

  getCantidadRegistros(num: number): number {
    if (num == 1) {
      return this.formularioConfiguracion.get("tamanoPagina").value;

    } else if (num == 2) {
      return this.formularioPuntosGanados.get("tamanoPagina").value;

    } else if (num == 3) {
      return this.formularioPuntosVencidos.get("tamanoPagina").value;

    } else if (num == 4) {
      return this.formularioPuntosRedimidos.get("tamanoPagina").value;
    }
  }

  setTamanoPagina(cantidadRegistros: number, num: number) {
    if (num == 1) {
      this.formularioConfiguracion.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    } else if (num == 2) {
      this.formularioPuntosGanados.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    }
    else if (num == 3) {
      this.formularioPuntosVencidos.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    } else if (num == 4) {
      this.formularioPuntosRedimidos.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    }

  }

  //mesnajes de validacion al formulario
  count_validation_messages = {
    'cedula': [
      { type: 'pattern', message: 'Cedula no debe contener caracteres alfanumericos.' }
    ],
    'tamanoPagina': [
      { type: 'required', message: 'La cantidad de registros por pagina es obligatoria.' },
      { type: 'pattern', message: 'La cantidad de registros no debe contener caracteres alfanumericos.' },
      { type: 'tamanoCero', message: 'La cantidad de registros a mostrar no puede ser cero.' }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  get CedulaNoValido() {
    return this.formulario.get('cedula').invalid && this.formulario.get('cedula').touched;
  }
  get cantidadRegistrosNoValido() {
    return this.formularioConfiguracion.get('tamanoPagina').invalid && this.formularioConfiguracion.get('tamanoPagina').touched;
  }
  get cantRegistrosGanadosNoValido() {
    return this.formularioPuntosGanados.get('tamanoPagina').invalid && this.formularioPuntosGanados.get('tamanoPagina').touched;
  }
  get cantRegistrosVencidosNoValido() {
    return this.formularioPuntosVencidos.get('tamanoPagina').invalid && this.formularioPuntosVencidos.get('tamanoPagina').touched;
  }
  get cantRegistrosRedimidosNoValido() {
    return this.formularioPuntosRedimidos.get('tamanoPagina').invalid && this.formularioPuntosRedimidos.get('tamanoPagina').touched;
  }

}
