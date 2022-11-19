import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from 'src/app/shared/Constantes';

@Component({
  selector: 'app-parametrizacion',
  templateUrl: './parametrizacion.component.html',
  styleUrls: ['./parametrizacion.component.css']
})
export class ParametrizacionComponent implements OnInit {
  view: string;
  listModulos: string[] = [];
  constructor(private cookieService: CookieService) { }

  ngOnInit(): void {
    this.listaModulos();
    this.viewPreguntas(this.cookieService.get('viewPregunta'));
  }


  listaModulos() {
    this.listModulos = Constantes.PARAMETRIZACION_MODULOS.split(',');
  }

  viewPreguntas(modulo: any) {
    if (modulo == 'Preguntas Frecuentes') {
      this.view = modulo;
    }
  }


  getView(modulo: string) {
    this.view = modulo;
  }

}
