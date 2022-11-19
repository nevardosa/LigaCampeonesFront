import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import Swal from 'sweetalert2';

import { StorageService } from '../../services/storage.service';
import { Constantes } from '../Constantes';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  anio: number;
  TyC: string;
  texto: string;
  correo: string;
  contacto = Constantes.CONS_CONTACTO;
  @ViewChild('divTyC') div: ElementRef;


  constructor(private admPerfilesService: AdmPerfilesService) {

    this.anio = new Date().getFullYear();
  }

  ngOnInit(): void {
    this.getCorreo();
  }

  getCorreo() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.admPerfilesService.consultarPropiedades(null,Constantes.TEXTO_CONTACTENOS).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      this.texto = parametrosEAFResponse.cursorparametros.parametros[0].valor
      this.admPerfilesService.consultarPropiedades(null,Constantes.CORREO_CONTACTENOS).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
        const datos = parametrosEAFResponse.cursorparametros.parametros[0].valor;
        const mail = datos.split(':');
        this.texto = mail[0];
        Swal.close();
      });
    });
  }
}