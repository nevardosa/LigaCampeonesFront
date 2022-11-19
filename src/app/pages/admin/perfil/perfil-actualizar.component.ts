import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { Token } from 'src/app/models/auth/auth.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-perfil-actualizar',
  templateUrl: './perfil-actualizar.component.html'
})
export class PerfilActualizarComponent implements OnInit {

  formaEditarPerfil: FormGroup; 
  token: string = null;
  // listaPerfiles: PerfilModel[] = [];
  cargacompleta : boolean  = false;
  //PerfilModel

  constructor(
    private fb: FormBuilder
    , private cookieService: CookieService
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private activatedRoute: ActivatedRoute
    , private router: Router
    , private storageService: StorageService
    , private authTokenService: AuthTokenService
  ) { }

  ngOnInit(): void {
    this.crearFormulario();
    const idPerfil = this.activatedRoute.snapshot.paramMap.get('id');
    // this.cedulaConsultada = Number(cedula.valueOf().replace(':', ''));
    this.consultarPerfiles(Number(idPerfil.valueOf().replace(':', '')));

  }
 
  crearFormulario(){
    this.formaEditarPerfil = this.fb.group({
      idPerfil: [],
      isReferido:  [],
      nombrePerfil:  [],
      descripcionPerfil:  ['', [Validators.required]],
      canales: ['', [Validators.required]]
    });
  }

  get descripcionPerfilNoValido() {
    return this.formaEditarPerfil.get('descripcionPerfil').invalid && this.formaEditarPerfil.get('descripcionPerfil').touched;
  }
  // tslint:disable-next-line: typedef
  get canalesNoValido() {
    return this.formaEditarPerfil.get('canales').invalid && this.formaEditarPerfil.get('canales').touched;
  }

  consultarPerfiles(idPerfil: number){
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      let requestPerfil:PerfilModel = new PerfilModel();
      requestPerfil.idPerfil =idPerfil;
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
          let perfiles = response.listaPerfiles.filter(function (e) { return (Number(e.idPerfil) == idPerfil); });
          this.enviarPerfilAFormulario(perfiles[0]);
          return;
        }
        
      });
    });
  }

  enviarPerfilAFormulario(perfil: PerfilModel) {
    this.formaEditarPerfil.reset({
      idPerfil: perfil.idPerfil,
      isReferido:  perfil.isReferido,
      nombrePerfil: perfil.nombrePerfil,
      descripcionPerfil:  perfil.descripcionPerfil,
      canales: perfil.canales
    });
  }

  guardar(){
    if (this.formaEditarPerfil.invalid) {
      return Object.values(this.formaEditarPerfil.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `Que deseas actualizar el perfil ${this.formaEditarPerfil.get('nombrePerfil').value}`,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.actualizarPerfil(this.formaEditarPerfil.value, this.token ).subscribe((responsePerfil : respuestaPerfilModel ) => {
              if(responsePerfil.codigo != Constantes.CODIGO_EXITOSO){
                this.generalService.mostrarMensaje('ERROR', 'No fue posible guardar la información, vuelva a intentarlo.', 'error');
              }else{
                this.generalService.mostrarMensaje('GUARDADO', null, 'success');
                this.router.navigate(['administrador/perfiles']);
              }

          });
        });
      } else {
        this.router.navigate(['administrador/perfiles']);
      }
    });

  }
  

}
