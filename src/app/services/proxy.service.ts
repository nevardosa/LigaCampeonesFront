
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';


import { ProxyModel } from '../models/general/Proxy.model';

@Injectable({
  providedIn: 'root'
})
export class ProxyService {

  private proxy: ProxyModel = new ProxyModel();
  parsedBase64Key: any;
  encryptData: any;
  decryptData: any;

  constructor() { }

  convertirProxy(headers: any, body: any, method: string, url: string, responseType: string) {

    this.proxy = new ProxyModel();
    if (Object.keys(headers).length > 0) {
      this.proxy.inHeaders = JSON.stringify(Object.assign({}, headers));
    }
    if (responseType == "blob" || responseType == "arraybuffer") {
      this.proxy.respuestaConArchivo = true;
    } else {
      this.proxy.respuestaConArchivo = false;
    }
    this.proxy.body = JSON.stringify(body).replace(/"/g, "'");
    this.proxy.metodo = method;
    this.proxy.url = url
    return this.proxy;
  }


  convertirParamsProxy(headers: any, method: string, url: string, responseType: string) {
    let paramsProxy = new HttpParams();
    let header = JSON.stringify(Object.assign({}, headers));
    paramsProxy = paramsProxy.append('inHeaders', header);
    paramsProxy = paramsProxy.append('metodo', method);
    if (responseType == "blob" || responseType == "arraybuffer") {
      paramsProxy = paramsProxy.append('respuestaConArchivo', 'true');
    } else {
      paramsProxy = paramsProxy.append('respuestaConArchivo', 'false');
    }
    paramsProxy = paramsProxy.append('url', "{'url'='" + url + "'}");

    return paramsProxy;

  }

}
