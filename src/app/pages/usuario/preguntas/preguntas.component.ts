import { animate, state, style, transition, trigger } from '@angular/animations';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { MatSelectionListChange } from '@angular/material/list';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CookieService } from 'ngx-cookie-service';
import { EMPTY } from 'rxjs';
import { Token } from 'src/app/models/auth/auth.model';
import { ImagenModel, respuestImagenModel } from 'src/app/models/imagen.model';
import { PreguntaModel, respuestPreguntaModel } from 'src/app/models/pregunta.model';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-preguntas',
  templateUrl: './preguntas.component.html',
  styleUrls: ['./preguntas.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class PreguntasComponent {



  @ViewChild(MatAccordion) accordion: MatAccordion;
  activeModal = false;
  @ViewChild(MatPaginator, { static: true }) paginatorPregunta: MatPaginator;
  listaPreguntas: PreguntaModel[] = [];
  listaPreguntasFilter: PreguntaModel[] = [];
  previewImag: string = null;
  selectedOptions: any;
  dataSourcePregunta = new MatTableDataSource<PreguntaModel>();
  displayedColumns = ['pregunta'];
  token: string = null;
  listaCategorias: PreguntaModel[] = [];
  images: ImagenModel[] = [];
  imagesList: ImagenModel[] = [];
  emptyMessage: boolean;
  filtroPregunta: number;
  regex = new RegExp('');

  constructor(
    private authTokenService: AuthTokenService
    , private ligaService: WSLigaCampeonesService
    , private cookieService: CookieService
  ) { }

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

    if (this.cookieService.get('user') != '' && this.cookieService.get('pass') != '') {
      this.regex = new RegExp('[2-3]');
      this.authTokenService.authToken().subscribe((resp: Token) => {
        this.token = resp.token
        this.consultarPreguntas(pregunta);
      });
    } else {
      this.regex = new RegExp('[1,3]');
      this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
        this.token = resp.token
        this.consultarPreguntas(pregunta);
      });
    }
  }


  @ViewChild("mostrarImagenes") elem: ElementRef;
  cerrarImg(){
    this.elem.nativeElement.click();
  }

  consultarPreguntas(pregunta: PreguntaModel): PreguntaModel[] {
    let imagen: ImagenModel = new ImagenModel()
    this.ligaService.consultarPregunta(pregunta, this.token).subscribe((respPregModel: respuestPreguntaModel) => {
      if (respPregModel.codigo==Constantes.CODIGO_EXITOSO
        //respPregModel.listaPreguntas!= null && respPregModel.listaPreguntas.length > 0
        ) {
        Swal.close();
        let arr = respPregModel.listaPreguntas;
        var filteredValues = arr.filter(type => type.tipoVisualizacion.toString().match(this.regex));
        filteredValues.forEach(element => {
          imagen.idSeccion = element.id;
          imagen.seccion = 'Preguntas';
          this.ligaService.consultarImagen(imagen, this.token).subscribe((respImg: respuestImagenModel) => {
            if (respImg.listaImagenes!= null && respImg.listaImagenes.length > 0) {
              this.images = respImg.listaImagenes;
              element.listaImagenes = this.images;
            }

            this.listaPreguntas.push(element);

            if (this.listaPreguntas.length == filteredValues.length) {
              this.dataSourcePregunta = new MatTableDataSource<PreguntaModel>(this.listaPreguntas);
              this.dataSourcePregunta.paginator = this.paginatorPregunta;
              this.obtenerCategorias(this.listaPreguntas);
            }
          });
        });
        Swal.close();
        return this.listaPreguntas;

      }
    });
    Swal.close();
    return this.listaPreguntas;

  }

  @ViewChild("myNameElem") myNameElem: ElementRef;
  buscarEnTabla(filtro: string) {
    this.dataSourcePregunta.filter = filtro.trim().toLowerCase();
    this.myNameElem.nativeElement.setAttribute('class', 'text-danger');
  }

  obtenerCategorias(lista: PreguntaModel[]) {
    const objetos = Array.from(new Set(lista.map(item => item.tipoPregunta)));
    objetos.forEach(element => {
      let categoria: PreguntaModel = new PreguntaModel();
      categoria.tipoPregunta = element
      this.listaCategorias.push(categoria);
    });
    Swal.close();
  }

  onChange(change: MatSelectionListChange) {
    this.listaPreguntasFilter = [];
    let pregunta: PreguntaModel = new PreguntaModel();
    pregunta.tipoPregunta = change.option.value.tipoPregunta;
    this.listaPreguntasFilter = this.listaPreguntas.filter(tipoPreg => tipoPreg.tipoPregunta == change.option.value.tipoPregunta);
    this.refreshDT();
  }

  refreshDT() {
    this.dataSourcePregunta = new MatTableDataSource<PreguntaModel>(this.listaPreguntasFilter);
    this.dataSourcePregunta.paginator = this.paginatorPregunta;
  }

  visualizarImagen(pregunta: PreguntaModel) {
    this.activeModal = true;
    if (pregunta.listaImagenes != undefined && pregunta.listaImagenes.length > 0) {
      this.imagesList = pregunta.listaImagenes;
      this.emptyMessage = false;
    }
    else {
      this.imagesList = [];
      this.emptyMessage = true;
    }
  }
}