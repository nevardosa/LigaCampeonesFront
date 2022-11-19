import { Component, OnInit } from '@angular/core';
import { ProductoModel, respuestaArticuloModel, articulosRTAModel } from '../../../models/articulo.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';

@Component({
  selector: 'app-galeria-articulos',
  templateUrl: './galeria-articulos.component.html'
})
export class GaleriaArticulosComponent implements OnInit {

  articulos: articulosRTAModel[] = [];
  cargaCompleta: boolean = false;
  token: string = null;

  constructor(private ligaService: WSLigaCampeonesService
    , private activatedRoute: ActivatedRoute, private authTokenService: AuthTokenService) { }

  ngOnInit(): void {

    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const idCategoria = Number(params.get('idCategoria'));
      Swal.fire({
        text: 'Cargando Información',
        allowOutsideClick: false
      });
      Swal.showLoading();

      this.cargarArticulos(idCategoria);
    });
  }

  cargarArticulos(idCategoria: number) {
    let articulo = new ProductoModel();
    articulo.idCategoria = idCategoria.toString();
    articulo.estado = 1;//indica que los articulos sean publicados
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarArticulos(articulo, null, null, this.token).subscribe((resp: respuestaArticuloModel) => {
        this.articulos = resp.crudProductosDto;
        this.cargaCompleta = true;
        Swal.close();
      });
    });
  }

}
