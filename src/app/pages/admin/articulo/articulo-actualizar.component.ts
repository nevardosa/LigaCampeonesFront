import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CategoriaModel, respuestaCategoriaModel } from '../../../models/categoria.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import Swal from 'sweetalert2';
import { ProductoModel, respuestaArticuloModel, articulosRTAModel } from '../../../models/articulo.model';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from 'src/app/services/storage.service';
import { RxwebValidators } from '@rxweb/reactive-form-validators';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-articulo-actualizar',
  templateUrl: './articulo-actualizar.component.html'
})
export class ArticuloActualizarComponent implements OnInit {

  isEdicion: boolean;
  formaArticulo: FormGroup;
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onChange: EventEmitter<File> = new EventEmitter<File>();
  listaCategorias: CategoriaModel[] = [];

  token: string = null;
  categoriaSeleccionada:CategoriaModel[]=[];
  categoria:CategoriaModel=new CategoriaModel;

  
  listaCategoriasModficadas   : Array<Number> ; //almacena los indices de las categorias que fueron modificados
  cargaCompleta: boolean = false;
  listaCategoriasPertenece : Array<Number> ; 

  constructor(private sanitizer: DomSanitizer
    , private activatedRoute: ActivatedRoute
    , private fb: FormBuilder
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private router: Router
    , private storageService: StorageService
    , private authTokenService: AuthTokenService) {
      

  }

  ngOnInit(): void {
    this.listaCategoriasModficadas =  new Array();
    this.listaCategoriasPertenece =  new Array();

    this.cargarCategorias();
  }
  definirAccion(){
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id != 'nuevo') {
      this.isEdicion = true;
      this.consultarArticulo(Number(id.valueOf().replace(':', '')));
    }else{
      this.crearFormulario();
      this.cargaCompleta = true;
    }
  }

  crearFormulario() {
    let erNum = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaArticulo = this.fb.group({
      idProducto: [null],
      idCategoria: this.fb.array([]),
      titulo: ['', Validators.required],
      descripcionCorta: ['', [Validators.required]],
      imagen: [null, [RxwebValidators.fileSize({ maxSize: Number(this.storageService.getValuePropiedad(Constantes.MAX_SIZE_IMAGE)) })]],
      unidadesDisponibles: ['', [Validators.required, Validators.pattern(erNum)]],
      estado: ['', Validators.required],
      destacado: [],
      masRedimido: [],
      costos: ['', [Validators.required, Validators.pattern(erNum)]],
      puntos: ['', [Validators.required, Validators.pattern(erNum)]],
      informacionDetallada: []
    });

    this.listaCategorias.forEach(item => { 
      if(this.listaCategoriasPertenece.includes(item.idCategoria)){
        this.addControlFormArray(true);
      }else{
        this.addControlFormArray(false);
      }
    });
    this.escucharModificacionDeCategoria();
    this.cargaCompleta = true;
  }

  addControlFormArray(value: any) {
    const control = <FormArray>this.formaArticulo.controls['idCategoria'];
    let itemControl = new FormControl();
    itemControl.setValue(value);
    control.push((itemControl));
  }

  escucharModificacionDeCategoria(){
    const controles = <FormArray>this.formaArticulo.controls['idCategoria'];
    for (let index = 0; index < controles.length; index++) {
      this.formaArticulo.controls['idCategoria'].get( index.toString() ).valueChanges.subscribe(valorCheck => {
        if(valorCheck){
          this.listaCategoriasModficadas.push(this.listaCategorias[index].idCategoria);
        }else{
          this.listaCategoriasModficadas.splice(this.listaCategoriasModficadas.indexOf(this.listaCategorias[index].idCategoria),1);
        }
      });
    }

  }


  cargarCategorias() {
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      let categoria: CategoriaModel = new CategoriaModel();
      categoria.estado = Constantes.CONST_CATEGORIA_ACTIVA;
      this.ligaService.consultarCategorias(categoria, this.token).subscribe((resp: respuestaCategoriaModel) => {
        this.listaCategorias = resp.listaCategorias;
        this.definirAccion();
      });
    });
  }

  consultarArticulo(idArticulo: number) {
    let articulo = new ProductoModel();
    articulo.idProducto = idArticulo;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarArticulos(articulo, 1, 1, this.token).subscribe((resp: respuestaArticuloModel) => {
       resp.crudProductosDto.forEach(obj=>{
          this.listaCategoriasPertenece.push(Number(obj.idCategoria)); 
          this.listaCategoriasModficadas.push(Number(obj.idCategoria)); 
        });
      this.crearFormulario();
      this.enviarArticuloAForm(resp.crudProductosDto[0]);
      });
    });


    
  }

  consultaCategorias(idCategoria:number){
    let categoria:CategoriaModel=new CategoriaModel;
    categoria.idCategoria=idCategoria;
    
    this.ligaService.consultarCategorias(categoria, this.token).subscribe((resp: respuestaCategoriaModel) => {
      this.categoria=resp.listaCategorias[0];
      this.categoriaSeleccionada.push(this.categoria);
    });
  }

  guardar() {
    if (!this.formaArticulo.valid) {
      return Object.values(this.formaArticulo.controls).forEach(control => {
        control.markAsTouched();
      });
    }
    if(this.listaCategoriasModficadas.length == 0){
      return;
    }
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
    });
    let mensaje: any = (this.isEdicion) ? '¿Está seguro que deseas editar el artículo' :
      'Está seguro que deseas crear y publicar el artículo';

    Swal.fire({
      title: '¿Está seguro?',
      text: mensaje + `${this.formaArticulo.get('titulo').value}`,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.completarObjetoArticulo();
        let peticion: Observable<any>;

        let producto : ProductoModel = this.formaArticulo.value;
        producto.idCategoria = this.listaCategoriasModficadas.toString();

        if (this.isEdicion) {
          peticion = this.ligaService.actualizarArticulo(producto, this.token);
        } else {
          peticion = this.ligaService.crearArticulo(producto, this.token);
        }
        peticion.subscribe((resp: respuestaArticuloModel) => {
          if (resp.codigo == 0) {
            this.generalService.mostrarMensaje('GUARDADO', null, 'success');
            this.router.navigate(['administrador/articulo']);
          } else {
            this.generalService.mostrarMensaje('ERROR', 'Ocurrio un error, no se pudo guardar el artículo!', 'error');
          }
        });

      } else {
        this.router.navigate(['administrador/articulo']);
      }
    });
  }

  updateSource(event) {
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.formaArticulo.patchValue({
        imagen: imagen.base
      });
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




  enviarArticuloAForm(articulo: articulosRTAModel) {
    this.formaArticulo.patchValue({
      idProducto: articulo.idProducto,
      // idCategoria: articulo.idCategoria,
      titulo: articulo.titulo,
      descripcionCorta: articulo.descripcionCorta,
      imagen: articulo.imagen,
      estado: articulo.estado,
      destacado: articulo.destacado,
      masRedimido: articulo.masRedimido,
      unidadesDisponibles: articulo.unidadesDisponibles,
      costos: articulo.costo,
      puntos: articulo.puntos,
      informacionDetallada: articulo.informacionDetallada
    });
  }

  completarObjetoArticulo() {
    this.formaArticulo.patchValue({
      destacado: this.getValor(this.formaArticulo.get('destacado').value),
      masRedimido: this.getValor(this.formaArticulo.get('masRedimido').value)
    });
  }

  // tslint:disable-next-line: typedef
  get categoriaNoValido() {
    return this.listaCategoriasModficadas.length == 0;
  }
  // tslint:disable-next-line: typedef
  get tituloNoValido() {
    return this.formaArticulo.get('titulo').invalid && this.formaArticulo.get('titulo').touched;
  }
  // tslint:disable-next-line: typedef
  get descripcionNoValido() {
    return this.formaArticulo.get('descripcionCorta').invalid && this.formaArticulo.get('descripcionCorta').touched;
  }
  get detalleNoValido() {
    return this.formaArticulo.get('informacionDetallada').invalid && this.formaArticulo.get('informacionDetallada').touched;
  }
  // tslint:disable-next-line: typedef
  get cantidadNoValido() {
    return this.formaArticulo.get('unidadesDisponibles').invalid && this.formaArticulo.get('unidadesDisponibles').touched;
  }
  // tslint:disable-next-line: typedef
  get estadoNoValido() {
    return this.formaArticulo.get('estado').invalid && this.formaArticulo.get('estado').touched;
  }
  // tslint:disable-next-line: typedef
  get costoNoValido() {
    return this.formaArticulo.get('costos').invalid && this.formaArticulo.get('costos').touched;
  }
  // tslint:disable-next-line: typedef
  get puntosNoValido() {
    return this.formaArticulo.get('puntos').invalid && this.formaArticulo.get('puntos').touched;
  }

  count_validation_messages = {
    'imagen': [
      { type: 'fileSize', message: this.storageService.getValuePropiedad(Constantes.MSG_MAX_SIZE_IMAGE_LIMIT) }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  get ImagenNoValida() {
    return this.formaArticulo.get('imagen').invalid;
  }


  getValor(value: boolean): number {
    return (value) ? 1 : 0;
  }

  //Editor rich text
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
  //Default Image 
  obtenerImagen() {
    return this.formaArticulo.get('imagen').value == null || this.formaArticulo.get('imagen').value == '' ? './assets/img/lapiz.png' : this.formaArticulo.get('imagen').value;
  }
  //Class opacity Default image
  addClass() {
    return this.formaArticulo.get('imagen').value == null || this.formaArticulo.get('imagen').value == '' ? "opacar-imagen" : "";
  }

}