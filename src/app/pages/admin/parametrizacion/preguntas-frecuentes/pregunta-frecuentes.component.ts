import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Token } from 'src/app/models/auth/auth.model';
import { ImagenModel, respuestImagenModel } from 'src/app/models/imagen.model';
import { PreguntaModel, respuestPreguntaModel } from 'src/app/models/pregunta.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import { DialogComponent } from 'src/app/shared/dialogo/dialog/dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import Swal from 'sweetalert2';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-pregunta-frecuentes',
  templateUrl: './pregunta-frecuentes.component.html',
  styleUrls: ['./pregunta-frecuentes.component.css']
})
export class PreguntaFrecuentesComponent implements OnInit {
  token: string = null;
  listaPreguntas: PreguntaModel[] = [];
  listaImagenes: ImagenModel[] = [];
  preguntaActualizar: PreguntaModel;
  previewNewImg: string = null;
  activeModal: boolean = false;
  listTipoVisualizacion: any[] = [];
  formPreguntas: FormGroup;
  dataSourcePregunta = new MatTableDataSource<PreguntaModel>();
  selection = new SelectionModel<PreguntaModel>();
  @ViewChild('paginatorPregunta', { read: MatPaginator, static: true }) paginatorPregunta: MatPaginator;
  ColumnsPregunta: string[] = ['TipoPregunta', 'Pregunta', 'Respuesta', 'TipoVisualizacion', 'Accion'];
  @ViewChild('closeCrearPreguntas') closeCrearPreguntas;
  constructor(
    private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private sanitizer: DomSanitizer
    , private renderer: Renderer2
    , private router: Router
    , public dialog: MatDialog
    , private fp: FormBuilder
    , private cookieService: CookieService
  ) {
    this.formPreguntas = this.fp.group({
      tipoPregunta: [null, [Validators.required]],
      pregunta: [null, [Validators.required]],
      respuesta: [null, [Validators.required]],
      tipoVisualizacion: [null, [Validators.required]],
      idPregunta: [null],
    });
  }




  ngOnInit(): void {
    this.cargarPreguntas();
  }


  cargarPreguntas() {

    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let pregunta: PreguntaModel = new PreguntaModel();
    this.cargarlistTipoVisualizacion();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPregunta(pregunta, this.token).subscribe((respPreg: respuestPreguntaModel) => {
        if ( respPreg.codigo==200 || respPreg.listaPreguntas!= null) {
          Swal.close();
          this.listaPreguntas = respPreg.listaPreguntas;
          this.dataSourcePregunta = new MatTableDataSource<PreguntaModel>(this.listaPreguntas);
          this.dataSourcePregunta.paginator = this.paginatorPregunta;
        } 
        Swal.close();
      });

    });
  }

  cargarlistTipoVisualizacion() {
    this.listTipoVisualizacion = Constantes.TIPO_VISUALIZACION_PREGUNTA.split(',');
  }


  agregarPregunta() {
    this.activeModal = false;
    this.listaImagenes = [];
    this.formPreguntas.reset();
  }

  actualizarPregunta(pregunta: PreguntaModel) {
    this.listaImagenes = [];
    this.previewNewImg = null;
    this.preguntaActualizar = new PreguntaModel()
    this.preguntaActualizar = pregunta;
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let imagen: ImagenModel = new ImagenModel()
    imagen.idSeccion = pregunta.id;
    imagen.seccion = Constantes.SECCION_IMG;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarImagen(imagen, this.token).subscribe((respImg: respuestImagenModel) => {
        Swal.close();
        this.activeModal = true;
        if (respImg.listaImagenes.length > 0) {
          this.listaImagenes = respImg.listaImagenes.sort(function (a, b) {
            return a.id - b.id;
          });
        }
      });
    });
    this.formPreguntas.get('idPregunta').setValue(this.preguntaActualizar.id, { onlySelf: true })
    this.formPreguntas.get('tipoPregunta').setValue(this.preguntaActualizar.tipoPregunta, { onlySelf: true })
    this.formPreguntas.get('pregunta').setValue(this.preguntaActualizar.pregunta, { onlySelf: true })
    this.formPreguntas.get('respuesta').setValue(this.preguntaActualizar.respuesta, { onlySelf: true })
    this.formPreguntas.get('tipoVisualizacion').setValue(this.preguntaActualizar.tipoVisualizacion-1, { onlySelf: true })

  }


  eliminarPregunta(pregunta: PreguntaModel) {
    const dialogEliminar = this.dialog.open(DialogComponent, {
      data: '¿Desea eliminar pregunta seleccionada?'
    });

    dialogEliminar.afterClosed().subscribe(res => {

      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let imagen: ImagenModel = new ImagenModel()
        let index = 0;
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.eliminarPregunta(pregunta, this.token).subscribe((respPreg: respuestPreguntaModel) => {

            if (respPreg.codigo == Constantes.CODIGO_EXITOSO) {
              imagen.idSeccion = pregunta.id;
              imagen.seccion = Constantes.SECCION_IMG;

              this.ligaService.consultarImagen(imagen, this.token).subscribe((respImg: respuestImagenModel) => {

                if (respImg.listaImagenes.length > 0) {

                  this.listaImagenes = respImg.listaImagenes;

                  this.listaImagenes.forEach(img => {

                    this.ligaService.eliminarImagen(img, this.token).subscribe((respImg: respuestImagenModel) => {

                      if (respImg.codigo == Constantes.CODIGO_EXITOSO) {
                        index++;
                        if (index == this.listaImagenes.length) {
                          for (let i = 0; i < this.listaPreguntas.length; i++) {
                            if (this.listaPreguntas[i].id == pregunta.id) {
                              this.listaPreguntas.splice(i, 1);
                              this.listaImagenes = [];
                              break;
                            }
                          }
                          Swal.close();
                          this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'success');
                          this.cookieService.set('viewPregunta', 'Preguntas Frecuentes');
                          this.router.navigateByUrl('/registro', { skipLocationChange: true }).then(
                            () => this.router.navigate(["/administrador/parametrizacion"]));
                        }
                      }
                    });

                  });
                }
              });

            } else {
              this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'error');
              return;
            }
          });

        });
      }
    });
  }


  guardarPregunta(value: any, activeModal: boolean) {

    this.closeCrearPreguntas.nativeElement.click();
    if (activeModal) {
      const dialogActualizar = this.dialog.open(DialogComponent, {
        data: '¿Desea actualizar Preguntas?'
      });

      dialogActualizar.afterClosed().subscribe(res => {

        if (res) {
          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let pregunta = new PreguntaModel();

          this.listaImagenes.forEach(imagen => {
            if (imagen.accion == 1) {
              this.ligaService.actualizarImagen(imagen, this.token).subscribe((respImag: respuestImagenModel) => {
              },
                error => {
                  console.log(error)
                });
            } else if (imagen.accion == 2) {
              this.ligaService.crearImagen(imagen, this.token).subscribe((respImag: respuestImagenModel) => {
              },
                error => {
                  console.log(error)
                }
              );
            }
          });

          if (value.idPregunta != null) {

            pregunta.id = value.idPregunta;
            pregunta.tipoPregunta = value.tipoPregunta;
            pregunta.pregunta = value.pregunta;
            pregunta.respuesta = value.respuesta;
            pregunta.tipoVisualizacion = value.tipoVisualizacion + 1;

            this.ligaService.actualizarPregunta(pregunta, this.token).subscribe((respPreg: respuestPreguntaModel) => {

              if (respPreg.codigo == Constantes.CODIGO_EXITOSO) {
                this.limpiarListas();
                this.cargarPreguntas();
                Swal.close();
                this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'success');
              }
              else {
                Swal.close();
                this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'error');
              }
            },
              error => {
                console.log(error)
              });

          } else {
            this.limpiarListas();
            this.cargarPreguntas();
            Swal.close();
            this.generalService.mostrarMensaje('Success', 'PROCESO EXITOSO', 'success');
          }

        } else {
          document.getElementById("modalFormAct").click();
        }
      });

    } else {
      const dialogCrear = this.dialog.open(DialogComponent, {
        data: '¿Desea crear una nueva Pregunta?'
      });
      dialogCrear.afterClosed().subscribe(res => {

        if (res) {
          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let pregunta = new PreguntaModel();
          pregunta.tipoPregunta = value.tipoPregunta;
          pregunta.pregunta = value.pregunta;
          pregunta.respuesta = value.respuesta;
          pregunta.tipoVisualizacion = value.tipoVisualizacion + 1;

          this.ligaService.crearPregunta(pregunta, this.token).subscribe((respPreg: respuestPreguntaModel) => {

            if (respPreg.codigo == Constantes.CODIGO_EXITOSO) {

              let index = 0;
              this.listaImagenes.forEach(imagen => {

                imagen.idSeccion = respPreg.listaPreguntas[0].id;

                if (imagen.accion == 2) {
                  this.ligaService.crearImagen(imagen, this.token).subscribe((respImag: respuestImagenModel) => {
                    if (respImag.codigo == Constantes.CODIGO_EXITOSO) {
                      index++;
                      if (index == this.listaImagenes.length) {
                        this.limpiarListas();
                        this.cargarPreguntas();
                        Swal.close();
                        this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'success');
                      }
                    }
                  });
                }
              });
            }
            else {
              Swal.close();
              this.generalService.mostrarMensaje('Success', respPreg.descripcion, 'error');
            }
          });

        } else {
          document.getElementById("modalFormAgre").click();
        }
      });
    }
  }





  EliminarImagen(imagen: ImagenModel, index: number) {

    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea eliminar la imagen?'
    });

    dialogActualizar.afterClosed().subscribe(res => {

      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        if (this.activeModal) {
          if (imagen.id != undefined) {
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
              this.ligaService.eliminarImagen(imagen, this.token).subscribe((respImag: respuestImagenModel) => {
                if (respImag.codigo == Constantes.CODIGO_EXITOSO) {
                  this.listaImagenes.splice(index, 1);
                  Swal.close();
                  this.generalService.mostrarMensaje('Success', respImag.descripcion, 'success');
                }
              });
            });

          } else {
            this.listaImagenes.splice(index, 1);
            Swal.close();
          }

        } else {
          this.listaImagenes.splice(index, 1);
          Swal.close();
        }

      }
    });
  }


  guardarNewImagen(img: string) {
    let imagen: ImagenModel = new ImagenModel()
    imagen.imagen = img;
    if (this.preguntaActualizar != undefined && this.preguntaActualizar != null) {
      imagen.idSeccion = this.preguntaActualizar.id;
    }
    imagen.seccion = Constantes.SECCION_IMG;
    imagen.accion = 2;
    this.listaImagenes.push(imagen);
    this.previewNewImg = null;
  }


  cargarImg(event, valor: number) {
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.listaImagenes[valor].imagen = imagen.base;
      this.listaImagenes[valor].accion = 1


    })
  }

  cargarNuevaImgen(event) {
    this.previewNewImg = null;
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.previewNewImg = imagen.base;
    })
  }

  getBase64 = async ($event: any) => new Promise((resolve, reject) => {
    try {
      const unsafeImg = window.URL.createObjectURL($event);
      const image = this.sanitizer.bypassSecurityTrustUrl(unsafeImg);
      const reader = new FileReader();
      reader.readAsDataURL($event);
      reader.onload = () => {
        resolve({
          base: reader.result
        });
      };
      reader.onerror = error => {
        resolve({
          base: null
        });
      };
    } catch (e) {
      return null;
    }
  })


  limpiarListas() {
    this.listaPreguntas = [];
  }

  buscarEnTabla(filtro: string) {
    this.dataSourcePregunta.filter = filtro.trim().toLowerCase();
  }

  getMensajeError(value: any): string {
    let msg;
    if (this.formPreguntas.get(value).hasError('required')) {
      msg = `*El campo ${value} es requerido.`
    }
    return msg;
  }

  isValido(value: any): boolean {
    return (this.formPreguntas.get(value).touched || this.formPreguntas.get(value).dirty
      && !this.formPreguntas.get(value).valid)
  }


  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '0',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' }
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],

    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['italic'],
      ['fontSize'],
      ['insertImage'],
      ['textColor']
    ]
  };

}
