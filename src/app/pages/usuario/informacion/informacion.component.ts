import { Component, OnInit } from '@angular/core';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { RequestPuntosGanadosModel, ResponsePuntosGanadosModel, DTOPuntosGanadosModel } from '../../../models/puntos-canjes.model';
import { RequestHistoricoRedencionModel, ResponseHistoricoRedencionModel, DTOHistoricoRedencionModel } from '../../../models/pedido.model';
import { resumenPuntosDTO } from '../../../models/puntos-canjes.model';
import Swal from 'sweetalert2';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from 'src/app/shared/Constantes';
import { Observable } from 'rxjs';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { PuntosVencidosDto, RequestPuntosVencidosModel, ResponsePuntosVencidosModel } from 'src/app/models/puntos-vencidos.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorageService } from 'src/app/services/storage.service';
import { ValidacionesPropias } from 'src/app/shared/validacionesPersonalizadas';



@Component({
  selector: 'app-informacion',
  templateUrl: './informacion.component.html',
  styleUrls: ['./informacion.component.css']
})
export class InformacionComponent implements OnInit {

  redimidos: DTOHistoricoRedencionModel[] = [];
  ganados: DTOPuntosGanadosModel[] = [];
  resumenPuntosVencidos: PuntosVencidosDto[] = [];
  resumenPuntos: resumenPuntosDTO;
  resumenPuntos$: Observable<resumenPuntosDTO[]>;  
  cargaCompleta: boolean = false;
  token: string = null;
  cedulaDetalle: string;
  cargaPuntosGanados: boolean = false;
  cargaPuntosRedimidos: boolean = false;
  cargaPuntosVencidos: boolean = false;

  //formularios  
  formularioPuntosGanados: FormGroup;
  formularioPuntosVencidos: FormGroup;
  formularioPuntosRedimidos: FormGroup;


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

  tablaPuntosGanados: number = 1;
  tablaPuntosVencidos: number = 2;
  tablaPuntosRedimidos: number = 3;

  constructor(private fg: FormBuilder,
    private fv: FormBuilder,
    private fr: FormBuilder
    , private ligaService: WSLigaCampeonesService
    , private cookieService: CookieService
    , private storageService: StorageService
    , private authTokenService: AuthTokenService) { }


  ngOnInit(): void {

    this.cedulaDetalle = this.cookieService.get(Constantes.CEDULA);
    this.tamanoPaginaGanados = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.tamanoPaginaVencidos = this.tamanoPaginaGanados
    this.tamanoPaginaRedimidos = this.tamanoPaginaGanados
    this.cargarResumenPuntos();
    this.crearFormulario();
    this.setTamanoPagina(this.tamanoPaginaGanados, this.tablaPuntosGanados);
    this.setTamanoPagina(this.tamanoPaginaVencidos, this.tablaPuntosVencidos);
    this.setTamanoPagina(this.tamanoPaginaRedimidos, this.tablaPuntosRedimidos);
    this.cargarPuntosGanados(this.cedulaDetalle);
    this.cargarPuntosVencidos(this.cedulaDetalle)
    this.cargarPuntosRedimidos(this.cedulaDetalle);



  }



  cargarPuntosGanados(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.cargaPuntosGanados = false;
    let request = new RequestPuntosGanadosModel();
    request.cedulaUsuario = cedula;
    this.authTokenService.authToken().subscribe((respToken: Token) => {
      this.token = respToken.token
      this.ligaService.consultarPuntosGanados(request, this.numPagGanados, this.tamanoPaginaGanados, this.token).subscribe((respGanado: ResponsePuntosGanadosModel) => {
        this.cargaPuntosGanados = true;
        if (respGanado.codigo == Constantes.CODIGO_EXITOSO) {
          this.ganados = respGanado.outPuntosGanadosDto;
          this.totalRegistrosGanados = respGanado.totalRegistros;
          let auxpag: number = respGanado.totalRegistros / this.tamanoPaginaGanados;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasGanados = new Array(auxNum);
        }
        Swal.close();
      });
    });

  }

  cargarPuntosVencidos(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.cargaPuntosVencidos = false;
    let request = new RequestPuntosVencidosModel()
    request.cedula = cedula;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPuntosVencidos(request, this.numPagVencidos, this.tamanoPaginaVencidos, this.token).subscribe((respPuntos: ResponsePuntosVencidosModel) => {
        this.cargaPuntosVencidos = true;
        if (respPuntos.outPuntosVencidosDto.length > 0) {
          this.resumenPuntosVencidos = respPuntos.outPuntosVencidosDto;
          this.totalRegistrosVencidos = respPuntos.totalRegistros;         
          let auxpag: number = respPuntos.totalRegistros / this.tamanoPaginaVencidos;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasVencidos = new Array(auxNum);
          ;
        }
        Swal.close()
      });
    });
  }

  cargarPuntosRedimidos(cedula: string) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
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
          let auxpag: number = resp.totalRegistros / this.tamanoPaginaRedimidos;
          let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
          this.totalPaginasRedimidos = new Array(auxNum);
        }
        Swal.close();
      });
    });
  }

  cargarResumenPuntos() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarResumenPuntos(this.cookieService.get(Constantes.CEDULA), this.token);
    });
    this.resumenPuntos$ = this.ligaService.getResumenPuntos$();
    this.resumenPuntos$.subscribe(resumenPuntos => this.resumenPuntos = resumenPuntos[0]);
    this.cargaCompleta = true;
    Swal.close();
  }

  crearFormulario() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);

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

  consultarPagina(pagina: number, num: number) {
    if (num == 1) {
      if (pagina != this.numPagGanados) {
        this.numPagGanados = pagina;
        this.cargarPuntosGanados(this.cedulaDetalle);
      }
    } else if (num == 2) {
      if (pagina != this.numPagVencidos) {
        this.numPagVencidos = pagina;
        this.cargarPuntosVencidos(this.cedulaDetalle);
      }
    }

    else if (num == 3) {      
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
      this.tamanoPaginaGanados = this.getCantidadRegistros(this.tablaPuntosGanados);
      this.numPagGanados = 1;
      this.cargarPuntosGanados(this.cedulaDetalle);
      Swal.close();
    } else if (num == 2) {
      this.tamanoPaginaVencidos = this.getCantidadRegistros(this.tablaPuntosVencidos);
      this.numPagVencidos = 1;
      this.cargarPuntosVencidos(this.cedulaDetalle);
      Swal.close();
    } else if (num == 3) {
      this.tamanoPaginaRedimidos = this.getCantidadRegistros(this.tablaPuntosRedimidos);
      this.numPagRedimidos = 1;
      this.cargarPuntosRedimidos(this.cedulaDetalle);
      Swal.close();
    }

  }

  getCantidadRegistros(num: number): number {
    if (num == 1) {
      return this.formularioPuntosGanados.get("tamanoPagina").value;
    } else if (num == 2) {
      return this.formularioPuntosVencidos.get("tamanoPagina").value;
    } else if (num == 3) {
      return this.formularioPuntosRedimidos.get("tamanoPagina").value;
    }
  }

  setTamanoPagina(cantidadRegistros: number, num: number) {
    if (num == 1) {
      this.formularioPuntosGanados.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    } else if (num == 2) {
      this.formularioPuntosVencidos.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    } else if (num == 3) {
      this.formularioPuntosRedimidos.patchValue({
        tamanoPagina: cantidadRegistros,
      });
    }
  }


  //mesnajes de validacion al formulario
  count_validation_messages = {
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
