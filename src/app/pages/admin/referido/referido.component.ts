
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { Token } from 'src/app/models/auth/auth.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import { DialogComponent } from 'src/app/shared/dialogo/dialog/dialog.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core'
import { ThemePalette } from '@angular/material/core';;
import * as FileSaver from 'file-saver';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-referido',
  templateUrl: './referido.component.html',
  styleUrls: ['./referido.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class ReferidoComponent implements OnInit {
  token: string = null;
  listaPerfiles: PerfilModel[] = [];
  listaCambiosPerfiles: Array<Number>;
  listaProductos: string[] = [];
  listaSegmentos: string[] = [];
  listaPerfilSelect: PerfilModel[] = [];
  form: FormGroup;
  public formFechas: FormGroup;
  minDate: Date;
  maxDate: Date;
  fInicio: string = null;
  fFin: string = null;
  nombreControlArray = 'checksReferido';
  carguePerfilesCompleto = false;
  @ViewChild('closeCrear') closeCrear;
  @ViewChild('closeReporte') closeReporte;
  strJson: string;
  formPerfil: FormGroup;
  modalActivo: boolean;

  color: ThemePalette = 'warn';

  constructor(private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private storageService: StorageService
    , private admPerfilesService: AdmPerfilesService
    , public dialog: MatDialog
    , private fc: FormBuilder
    , private fb: FormBuilder
    , private formBuilder: FormBuilder) {

    this.form = this.fc.group({
      nombre: [null, [Validators.required]],
    });
    this.formFechas = this.formBuilder.group({
      fechaInicio: [null],
      fechaFin: [null]
    });

    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 100, 0, 1);
    this.maxDate = new Date();
  }


  ngOnInit(): void {
    this.cargarPerfiles();
    this.cargarProductos();
    this.cargarSegmentos();
  }

  addControlFormArray(value: any) {
    const control = <FormArray>this.formPerfil.controls[this.nombreControlArray];
    let itemControl = new FormControl();
    itemControl.setValue(value);
    control.push((itemControl));
  }

  cargarPerfiles() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let perfil: PerfilModel = new PerfilModel();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPerfiles(perfil, this.token).subscribe((resp: respuestaPerfilModel) => {
        this.listaPerfiles = resp.listaPerfiles;
        this.carguePerfilesCompleto = true;
        this.listaCambiosPerfiles = new Array();
        //agregar controles
        this.construirForm();
        this.listaPerfiles.forEach(perfil => {
          this.addControlFormArray(perfil.isReferido == 1);
        });
        //activan valueChanges a los controles creados
        const controles = <FormArray>this.formPerfil.controls[this.nombreControlArray];
        for (let index = 0; index < controles.length; index++) {
          this.formPerfil.controls[this.nombreControlArray].get(index.toString()).valueChanges.subscribe(perfilModficado => {
            if (this.listaPerfiles[index].isReferido == perfilModficado) {
              if (this.listaCambiosPerfiles.includes(index)) {
                this.listaCambiosPerfiles.splice(this.listaCambiosPerfiles.indexOf(index), 1);
              }
              return;
            }
            if (!this.listaCambiosPerfiles.includes(index)) {
              this.listaCambiosPerfiles.push(index);
            }
          });

        }//fin adicion valueChanges   
        Swal.close();
      });
    });
  }

  isPermiso(perfilConsultar: PerfilModel) {
    return this.listaPerfiles.some(perfil => perfil.isReferido === perfilConsultar.isReferido)
  }


  construirForm() {
    this.formPerfil = this.fb.group({
      checksReferido: this.fb.array([])
    });
  }



  perfilSelect(perfil: any, event) {
    if (event.checked) {
      this.listaPerfilSelect.push(perfil);
    } else {
      this.listaPerfilSelect.splice(this.listaPerfilSelect.indexOf(perfil), 1);
    }
  }


  cargarProductos() {
    if (this.storageService.getValuePropiedad(Constantes.PRODUCTOS_REFERIDOS) != " ") {
      this.listaProductos = this.storageService.getValuePropiedad(Constantes.PRODUCTOS_REFERIDOS).split(',');
    }
  }

  cargarSegmentos() {
    if (this.storageService.getValuePropiedad(Constantes.SEGMENTO_REFERIDOS) != " ") {
      this.listaSegmentos = this.storageService.getValuePropiedad(Constantes.SEGMENTO_REFERIDOS).split(',');
    }
  }





  actualizarPerfiles() {
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar la información?'
    });
    dialogRefActualizar.afterClosed().subscribe(res => {
      if (res) {
        if (this.listaCambiosPerfiles.length != 0) {
          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let numIndex: number = 0;
          let numError: number = 0;
          this.listaCambiosPerfiles.forEach(indice => {
            numIndex++
            let perfilGuardar = this.listaPerfiles[Number(indice)];
            perfilGuardar.isReferido = this.formPerfil.controls[this.nombreControlArray].get(indice.toString()).value;

            perfilGuardar.isReferido = (perfilGuardar.isReferido) ? 1 : 0;
            this.ligaService.actualizarPerfil(perfilGuardar, this.token).subscribe((resp: respuestaPerfilModel) => {

              if (resp.codigo == Constantes.CODIGO_EXITOSO) {
                if (numIndex++ == this.listaCambiosPerfiles.length) {
                  this.listaCambiosPerfiles = [];
                  this.cargarPerfiles();
                  Swal.close();
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');
                }
              }
              else {
                numError++;
                if (numError == 1) {
                  this.listaCambiosPerfiles = [];
                  this.cargarPerfiles();
                  Swal.close();
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
                }
              }
            });

          });

        } else {
          this.generalService.mostrarMensaje('Success', 'No hay cambios por realizar.', 'success');
        }
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  eliminarSegmento(segmento: number) {
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea eliminar segmento?'
    });
    dialogRefActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION;
        parametros.nombre = Constantes.SEGMENTO_REFERIDOS;
        this.listaSegmentos.splice(segmento, 1);
        if (this.listaSegmentos.length == 0) {
          parametros.valor = ' ';
        } else {
          parametros.valor = '';
        }
        for (let index = 0; index < this.listaSegmentos.length; index++) {
          if ((index + 1) != this.listaSegmentos.length) {
            parametros.valor = parametros.valor + this.listaSegmentos[index] + ","
          } else {
            parametros.valor = parametros.valor + this.listaSegmentos[index]
          }
        }
        this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
              if (parametrosEAFResponse.cursorparametros.parametros != null) {
                this.storageService.actualizarPropiedad(parametrosEAFResponse.cursorparametros.parametros);
                Swal.close();
                this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
                this.cargarSegmentos();
                return;
              }
            });
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  eliminarProducto(producto: number) {
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea eliminar producto?'
    });
    dialogRefActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION;
        parametros.nombre = Constantes.PRODUCTOS_REFERIDOS;
        this.listaProductos.splice(producto, 1);

        if (this.listaProductos.length == 0) {
          parametros.valor = ' ';
        } else {
          parametros.valor = '';
        }

        for (let index = 0; index < this.listaProductos.length; index++) {
          if ((index + 1) != this.listaProductos.length) {
            parametros.valor = parametros.valor + this.listaProductos[index] + ","
          } else {
            parametros.valor = parametros.valor + this.listaProductos[index]
          }
        }
        this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
              if (parametrosEAFResponse.cursorparametros.parametros != null) {
                this.storageService.actualizarPropiedad(parametrosEAFResponse.cursorparametros.parametros);
                Swal.close();
                this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
                this.cargarProductos();
                return;
              }
            });
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  activaModal(modalAct: number) {
    this.form.reset();
    if (modalAct == 1) {
      this.modalActivo = true;
    } else if (2) {
      this.modalActivo = false;
    }

  }

  guardar(form: any, modalAct: boolean) {
    this.closeCrear.nativeElement.click();
    const dialogGuardar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar la información?'
    });

    dialogGuardar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let aux = form.nombre;
        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION;
        parametros.valor = '';
        if (modalAct) {
          parametros.nombre = Constantes.PRODUCTOS_REFERIDOS;
          this.listaProductos.push(aux);
          for (let index = 0; index < this.listaProductos.length; index++) {
            if ((index + 1) != this.listaProductos.length) {
              parametros.valor = parametros.valor + this.listaProductos[index] + ","
            } else {
              parametros.valor = parametros.valor + this.listaProductos[index]
            }
          }
        } else {
          parametros.nombre = Constantes.SEGMENTO_REFERIDOS;
          this.listaSegmentos.push(aux);
          for (let index = 0; index < this.listaSegmentos.length; index++) {
            if ((index + 1) != this.listaSegmentos.length) {
              parametros.valor = parametros.valor + this.listaSegmentos[index] + ","
            } else {
              parametros.valor = parametros.valor + this.listaSegmentos[index]
            }
          }
        }
        this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
              if (parametrosEAFResponse.cursorparametros.parametros != null) {
                this.storageService.actualizarPropiedad(parametrosEAFResponse.cursorparametros.parametros);
                Swal.close();
                this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
                this.form.reset();
                if (modalAct) {
                  this.cargarProductos();
                } else {
                  this.cargarSegmentos();
                }
                return;
              }
            });
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      } else {
        document.getElementById("modal").click();
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  decargarConsolidadoReferidos(value: any) {
    this.closeReporte.nativeElement.click();
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea Descargar el Consolidao de Referidos?'
    });
    dialogRefActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Descargando',
          allowOutsideClick: false
        });
        if (value.fechaInicio && value.fechaFin) {
          this.fInicio = value.fechaInicio.getDate().toString() + "/" + (value.fechaInicio.getMonth() + 1) + "/" + value.fechaInicio.getFullYear();
          this.fFin = value.fechaFin.getDate().toString() + "/" + (value.fechaFin.getMonth() + 1) + "/" + value.fechaFin.getFullYear();
        }
        Swal.showLoading();
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.decargarConsolidadoReferidos(this.strJson, this.fInicio, this.fFin, this.token).subscribe(resp => {
            let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
            FileSaver.saveAs(blob, "Consolidado_Referidos_" + new Date());
            this.formFechas.reset();
            this.fInicio = null;
            this.fFin = null;
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

  limpiarForm() {
    this.formFechas.reset();
  }

  validarFormFechas() {

    if (this.formFechas.get('fechaInicio').value || this.formFechas.get('fechaFin').value) {
      return true
    } else { }
    return false
  }

  getMensajeError(value: any): string {
    let msg;
    if (this.form.get(value).hasError('required')) {
      msg = `*El campo ${value} es requerido.`
    }
    return msg;
  }

  isValido(value: any): boolean {
    return (this.form.get(value).touched || this.form.get(value).dirty
      && !this.form.get(value).valid)
  }

}
