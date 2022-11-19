import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Token } from 'src/app/models/auth/auth.model';
import { CategoriaModel, respuestaCategoriaModel } from 'src/app/models/categoria.model';
import { AuxTablaPerfilxCategoria, PerfilModel, PerfilxCategoria, respuestaPerfilModel, responseCategoriaXPerfil } from 'src/app/models/perfil.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import { DialogComponent } from 'src/app/shared/dialogo/dialog/dialog.component';




import Swal from 'sweetalert2';

@Component({
  selector: 'app-categoria',
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.css']
})
export class CategoriaComponent implements OnInit {
  token: string = null;
  listaCategoriasActivas: CategoriaModel[] = [];
  listaMotivos: string[] = [];
  listaCategoriasFull: CategoriaModel[] = [];
  listaPerfiles: PerfilModel[] = [];
  listaPerfilxCategoria: PerfilxCategoria[] = [];
  auxTablaPerfilxCategoria: AuxTablaPerfilxCategoria[] = [];
  mostrarPerfil: boolean = false;
  formPerfil: FormGroup;
  formCategoria: FormGroup;
  nombreArray: string = 'arrayPerfilxCategorias';
  matrizPerfilxCategoria = new Array(2);
  listaRelacionModificada: number[] = [];
  listaMotivosCategorias: string;
  activeModal = false;
  estadoCategoria: string = null;
  listTipoRendecion: any[] = []; 
  @ViewChild('closeListCategoria') closeListCategoria;
  @ViewChild('closeCrearCategoria') closeCrearCategoria;


  constructor(private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , public dialog: MatDialog
    , private fb: FormBuilder
    , private fc: FormBuilder) {

    this.formCategoria = this.fc.group({
      estado: [null, [Validators.required]],
      tipoRedencion: [null, [Validators.required]],
      nombreCategoria: [null, [Validators.required]],
      orden: [null, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      idCategoria: [null],
      isPendiente: [null],
      listaMotivoPqrs: [null, [Validators.required]]
    });

  }

  ngOnInit(): void {
    this.construirFormPerfil();
    this.cargarCategorias();

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
        let categoria: CategoriaModel;
        this.listaCategoriasFull = resp.listaCategorias;
        resp.listaCategorias.forEach(element => {
          if (element.estado == 1) {
            categoria = element;
            this.listaCategoriasActivas.push(categoria);
          }
        });
      });
      this.cargarPerfiles();
      this.cargarlistTipoRendecion();
    });
  }

  cargarlistTipoRendecion(){
    this.listTipoRendecion = Constantes.TIPO_REDENCION.split(',');
  }

  cargarPerfiles() {
    let perfil: PerfilModel = new PerfilModel();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPerfiles(perfil, this.token).subscribe((resp: respuestaPerfilModel) => {
        this.listaPerfiles = resp.listaPerfiles;
        this.cargarPerfilxCategoria();
      });
    });
  }

  cargarPerfilxCategoria() {
    for (let index = 0; index < this.listaPerfiles.length; index++) {
      this.matrizPerfilxCategoria[index] = new Array(this.listaCategoriasActivas.length);
    }

    let perfilxCategoria: PerfilxCategoria = new PerfilxCategoria();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPerfilxCategoria(perfilxCategoria, this.token).subscribe((resp: responseCategoriaXPerfil) => {
        this.listaPerfilxCategoria = resp.listaPerfilesXCategoria;
        //se agrega controles de formulario a cada check
        this.construirFormPerfil();
        for (let indexPerfil = 0; indexPerfil < this.listaPerfiles.length; indexPerfil++) {
          for (let indexCategoria = 0; indexCategoria < this.listaCategoriasActivas.length; indexCategoria++) {
            this.addControlFormArray(this.isPermiso(this.listaPerfiles[indexPerfil], this.listaCategoriasActivas[indexCategoria]));
            this.matrizPerfilxCategoria[indexPerfil][indexCategoria] = this.isPermiso(this.listaPerfiles[indexPerfil], this.listaCategoriasActivas[indexCategoria]);
          }
        }
        const controles = <FormArray>this.formPerfil.controls[this.nombreArray];
        for (let index = 0; index < controles.length; index++) {
          this.formPerfil.controls[this.nombreArray].get(index.toString()).valueChanges.subscribe(relacionModficado => {
            let posicion = this.getPosicion(index);
            let x = posicion.split(',')[0];
            let y = posicion.split(',')[1];
            if (this.matrizPerfilxCategoria[x][y] == relacionModficado) {
              if (this.listaRelacionModificada.includes(index)) {
                this.listaRelacionModificada.splice(this.listaRelacionModificada.indexOf(index), 1);
              }
              return;
            }
            if (!this.listaRelacionModificada.includes(index)) {
              this.listaRelacionModificada.push(index);
            }
          });
        }
        this.mostrarPerfil = true;
        Swal.close();
      });
    });

  }


  isPermiso(perfil: PerfilModel, categoria: CategoriaModel) {
    return this.listaPerfilxCategoria.some(perfilxCategoria => perfilxCategoria.idPerfil === perfil.idPerfil && perfilxCategoria.idCategoria === categoria.idCategoria)
  }

  construirFormPerfil() {
    this.formPerfil = this.fb.group({
      arrayPerfilxCategorias: this.fb.array([])
    });
  }


  addControlFormArray(value: any) {
    const control = <FormArray>this.formPerfil.controls[this.nombreArray];
    let itemControl = new FormControl();
    itemControl.setValue(value);
    control.push((itemControl));
  }


  getPosicion(indexControl: any): string {
    let y: number = indexControl % this.listaCategoriasActivas.length;
    let x: number = indexControl / this.listaCategoriasActivas.length;

    let int_part = Math.trunc(x); // returns 3
    let float_part = Number((x - int_part).toFixed(2)); // return 0.2
    x = float_part > 0 ? x + 1 : x;
    x = (y > 0) ? x - 1 : x;
    return Math.trunc(x) + ',' + y;
  }


  guardar() {
    const dialogRefActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar la información?'
    });

    dialogRefActualizar.afterClosed().subscribe(res => {

      if (res) {

        if (this.listaRelacionModificada.length != 0) {

          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let num: number = 0;
          for (let index = 0; index < this.listaRelacionModificada.length; index++) {
            let posicion = this.getPosicion(this.listaRelacionModificada[index]);
            let x = posicion.split(',')[0];
            let y = posicion.split(',')[1];
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
            });
            let pxc = new PerfilxCategoria();
            pxc.idCategoria = this.listaCategoriasActivas[y].idCategoria;
            pxc.idPerfil = this.listaPerfiles[x].idPerfil;

            if (this.formPerfil.controls[this.nombreArray].get(this.listaRelacionModificada[index].toString()).value) {

              this.ligaService.crearPerfilxCategoria(pxc, this.token).subscribe((resp: respuestaPerfilModel) => {

                if (resp.codigo == Constantes.CODIGO_EXITOSO) {
                  if ((index + 1) == this.listaRelacionModificada.length) {
                    this.listaRelacionModificada = [];
                    this.cargarPerfilxCategoria();
                    Swal.close();
                    this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');
                  }

                }
                else {
                  num++;
                  if (num == 1) {
                    this.listaRelacionModificada = [];
                    this.cargarPerfilxCategoria();
                    Swal.close();
                    this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
                  }
                }
              });
            } else {
              this.ligaService.eliminarPerfilxCategoria(pxc, this.token).subscribe((resp: respuestaPerfilModel) => {

                if (resp.codigo == Constantes.CODIGO_EXITOSO) {
                  if ((index + 1) == this.listaRelacionModificada.length) {
                    this.listaRelacionModificada = [];
                    this.cargarPerfilxCategoria();
                    Swal.close();
                    this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');
                  }
                } else {
                  num++;
                  if (num == 1) {
                    this.listaRelacionModificada = [];
                    this.cargarPerfilxCategoria();
                    Swal.close();
                    this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
                  }
                }
              });
            }
          }
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

  estadoSelect(event) {
    if (event.checked) {
      this.estadoCategoria = 'Activo';
    } else {
      this.estadoCategoria = 'Inactivo';
    }
  }


  actualizarCategoria(categoria: CategoriaModel) {
    this.activeModal = true;
    this.closeListCategoria.nativeElement.click();
    
    if (categoria.estado == 1) {
      this.formCategoria.get('estado').setValue(true, { onlySelf: true })
      this.estadoCategoria = 'Activo';
    } else {
      this.formCategoria.get('estado').setValue(false, { onlySelf: true })
      this.estadoCategoria = 'Inactivo';
    }

    this.formCategoria.get('idCategoria').setValue(categoria.idCategoria, { onlySelf: true })
    this.formCategoria.get('nombreCategoria').setValue(categoria.nombreCategoria, { onlySelf: true })
    this.formCategoria.get('isPendiente').setValue(categoria.isPendiente, { onlySelf: true })
    this.formCategoria.get('orden').setValue(categoria.orden, { onlySelf: true })
    this.formCategoria.get('tipoRedencion').setValue(categoria.tipoRedencion, { onlySelf: true })
      
    this.listaMotivosCategorias=categoria.listaMotivoPqrs!=null?categoria.listaMotivoPqrs:'';
    this.formCategoria.get('listaMotivoPqrs').setValue(this.listaMotivosCategorias,{ onlySelf: true })
  }


  agregarCategoria() {
    this.activeModal = false;
    this.closeListCategoria.nativeElement.click();
    this.formCategoria.reset();  
    this.formCategoria.get('tipoRedencion').setValue(0, { onlySelf: true })  
    //this.formCategoria.get('motivoPqrs').setValue(this.categoria.motivoPqrs,{ onlySelf: true })
  }



  guardarCategoria(value: any, activeModal: boolean) {
    this.closeCrearCategoria.nativeElement.click();
    if (activeModal) {
      const dialogActualizar = this.dialog.open(DialogComponent, {
        data: '¿Desea actualizar Categoría?'
      });

      dialogActualizar.afterClosed().subscribe(res => {

        if (res) {
          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let categoria = new CategoriaModel();
          categoria.idCategoria = value.idCategoria;
          categoria.nombreCategoria = value.nombreCategoria;
          categoria.isPendiente = value.isPendiente;
          categoria.orden = value.orden
          categoria.estado = (value.estado) ? 1 : 0;
          categoria.tipoRedencion = value.tipoRedencion;
          categoria.listaMotivoPqrs=value.listaMotivoPqrs;
          this.ligaService.actualizarCategoria(categoria, this.token).subscribe((resp: respuestaCategoriaModel) => {
            if (resp.codigo == Constantes.CODIGO_EXITOSO) {
              this.mostrarPerfil = false;
              this.limpiarListas();
              this.cargarCategorias();          
              document.getElementById("modalLista").click();
              Swal.close();
              this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');
            }
            else {
              Swal.close();
              this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
            }

          });

        } else {
          document.getElementById("modalFormAct").click();
        }
      });

    } else {
      const dialogCrear = this.dialog.open(DialogComponent, {
        data: '¿Desea crear una nueva Categoría?'
      });

      dialogCrear.afterClosed().subscribe(res => {

        if (res) {
          Swal.fire({
            text: 'Cargando Información',
            allowOutsideClick: false
          });
          Swal.showLoading();
          let categoria = new CategoriaModel();
          categoria.nombreCategoria = value.nombreCategoria;
          categoria.isPendiente = 0;
          categoria.orden = value.orden
          categoria.estado = (value.estado) ? 1 : 0;
          categoria.tipoRedencion = value.tipoRedencion;
          this.ligaService.crearCategoria(categoria, this.token).subscribe((resp: respuestaCategoriaModel) => {

            if (resp.codigo == Constantes.CODIGO_EXITOSO) {
              this.limpiarListas();
              this.cargarCategorias();             
              document.getElementById("modalLista").click();
              Swal.close();
              this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');

            }
            else {
              Swal.close();
              this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
            }
          });
        } else {
          document.getElementById("modalFormAgre").click();
        }
      });
    }
  }


  limpiarListas() {
    this.listaCategoriasActivas = [];
    this.listaPerfiles = [];
    this.listaPerfilxCategoria = [];
    this.listaRelacionModificada = [];
  }

  getMensajeError(value: any): string {
    let msg;
    if (this.formCategoria.get(value).hasError('required')) {
      msg = `*El campo ${value} es requerido.`
    } else if (this.formCategoria.get(value).hasError('pattern')) {
      msg = `*El campo ${value} admite únicamente números.`
    }
    return msg;
  }

  isValido(value: any): boolean {
    return (this.formCategoria.get(value).touched || this.formCategoria.get(value).dirty
      && !this.formCategoria.get(value).valid)
  }


}
