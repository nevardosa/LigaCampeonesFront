import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { Session } from 'src/app/models/general/session.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { StorageService } from 'src/app/services/storage.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-componente-flotante',
  templateUrl: './componente-flotante.component.html',
  styleUrls: ['./componente-flotante.component.css']
})
export class ComponenteFlotanteComponent implements OnInit {
  estComponente: boolean = false;
  texto: string;
  url: string;
  prop$: Observable<typeof localStorage>;
  constructor(private generalService: GeneralService
    , private storageService: StorageService) { }

  
    ngOnInit(): void {
      this.prop$ = this.storageService.getProp$();
      this.prop$.subscribe((localSt: typeof localStorage) => {
        var sessionStr = localSt.getItem('session');
        let sesion = (sessionStr) ? <Session>JSON.parse(sessionStr) : null;
  
        if (sesion == null) {
          return '';
        }
        try {
          this.consultaMethod();
        } catch (error) {
        }
      });  
      this.consultaMethod();
    }
  
    consultaMethod() {
      this.estComponente = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_ESTADO) == 'true';
      if (this.estComponente) {
        this.texto = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_NAME);
        this.url = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_URL);
      }
    }

  goToLink() {
    window.open(this.url, "_blank");
  }
}
