import { HttpInterceptor, HttpHandler, HttpParams, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Injectable } from "@angular/core"
import { catchError, tap } from "rxjs/operators";
import { Observable, throwError } from "rxjs";
import { Constantes } from './Constantes';
import { WSLigaCampeonesService } from '../services/wsliga-campeones.service';
import { ProxyService } from '../services/proxy.service';
import { PeticionesHTTP } from '../models/general/ENUM';


@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    private mensajes = new Map<number, string>();
    private rutaProperties = '/WSSerGeneral/acces/propiedades';

    constructor(private ligaService: WSLigaCampeonesService,
        private proxyService: ProxyService
    ) {
        this.mensajes.set(Constantes.HTTP_STATUS_CODE_500, Constantes.HTTP_STATUS_MSJ_500);
    }

    private getMensaje(codigo: number): string {
        if (!this.mensajes.has(codigo)) {
            return `Ocurrió un error, vuelva a intentarlo`;
        }
        return this.mensajes.get(codigo);
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let rutaLogs = Constantes.CONST_ENDPOINT_SER_GENERAL + Constantes.CONST_RUTA_URL_LOGS;
        let dateIn = new Date();
        let urlSerGeneral = null;
        urlSerGeneral = req.url;
        let isFormData = false

        if (req.body != null) {
            if (req.body[Symbol.toStringTag] == "FormData") {
                isFormData = true;
            }
        }

      
        req = this.clonarRequest(req, isFormData);
        const { url, method, headers, body } = req;
        return next.handle(req).pipe(tap((evt: HttpEvent<any>) => {

            if (JSON.stringify(urlSerGeneral).includes(rutaLogs)) {
                return;
            }
            if (evt instanceof HttpResponse && evt.status === 200) {
                this.ligaService.LOG_REQ_RESP(req, evt, dateIn);
            }


        }),
            catchError(err => {
                if (JSON.stringify(body).includes(urlSerGeneral || this.rutaProperties)) {
                    return throwError(err);

                }
                Swal.fire({
                    icon: 'error',
                    text: this.getMensaje(err.status),
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#f53201'
                });
                this.ligaService.LOG_REQ_RESP(req, err, dateIn);
                return throwError(err);
            })
        );


    }

    clonarRequest(req: HttpRequest<any>, isFormData: boolean) {

        let keys: string[] = req.headers.keys();
        var header = {};
        if (keys != null && keys.length > 0) {
            keys.forEach(element => {
                header[`${element}`] = req.headers.get(element);
            });
        }

        if (isFormData) {

            let paramsProxy = new HttpParams();
            paramsProxy = this.proxyService.convertirParamsProxy(header, req.method, req.urlWithParams, req.responseType);
            req = req.clone({
                body: req.body,
                params: paramsProxy,
                method: PeticionesHTTP.POST,
                url: `${Constantes.CONST_ENDPOINT_PROXY}/cargueArchivo`
            });

        } else {

            let proxyRequest = this.proxyService.convertirProxy(header, req.body, req.method, req.urlWithParams, req.responseType);
            req = req.clone({
                body: proxyRequest,
                method: PeticionesHTTP.POST,
                url: `${Constantes.CONST_ENDPOINT_PROXY}/consultarServicio`
            });
        }

        return req;
    }


}