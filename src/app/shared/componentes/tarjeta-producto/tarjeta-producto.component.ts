import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Observable, Subject } from 'rxjs';
import { resumenPuntosDTO } from '../../../models/puntos-canjes.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { articulosRTAModel } from '../../../models/articulo.model';
import { Constantes } from '../../Constantes';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { CookieService } from 'ngx-cookie-service';
import { DataStorageByStatesService } from 'src/app/services/data-storage-by-states.service';
import { responseSuccessFactor } from 'src/app/models/successFactor.model';

@Component({
  selector: 'app-tarjeta-producto',
  templateUrl: './tarjeta-producto.component.html'
})
export class TarjetaProductoComponent implements OnInit {

  @Input() articulo: articulosRTAModel;

  formulario: FormGroup;
  rutaImagenXDefecto: string = './assets/img/lapiz.png';
  cantidad: number = 0;
  token: string = null;
  redMaestra: boolean = false;

  constructor(private router: Router
    , private fb: FormBuilder
    , private generalService: GeneralService
    , private ligaService: WSLigaCampeonesService
    , private authTokenService: AuthTokenService
    , private cookieService: CookieService
    , private dataStorage: DataStorageByStatesService) {
  }

  ngOnInit(): void {
    this.crearFormulario();
    this.formulario.reset({
      cantidad: this.cantidad
    });
    if (this.articulo.imagen == null || this.articulo.imagen == '') {
      this.articulo.imagen = this.rutaImagenXDefecto;
    }
  }
  addClass() {
    return (this.articulo.imagen == this.rutaImagenXDefecto) ? "opacar-imagen" : "";
  }
  //mesnajes de validacion al formulario
  count_validation_messages = {
    'cantidad': [
      { type: 'required', message: 'Debe ingresar la cantidad a redimir.' },
      { type: 'pattern', message: 'La cantidad debe ser un valor numérico' }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  get cantidadNoValido() {
    return this.formulario.get('cantidad').invalid && this.formulario.get('cantidad').touched;
  }

  //documento     : [{value: '', disabled: true}, Validators.required],
  crearFormulario() {
    let PTR_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formulario = this.fb.group({
      cantidad: [{ value: '', disabled: (this.ligaService.getPuntos() == 0 || this.ligaService.getPuntos() < this.articulo.puntos) },
      [Validators.required, , Validators.pattern(PTR_SOLO_DIGITOS)]]
    });
  }
  aumentarCantidad() {
    if (Number.isNaN(this.getCantidadForm())) {
      this.setCantidadForm(0);
    }

    if (this.ligaService.getPuntos() == 0 || (this.puntosARedimir() + this.articulo.puntos) > this.ligaService.getPuntos()) {
      this.generalService.mostrarMensaje('Oopss.. ', 'Tus puntos actuales no te alcanzan para redimir mas unidades', 'warning');
      return;
    } else if ((this.getCantidadForm() + 1) > this.articulo.unidadesDisponibles) {
      this.generalService.mostrarMensaje('Oopss.. ', 'No hay mas unidades disponibles', 'warning');
      return;
    } else {
      this.setCantidadForm(this.getCantidadForm() + 1);
    }
  }
  disminuirCantidad() {
    if (Number.isNaN(this.getCantidadForm())) {
      this.setCantidadForm(0);
    }
    if (this.getCantidadForm() != 0 && this.getCantidadForm() > 0) {
      this.setCantidadForm(this.getCantidadForm() - 1);
    }
  }
  getCantidadForm(): number {
    return Number(this.formulario.get('cantidad').value);
  }

  setCantidadForm(cantidad: number) {
    this.formulario.reset({
      cantidad: cantidad
    });
  }
  redimir() {
    //this.totalCantidad.emit(this.getCantidadForm());
    if (this.getCantidadForm() == 0) {
      this.generalService.mostrarMensaje('ERROR', 'Para redimir debe tener minimo 1 unidad!', 'error');
      return;
    }
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    if (this.cookieService.get('redMaestra') == '') {

      this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
        this.token = resp.token
        this.dataStorage.validarSuccessFactor(this.cookieService.get(Constantes.CEDULA)).subscribe((responseSuccessFactorA: any )=>{
          Swal.close();
          let responseSuccessFactor : responseSuccessFactor = responseSuccessFactorA;
          if (responseSuccessFactorA.status==200 || responseSuccessFactor!= undefined) {
            this.router.navigate([`/usuario/redimir/${this.articulo.idProducto}/${this.getCantidadForm()}`]);
          }
          else{
            this.generalService.mostrarMensaje('Oops...', 'Al verificar tu cédula encontramos que no apareces registrado en Success Factor. Por favor consulta tu información.', 'error');
            return;
          }
        });
        // this.ligaService.ConsultarUsuarioRedMaestra(Number(this.cookieService.get(Constantes.CEDULA)), this.token).subscribe(resp => {
        //   if (resp.exist.toUpperCase() == "n".toUpperCase()) {
        //     this.cookieService.set('redMaestra', 'N');
        //     this.generalService.mostrarMensaje('Oops...', 'Al verificar tu cédula encontramos que no apareces registrado en Red Maestra. Por favor consulta tu información.', 'error');
        //     return;
        //   } else {
        //     this.cookieService.set('redMaestra', 'S');
        //     this.router.navigate([`/usuario/redimir/${this.articulo.idProducto}/${this.getCantidadForm()}`]);
        //   }

        // });//fin consulta RED MAESTRA
      });
    } else if (this.cookieService.get('redMaestra') == 'S') {
      this.router.navigate([`/usuario/redimir/${this.articulo.idProducto}/${this.getCantidadForm()}`]);
    } else {
      this.generalService.mostrarMensaje('Oops...', 'Al verificar tu cédula encontramos que no apareces registrado en Red Maestra. Por favor consulta tu información.', 'error');
      return;
    }



  }
  validaRedencion() {
    return this.formulario.invalid
      || this.getCantidadForm() === 0
      || this.puntosARedimir() > this.ligaService.getPuntos();
  }
  puntosARedimir(): number {
    return ((this.getCantidadForm()) * this.articulo.puntos);
  }

}
