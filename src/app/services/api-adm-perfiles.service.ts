import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { parametrosDTO, ParametrosEAFRequest, ParametrosEAFResponse } from '../models/admPerfiles/propiedades.model';
import { PeticionesHTTP } from '../models/general/ENUM';
import { Constantes } from '../shared/Constantes';
import { GeneralService } from './api-ser-general.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../shared/dialogo/dialog/dialog.component';
import Swal from 'sweetalert2';
import { StorageService } from './storage.service';
@Injectable({
  providedIn: 'root'
})
export class AdmPerfilesService {

  private parametrosEAFRequest: ParametrosEAFRequest = new ParametrosEAFRequest();
  constructor(private http: HttpClient
    , public dialog: MatDialog
    , private generalService: GeneralService
    , private storageService: StorageService) {

  }

  consultarPropiedades(nombreAplicacion: string, nombre: string) {
    this.parametrosEAFRequest = new ParametrosEAFRequest();
    this.parametrosEAFRequest.accion = Constantes.CONST_ACCION_CONSULTAR;
    this.parametrosEAFRequest.canal = Constantes.CANAL_APLICACION;
    if (nombreAplicacion != null) {
      this.parametrosEAFRequest.codapp = nombreAplicacion;
    }
    if (nombre != null) {
      this.parametrosEAFRequest.nombre = nombre;
    }

    return this.http.post(`${Constantes.CONST_ENDPOINT_SER_GENERAL}/propiedades/admParametrosEAF`, this.parametrosEAFRequest);
  }

  actualizarPropiedad(parametrosDTO: parametrosDTO) {
    this.parametrosEAFRequest.accion = Constantes.CONST_ACCION_ACTUALIZAR;
    this.parametrosEAFRequest.canal = Constantes.CANAL_APLICACION;
    this.parametrosEAFRequest.codapp = parametrosDTO.codapp;
    this.parametrosEAFRequest.nombre = parametrosDTO.nombre;
    this.parametrosEAFRequest.valor = parametrosDTO.valor;
    return this.http.post(`${Constantes.CONST_ENDPOINT_SER_GENERAL}/propiedades/admParametrosEAF`, this.parametrosEAFRequest);
  }


  guardarPropiedad(param: parametrosDTO) {
    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar Información?'
    });

    dialogActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        this.actualizarPropiedad(param).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          Swal.close();
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.storageService.actualizarPropiedadEspecifica(param.nombre, param.valor);

            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
          }
          else {
            this.generalService.mostrarMensaje('Error', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }


  crearPropiedad(parametrosDTO: parametrosDTO) {
    this.parametrosEAFRequest.accion = Constantes.CONST_ACCION_INSERTAR;
    this.parametrosEAFRequest.canal = Constantes.CANAL_APLICACION;
    this.parametrosEAFRequest.codapp = parametrosDTO.codapp;
    this.parametrosEAFRequest.nombre = parametrosDTO.nombre;
    this.parametrosEAFRequest.valor = parametrosDTO.valor;
    return this.http.post(`${Constantes.CONST_ENDPOINT_SER_GENERAL}/propiedades/admParametrosEAF`, this.parametrosEAFRequest);
  }



  EliminarPropiedad(parametrosDTO: parametrosDTO) {
    this.parametrosEAFRequest.accion = Constantes.CONST_ACCION_ELIMINAR;
    this.parametrosEAFRequest.canal = Constantes.CANAL_APLICACION;
    this.parametrosEAFRequest.codapp = parametrosDTO.codapp;
    this.parametrosEAFRequest.nombre = parametrosDTO.nombre;
    this.parametrosEAFRequest.valor = parametrosDTO.valor;
    return this.http.post(`${Constantes.CONST_ENDPOINT_SER_GENERAL}/propiedades/admParametrosEAF`, this.parametrosEAFRequest);
  }


}
