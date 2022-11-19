import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ProductoModel, respuestaArticuloModel, articulosRTAModel } from '../../../models/articulo.model';
import { Router} from '@angular/router';
import Swal from 'sweetalert2';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { Observable } from 'rxjs';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from 'src/app/services/storage.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoriaModel, respuestaCategoriaModel } from 'src/app/models/categoria.model';
import { ValidacionesPropias } from 'src/app/shared/validacionesPersonalizadas';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';

@Component({
  selector: 'app-articulo',
  templateUrl: './articulo.component.html',
  styleUrls: ['./articulo.component.css']
})
export class ArticuloComponent implements OnInit {
  //paginacion
  numPag: number = 0;
  vacio: string;
  totalPaginas;
  articulo = new ProductoModel();
  tamanoPagina: number;
  totalRegistros: number;
  cargaCompleta: boolean = false;
  formaConsultaRegistros: FormGroup;
  formularioBusqueda: FormGroup;
  articulosArray: articulosRTAModel[] = [];
  arrayCompleto: articulosRTAModel[] = [];
  categorias: CategoriaModel[] = [];
  token: string = null;

  source: string;
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onChange: EventEmitter<File> = new EventEmitter<File>();

  constructor(private router: Router
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private storageService: StorageService
    , private fb: FormBuilder
    , private authTokenService: AuthTokenService) { }

  ngOnInit(): void {
    this.tamanoPagina = Number(this.storageService.getValuePropiedad(Constantes.TAMANO_PAGINA));
    this.consultarArticulos(1);
    this.getCategorias();
    this.crearFormulario();

  }

  crearFormulario() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formularioBusqueda = this.fb.group({
      inptProducto: ['', [Validators.required]],
      inptCategoria: ['', []],
      inptEstado: ['', []],
      inptDestacado: ['', []],
      inptRedimido: ['', []],
    });

    this.formaConsultaRegistros = this.fb.group({
      inputRegistros: ['', [Validators.required,
      Validators.pattern(PATRON_SOLO_DIGITOS)
        , ValidacionesPropias.tamanoCero]]
    });
    this.setTamanoPagina(this.tamanoPagina);
  }
  getCategorias() {
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      this.ligaService.consultarCategorias(new CategoriaModel, this.token).subscribe((resp: respuestaCategoriaModel) => {
        let categoria: CategoriaModel;
        resp.listaCategorias.forEach(element => {
          if (element.estado == 1) {
            categoria = element
            this.categorias.push(categoria);
          }
        });
      });
    });
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
    this.articulo = new ProductoModel;
    if (this.formaConsultaRegistros.valid) {
      this.tamanoPagina = this.getCantidadRegistros();
      this.setTamanoPagina(this.tamanoPagina);
      this.numPag = 1;
      this.consultarArticulos(null);
    }
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

  cambioDestacado(e, articulo: ProductoModel) {
    articulo.destacado = (e.target.checked ? 1 : 0);
    this.personalizar(articulo);
  }

  cambioRedimido(e, articulo: ProductoModel) {
    articulo.masRedimido = (e.target.checked ? 1 : 0);
    this.personalizar(articulo);
  }

  personalizar(articulo: ProductoModel) {
    var keys = Object.keys(articulo);

    var result = articulo;
    var articuloMD = new ProductoModel();

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      result[fix_key(key)] = articulo[key];
    }
    articuloMD.costos = result.costos;
    let peticion: Observable<any>;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      peticion = this.ligaService.actualizarArticulo(articulo, this.token);
    });
    peticion.subscribe((resp: respuestaArticuloModel) => {
    });
    return result;
  }

  obtenerImagen(imagen: string) {
    return imagen == null || imagen == '' ? './assets/img/lapiz.png' : imagen;
  }
  addClass(imagen: string) {
    return (imagen == '') ? "opacar-imagen-tabla" : "";
  }
  // tslint:disable-next-line: typedef
  consultarArticulos(pagina: number) {
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
      this.token = resp.token;
      this.ligaService.consultarArticulos(this.articulo, this.numPag, this.tamanoPagina, this.token).subscribe((resp: respuestaArticuloModel) => {
        this.articulosArray = resp.crudProductosDto;
        this.totalRegistros = resp.totalRegistros;
        this.cargaCompleta = true;
        Swal.close();
        let auxpag: number = resp.totalRegistros / this.tamanoPagina;
        let auxNum = ((auxpag - Math.trunc(auxpag)) > 0) ? Math.trunc(auxpag) + 1 : auxpag;
        this.totalPaginas = new Array(auxNum);
      });
    });

  }
  async buscar() {
    this.articulo = new ProductoModel();
    this.articulo.titulo = this.formularioBusqueda.get('inptProducto').value != '' ? this.formularioBusqueda.get('inptProducto').value : this.vacio;
    this.articulo.idCategoria = this.formularioBusqueda.get('inptCategoria').value != '' ? this.formularioBusqueda.get('inptCategoria').value : this.vacio;
    this.articulo.estado = this.formularioBusqueda.get('inptEstado').value != '' ? this.formularioBusqueda.get('inptEstado').value : this.vacio;
    this.articulo.destacado = this.formularioBusqueda.get('inptDestacado').value != '' ? this.formularioBusqueda.get('inptDestacado').value : this.vacio;
    this.articulo.masRedimido = this.formularioBusqueda.get('inptRedimido').value != '' ? this.formularioBusqueda.get('inptRedimido').value : this.vacio;
    this.consultarArticulos(1);
    await this.sleep(1000);
  }

  limpiar() {
    this.crearFormulario();
    this.articulo = new ProductoModel();
    this.consultarArticulos(1);
  }

  private sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // tslint:disable-next-line: typedef
  borrarArticulo(articulo: ProductoModel) {
    Swal.fire({
      title: '¿Está seguro?',
      text: `Está seguro que desea borrar el artículo ${articulo.titulo} `,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.eliminarArticulo(articulo, this.token).subscribe((resp: respuestaArticuloModel) => {
            if (resp.codigo == -99) {
              this.generalService.mostrarMensaje('Oops...', 'Ocurrio un error, no es posible eliminar el articulo!', 'error');
            } else {
              this.generalService.mostrarMensaje('GUARDADO', null, 'success');
              this.consultarArticulos(this.numPag);
            }
          });
        });
      }
    });
  }

  // tslint:disable-next-line: typedef
  editarArticulo(articulo: articulosRTAModel) {
    this.router.navigate([`administrador/articulo/:${articulo.idProducto}`]);
  }

  updateSource($event: Event) {
    this.projectImage($event.target['files'][0]);
  }

  projectImage(file: File) {
    let reader = new FileReader;
    reader.onload = (e: any) => {
      this.source = e.target.result;
      this.onChange.emit(file);
    };
    reader.readAsDataURL(file);
  }



}
function fix_key(key) {
  return key.replace(/^costo/, 'costos');
}

