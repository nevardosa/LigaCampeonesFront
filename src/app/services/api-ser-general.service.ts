import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { ProxyModel } from '../models/general/Proxy.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Constantes } from '../shared/Constantes';
import { Observable } from 'rxjs';
import { AuthSFTP } from '../models/authSFTP.model';

@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  public UUID: string;
  public static proxy: ProxyModel = new ProxyModel();
  private url;

  constructor(
    private http: HttpClient
    ,private router: Router) {
    this.UUID = this.generateUUID();
    this.url = Constantes.CONST_ENDPOINT_SER_GENERAL;
  }


  /**/
  generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16;//random number between 0 and 16
      if (d > 0) {//Use timestamp until depleted
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {//Use microseconds since page-load if supported
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }


  mostrarMensaje(titulo: any, text: any, icono: any) {
    Swal.fire({
      icon: icono,
      title: titulo,
      text: text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f53201'
    });
  }

  mostrarMensajeAccion(titulo: any, text: any, icono: any, redirect: any) {
    Swal.fire({
      icon: icono,
      title: titulo,
      text: text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f53201'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate([redirect]).then(() => {
          window.location.reload();
        });
      }
    });
  }
  mostrarMensajeCarga(text: any) {
    Swal.fire({
      text: text,
      allowOutsideClick: false
    });
    Swal.showLoading();
  }

  enviarCorreo(correo: any) {
    return this.http.post(`${this.url}/enviarcorreo`, correo);
  }

  cargarArchivoSFTP(file: File, nombreArchivo:string, authSFTP: AuthSFTP) : Observable<HttpEvent<any>>{
    let paramsSerGeneral = new HttpParams();

    // paramsSerGeneral=paramsSerGeneral.append('host','172.24.42.143' );
    // paramsSerGeneral=paramsSerGeneral.append('pass','Claro04/16/2021');
    // paramsSerGeneral=paramsSerGeneral.append('path','/applications/config/EAF/CO_Claro_IntCus_EAF_Domain_PR/config/WSSerGeneral/docs');
    // paramsSerGeneral=paramsSerGeneral.append('user','ecm7949b');

    paramsSerGeneral=paramsSerGeneral.append('host',authSFTP.ip );
    paramsSerGeneral=paramsSerGeneral.append('user',authSFTP.usuario);
    paramsSerGeneral=paramsSerGeneral.append('pass',authSFTP.contrasena);
    paramsSerGeneral=paramsSerGeneral.append('path',authSFTP.ruta);
  
    const formData: FormData = new FormData();
    formData.append('file', file, nombreArchivo );

    const req = new HttpRequest('POST',`${Constantes.CONST_ENDPOINT_SER_GENERAL}/sftp/envioArchivo?${paramsSerGeneral.toString()}`, formData,{
      reportProgress: true,
      responseType: 'json'
    });
    return this.http.request(req);
  }
  
  descargarArchivoSFTP(nombreArchivo: string, authSFTP: AuthSFTP){
    let paramsSerGeneral = new HttpParams();
    paramsSerGeneral=paramsSerGeneral.append('host',authSFTP.ip );
    paramsSerGeneral=paramsSerGeneral.append('user',authSFTP.usuario);
    paramsSerGeneral=paramsSerGeneral.append('pass',authSFTP.contrasena);
    paramsSerGeneral=paramsSerGeneral.append('path',authSFTP.ruta);
    paramsSerGeneral=paramsSerGeneral.append('listaArchivoSeparadoPorComa',nombreArchivo);
    return this.http.get(`${Constantes.CONST_ENDPOINT_SER_GENERAL}/sftp/obtenerArchivosZip`,
    { params: paramsSerGeneral, responseType: 'arraybuffer'});
  }


}
