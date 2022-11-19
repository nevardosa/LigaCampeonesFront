
import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Constantes } from 'src/app/shared/Constantes';
import { DialogComponent } from 'src/app/shared/dialogo/dialog/dialog.component';
import Swal from 'sweetalert2';
import * as FileSaver from 'file-saver';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { MatDialog } from '@angular/material/dialog';
import { Token } from 'src/app/models/auth/auth.model';
import { CookieService } from 'ngx-cookie-service';
import { RequestDescargaHistoricoUsuario } from 'src/app/models/user/user.model';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'app-consultar-informacion',
  templateUrl: './consultar-informacion.component.html'
})
export class ConsultarInformacionComponent implements OnInit {
  token: string = null;
  formaConsulta: FormGroup;
  cedulaUsuario: string;
  display: boolean;
  minDate: Date;
  maxDate: Date;
  formFechasLogUsuarios: FormGroup;
  lstEstado: string[] = [];


  constructor(private fb: FormBuilder
    , private formBuilderDate: FormBuilder
    , private router: Router
    , public dialog: MatDialog
    , private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private cookieService: CookieService
    , public datepipe: DatePipe) {
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 100, 0, 1);
    this.maxDate = new Date();
    this.formFechasLogUsuarios = this.formBuilderDate.group({
      fechaInicio: [null],
      fechaFin: [null],
      activo: [null]
    });

  }

  ngOnInit(): void {
    let estado = Constantes.CONST_LISTADO_ESTADOS
    this.lstEstado=estado.split(',');
    this.crearFormularioConsulta();
  }

  crearFormularioConsulta() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaConsulta = this.fb.group({
      cedula: ['', [Validators.required
        , Validators.pattern(PATRON_SOLO_DIGITOS)]]
    });
  }

  //mesnajes de validacion al formulario
  count_validation_messages = {
    'cedula': [
      { type: 'required', message: 'El campo es obligatorio' },
      { type: 'pattern', message: 'Cedula no debe contener caracteres alfanumericos' }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  // tslint:disable-next-line: typedef
  get CedulaNoValido() {
    return this.formaConsulta.get('cedula').invalid && this.formaConsulta.get('cedula').touched;
  }

  getCedulaAConsultar() {
    return this.formaConsulta.get('cedula').value;
  }

  buscarUsuario() {
    if (this.formaConsulta.valid) {
      this.router.navigate([`/administrador/actualizacionUsuario/:${this.getCedulaAConsultar()}`]);
    }
  }


  decargarConsolidadoUsuarios() {
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea Descargar el Consolidado de Usuarios?'
    });
    dialogRefActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Descargando',
          allowOutsideClick: false
        });
        Swal.showLoading();
        this.cedulaUsuario = this.cookieService.get(Constantes.CEDULA);
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.decargarConsolidadoUsuarios(this.cedulaUsuario, this.token).subscribe(resp => {
            let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
            FileSaver.saveAs(blob, "Consolidado_Usuarios_" + new Date());
            Swal.close();
          });
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  dercargarHistoricoUsuario(formFechasLogUsuarios: any) {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let request = new RequestDescargaHistoricoUsuario();
    if (formFechasLogUsuarios.fechaInicio && formFechasLogUsuarios.fechaFin) {
      let fechaInicio = formFechasLogUsuarios.fechaInicio.getFullYear() + "/" + (formFechasLogUsuarios.fechaInicio.getMonth() + 1) + "/" + formFechasLogUsuarios.fechaInicio.getDate().toString();
      let fechaFin = formFechasLogUsuarios.fechaFin.getFullYear() + "/" + (formFechasLogUsuarios.fechaFin.getMonth() + 1) + "/" + formFechasLogUsuarios.fechaFin.getDate().toString();

      let start_date = this.datepipe.transform(fechaInicio, 'yyyy/MM/dd');
      let latest_date = this.datepipe.transform(fechaFin, 'yyyy/MM/dd');
      request.fechaInEdicion = start_date;
      request.fechaFinEdicion = latest_date;
    }
    if(formFechasLogUsuarios.activo){
      if(formFechasLogUsuarios.activo=='Activo'){
        request.activo=0;
      }
      else{
        request.activo=1;
      }
    }    
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarHistoricoUsuario(request, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "HISTORICO_USUARIOS_" + "CONSOLIDADO");
        Swal.close();
      });
    });
  }
  limpiarForm(dateForm: any){
    this.formFechasLogUsuarios.reset();
  }
}