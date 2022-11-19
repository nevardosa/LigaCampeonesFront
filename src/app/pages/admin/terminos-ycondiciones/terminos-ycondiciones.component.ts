import { Component, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { contratosDTO, parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { StorageService } from 'src/app/services/storage.service';
import { Constantes } from 'src/app/shared/Constantes';

@Component({
  selector: 'app-terminos-ycondiciones',
  templateUrl: './terminos-ycondiciones.component.html',
  styleUrls: ['./terminos-ycondiciones.component.css']
})
export class TerminosYCondicionesComponent {
  TyC: string;
  @ViewChild('divTerminos') divTerm: ElementRef;
  contrato: contratosDTO = new contratosDTO();
  listContratos: contratosDTO[] = [];
  contratoSeleccionado: contratosDTO = new contratosDTO();

  constructor(private storageService: StorageService
    , private renderer: Renderer2
    , private admPerfilesService: AdmPerfilesService
    , private cookieService: CookieService
  ) {

  }

  ngAfterViewInit() {

    this.cargarContratos();
    setTimeout(() => {
    }, 1000);
  }

  cargarContratos() {
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametros: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        let newParams: string[] = [];
        const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS));
        parametros.forEach(elem => {
          if (propContratos.some(p => p.nombre === elem.nombre)) {
            newParams.push(elem.valor);
          }
        });
        newParams.forEach(contrato => {
          this.contrato = JSON.parse(contrato.slice(1, -1));
          this.listContratos.push(this.contrato);
        });
      }
      this.cargarTerminosYCondiciones();
    });
  }

  cargarTerminosYCondiciones() {
    this.listContratos.find(elem => {
      if (elem.name.toUpperCase() == this.cookieService.get(Constantes.PROP_TIPO_CONTRATO_LOGIN).toUpperCase()) {
        this.contratoSeleccionado = elem;
      }
    });
    if (this.cookieService.get(Constantes.PROP_TIPO_CONTRATO_LOGIN) == '') {
      const p: HTMLParagraphElement = this.renderer.createElement('div');
      p.innerHTML = atob(this.listContratos[2].terminos);
      this.renderer.appendChild(this.divTerm.nativeElement, p);
      return;
    }
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    p.innerHTML = atob(this.contratoSeleccionado.terminos);
    this.renderer.appendChild(this.divTerm.nativeElement, p);
  }
}
