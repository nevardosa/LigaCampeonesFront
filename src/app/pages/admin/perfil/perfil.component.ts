import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Token } from 'src/app/models/auth/auth.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {

  token: string = null;
  listaPerfiles: PerfilModel[] = [];
  cargacompleta : boolean  = false;


  constructor(
      private ligaService: WSLigaCampeonesService
    , private fb: FormBuilder
    , private router: Router
    , private cookieService: CookieService
    , private authTokenService: AuthTokenService
    , private storageService: StorageService) { }

  ngOnInit(): void {
    this.consultarPerfiles();
  }

  consultarPerfiles(){
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      this.ligaService.consultarPerfiles(new PerfilModel(), this.token).subscribe((response: respuestaPerfilModel) => {
        this.cargacompleta = true;
        Swal.close();

        if (response.codigo != Constantes.CODIGO_EXITOSO) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo consultar la informacion',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f53201'
          });
        }

        if (response.codigo == Constantes.CODIGO_EXITOSO && response.listaPerfiles) {
          this.listaPerfiles = response.listaPerfiles;
          return;
        }
        
      });
    });
  }

  editarPerfil(perfil:PerfilModel){
    this.router.navigate([`administrador/perfiles/:${perfil.idPerfil}`]);
  }

}
