import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { Token } from 'src/app/models/auth/auth.model';
import { LugaresModel, RespuestaLugaresModel } from 'src/app/models/lugares/lugares.model';
import { ReferidoModel, respuestaReferidoModel } from 'src/app/models/referido.model';
import { responseADMUsuarios, UserModel } from 'src/app/models/user/user.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import Swal from 'sweetalert2';
import { MatPaginator } from '@angular/material/paginator';
import { Pipe, PipeTransform } from '@angular/core';
import { contratosDTO } from 'src/app/models/admPerfiles/propiedades.model';

@Component({
  selector: 'app-referido-usuario',
  templateUrl: './referido-usuario.component.html',
  styleUrls: ['./referido-usuario.component.css']
})
export class ReferidoUsuarioComponent implements OnInit {
  token: string = null;
  listaRef = true;
  tituloList = true;
  listaReferidos: ReferidoModel[] = [];
  listaProductos: string[] = [];
  listaSegmentos: string[] = [];
  listaProdSelect: string[] = [];
  usuario: UserModel = new UserModel();
  referido: ReferidoModel = new ReferidoModel();
  formReferido: FormGroup;
  formUsuario: FormGroup;
  LugaresModel: LugaresModel = new LugaresModel();
  lugaresData: LugaresModel = new LugaresModel();
  departamentoArray: LugaresModel[] = [];
  ciudadArray: LugaresModel[] = [];
  productCheckNew: boolean = false;
  @ViewChild('divTyCRef') divRef: ElementRef;
  muestraSelectCanales: boolean;
  editarReferido: boolean = false;
  canales: string[] = [];
  productoNoValido = false;
  dataSourceReferido = new MatTableDataSource<ReferidoModel>();
  selection = new SelectionModel<ReferidoModel>();
  @ViewChild('paginatorReferido', { read: MatPaginator, static: true }) paginatorReferido: MatPaginator;
  ColumnsReferido: string[] = ['cedula', 'nombre', 'celular', 'telefono', 'direccion', 'ciudad', 'departamento', 'segmento', 'producto', 'Accion'];


  constructor(private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private cookieService: CookieService
    , private storageService: StorageService
    , private generalService: GeneralService
    , private renderer: Renderer2
    , private fb: FormBuilder
    , private fu: FormBuilder) { }

  ngOnInit(): void {
    this.crearFormularioReferido();
    this.crearFormularioUsuario();
    this.cargarReferidos();
    this.cargarUsuario();
    this.PintarDepartamento();
    this.cargarCanales();
    this.cargarProductos();
    this.cargarSegmentos();
  }

  cargarReferidos() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let referido: ReferidoModel = new ReferidoModel();
    referido.cedulaQuienRefiere = this.cookieService.get('usuario');
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarReferidos(referido, this.token).subscribe((resp: respuestaReferidoModel) => {
        if (resp.listaReferidos.length > 0) {
          this.listaReferidos = resp.listaReferidos;
          this.dataSourceReferido = new MatTableDataSource<ReferidoModel>(this.listaReferidos);
          this.dataSourceReferido.paginator = this.paginatorReferido;
          Swal.close();
        } else {
          Swal.close();
        }
      },
        error => {
          console.log(error)
        });
    },
      error => {
        console.log(error)
      });
  }


  cargarUsuario() {
    this.usuario.cedula = Number(this.cookieService.get('usuario'));
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarUsuario(this.usuario, this.token).subscribe((resp: responseADMUsuarios) => {

        if (resp.codigo == Constantes.CODIGO_EXITOSO && resp.cursorUsuarios.length >= 1) {
          this.usuario.nombres = resp.cursorUsuarios[0].nombres;
          this.usuario.apellido = resp.cursorUsuarios[0].apellido;

          this.formUsuario.reset({
            nombre: resp.cursorUsuarios[0].nombres,
            apellido: resp.cursorUsuarios[0].apellido,
            documento: resp.cursorUsuarios[0].cedula,
            canal: resp.cursorUsuarios[0].canal,
          });
          this.muestracanales();
        }
      });
    });
  }

  cargarProductos() {
    this.listaProductos = this.storageService.getValuePropiedad(Constantes.PRODUCTOS_REFERIDOS).split(',');
  }

  cargarSegmentos() {
    this.listaSegmentos = this.storageService.getValuePropiedad(Constantes.SEGMENTO_REFERIDOS).split(',');
  }

  productoSelect(productSelected: any, event) {
    this.productCheckNew = false;
    if (event.checked) {
      this.listaProdSelect.push(productSelected);
      this.productoNoValido = false;
    } else {
      this.listaProdSelect.splice(this.listaProdSelect.indexOf(productSelected), 1);
      if (this.listaProdSelect.length == 0) {
        this.productoNoValido = true;
      }
    }
  }


  activarCheckbox(nombre: string, i: number) {
    if (this.editarReferido) {
      for (let index = 0; index < this.listaProdSelect.length; index++) {
        if (nombre == this.listaProdSelect[index]) {
          return true;
        }
      }
      return false;
    }

  }

  actualizarReferido(element: ReferidoModel) {
    this.agregarReferido();
    this.formReferido.get('idReferido').setValue(element.idReferido, { onlySelf: true })
    this.formReferido.get('cedula').setValue(element.cedula, { onlySelf: true })
    this.formReferido.get('nombre').setValue(element.nombre, { onlySelf: true })
    this.formReferido.get('numeroCelular').setValue(element.telefonoCelular, { onlySelf: true })
    this.formReferido.get('telefono').setValue(element.telefono2, { onlySelf: true })
    this.formReferido.get('departamento').setValue(element.idDepartamento, { onlySelf: true })
    this.PintarCiudad(element.idDepartamento);
    this.formReferido.get('ciudad').setValue(element.idCiudad, { onlySelf: true })
    this.formReferido.get('direccion').setValue(element.dirreccion, { onlySelf: true })
    this.formReferido.get('segmento').setValue(element.segmento, { onlySelf: true })
    this.formReferido.get('aceptoTerminos').setValue(true, { onlySelf: true })
    element.producto.split(',').forEach(productSelect => {
      this.listaProductos.forEach(product => {
        if (product == productSelect) {
          this.listaProdSelect.push(productSelect);
        }
      });
    });
    this.editarReferido = true;

  }


  cargarCanales() {
    let canales = this.storageService.getValuePropiedad(Constantes.CANALES);
    this.canales = canales.split(Constantes.SEPARADOR);
  }

  muestracanales() {
    this.muestraSelectCanales = this.formUsuario.get('canal').value != null;
  }

  PintarDepartamento() {
    this.LugaresModel.departamento = 0;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(this.LugaresModel, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.departamentoArray = resp.lugares;
      });
    });
  }

  PintarCiudad(idDepartamento?: number) {
    if (typeof idDepartamento === undefined) {
      this.LugaresModel.departamento = idDepartamento;
    } else {
      this.LugaresModel.departamento = this.formReferido.get('departamento').value;
    }
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(this.LugaresModel, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.ciudadArray = resp.lugares;
      });
    });
  }

  agregarReferido() {
    this.listaRef = false;
    this.tituloList = false;
    this.formReferido.reset();
    this.formReferido.get('aceptoTerminos').setValue(true, { onlySelf: true })
    this.productCheckNew = true;
  }


  regresartable() {
    this.listaRef = true;
    this.tituloList = true;
    this.listaProdSelect = [];
    this.editarReferido = false;
    this.productCheckNew = false;
  }


  GuardarReferido() {
    if (this.formReferido.valid) {

      if (this.editarReferido) {
        Swal.fire({
          title: '¿Está seguro?',
          text: `¿Estás seguro que deseas actualizar el referido ${this.formReferido.get('nombre').value.toUpperCase()}?`,
          icon: 'question',
          showCancelButton: true,
          cancelButtonColor: '#f53201',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.crearModeloReferido();
            this.authTokenService.authToken().subscribe((respToken: Token) => {
              this.token = respToken.token
              this.ligaService.actualizarReferido(this.referido, this.token).subscribe((resp: respuestaReferidoModel) => {
                if (resp.codigo == Constantes.CODIGO_EXITOSO) {
                  this.listaProdSelect = [];
                  this.referido = new ReferidoModel();
                  this.formReferido.reset();
                  this.listaRef = true;
                  this.tituloList = true;
                  this.editarReferido = false;
                  this.cargarReferidos();
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');

                } else if (resp.codigo == Constantes.CODIGO_ERROR) {
                  this.generalService.mostrarMensaje('Success', "La cédula o el número celular se encuentra registrado en el sistema.", 'error');

                } else {
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
                }
              });
            });
          }
        });

      } else {

        Swal.fire({
          title: '¿Está seguro?',
          text: `¿Estás seguro que deseas registrar como nuevo referido a ${this.formReferido.get('nombre').value.toUpperCase()}?`,
          icon: 'question',
          showCancelButton: true,
          cancelButtonColor: '#f53201',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.crearModeloReferido();
            this.authTokenService.authToken().subscribe((respToken: Token) => {
              this.token = respToken.token
              this.ligaService.crearReferido(this.referido, this.token).subscribe((resp: respuestaReferidoModel) => {

                if (resp.codigo == Constantes.CODIGO_EXITOSO) {
                  this.listaProdSelect = [];
                  this.referido = new ReferidoModel();
                  this.formReferido.reset();
                  this.listaRef = true;
                  this.tituloList = true;
                  this.cargarReferidos();
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'success');
                  
                } else if (resp.codigo == Constantes.CODIGO_ERROR) {
                  this.generalService.mostrarMensaje('Success', "La cédula o el número celular se encuentra registrado en el sistema.", 'error');

                } else {
                  this.generalService.mostrarMensaje('Success', resp.descripcion, 'error');
                }
              });
            });
          }
        });
      }


    } else {
      return Object.values(this.formReferido.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  crearModeloReferido() {

    let producto = '';
    for (let index = 0; index < this.listaProdSelect.length; index++) {
      if ((index + 1) != this.listaProdSelect.length) {
        producto = producto + this.listaProdSelect[index] + ", "
      } else {
        producto = producto + this.listaProdSelect[index]
      }
    }

    if (this.editarReferido) {
      this.referido.idReferido = this.formReferido.get('idReferido').value;
    } else {
      this.referido.idReferido = 0;
    }
    this.referido.cedula = this.formReferido.get('cedula').value;
    this.referido.cedulaQuienRefiere = String(this.usuario.cedula);
    this.referido.idCiudad = Number(this.formReferido.get('ciudad').value);
    this.referido.idDepartamento = Number(this.formReferido.get('departamento').value);
    this.referido.dirreccion = this.formReferido.get('direccion').value;
    this.referido.nombre = this.formReferido.get('nombre').value;
    this.referido.nombreQuienRefiere = this.usuario.nombres + ' ' + this.usuario.apellido;
    this.referido.producto = producto;
    this.referido.segmento = this.formReferido.get('segmento').value;
    this.referido.telefono2 = this.formReferido.get('telefono').value;
    this.referido.telefonoCelular = this.formReferido.get('numeroCelular').value;

  }


  // tslint:disable-next-line: typedef 
  crearFormularioReferido() {
    let erNum = new RegExp(Constantes.PATRON_DIGITOS);
    let num = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formReferido = this.fb.group({
      idReferido: [''],
      cedula: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      numeroCelular: [null, Validators.compose([Validators.required,
      Validators.minLength(Constantes.MIN_LENGTH),
      Validators.maxLength(Constantes.MAX_LENGTH_CEL),
      Validators.pattern(erNum)])],
      telefono: ['', Validators.pattern(num)],
      departamento: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      segmento: ['', [Validators.required]],
      aceptoTerminos: ['', Validators.requiredTrue],
    });
  }

  // tslint:disable-next-line: typedef 
  crearFormularioUsuario() {
    this.formUsuario = this.fu.group({
      nombre: ['', null],
      apellido: ['', null],
      documento: ['', null],
      canal: ['', null],
    });
  }



  cargarTerminosYCondiciones() {
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    let terminoRef:contratosDTO;
    terminoRef=JSON.parse(this.storageService.getValuePropiedad(Constantes.TERMINOS_Y_CONDICIONES_REFERIDOS).slice(1,-1));
    p.innerHTML = atob(terminoRef.terminos);
    this.renderer.appendChild(this.divRef.nativeElement, p);
  }

  buscarEnTabla(filtro: string) {
    this.dataSourceReferido.filter = filtro.trim().toLowerCase();
  }




  /* Los mensajes */
  count_validation_messages = {
    'celular': [
      { type: 'required', message: 'Celular es requerido' },
      { type: 'minlength', message: 'Celular debe contener mínimo 10 digitos' },
      { type: 'maxlength', message: 'Celular debe contener máximo 10 digitos' },
      { type: 'pattern', message: 'Celular debe ser numérico y debe comenzar por 3' }
    ]
  }

  // tslint:disable-next-line: typedef
  get cedulaNoValido() {
    return this.formReferido.get('cedula').invalid && this.formReferido.get('cedula').touched;
  }

  // tslint:disable-next-line: typedef
  get nombreNoValido() {
    return this.formReferido.get('nombre').invalid && this.formReferido.get('nombre').touched;
  }

  // tslint:disable-next-line: typedef
  get numeroCelularNoValido() {
    return this.formReferido.get('numeroCelular').invalid && this.formReferido.get('numeroCelular').touched;
  }


  // tslint:disable-next-line: typedef
  get telefonoNoValido() {
    return this.formReferido.get('telefono').invalid && this.formReferido.get('telefono').touched;
  }


  // tslint:disable-next-line: typedef
  get departamentoNoValido() {
    return this.formReferido.get('departamento').invalid && this.formReferido.get('departamento').touched;
  }
  // tslint:disable-next-line: typedef
  get ciudadNoValido() {
    return this.formReferido.get('ciudad').invalid && this.formReferido.get('ciudad').touched;
  }
  // tslint:disable-next-line: typedef
  get direccionNoValido() {
    return this.formReferido.get('direccion').invalid && this.formReferido.get('direccion').touched;
  }
  // tslint:disable-next-line: typedef
  get segmentoNoValido() {
    return this.formReferido.get('segmento').invalid && this.formReferido.get('segmento').touched;
  }

  // tslint:disable-next-line: typedef
  get AceptoTerminosNovalido() {
    return this.formReferido.get('aceptoTerminos').invalid && this.formReferido.get('aceptoTerminos').touched;
  }


}