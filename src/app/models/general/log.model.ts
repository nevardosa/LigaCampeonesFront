import { formatDate } from '@angular/common';
import { Constantes } from 'src/app/shared/Constantes';

export class LogModel {
    public applicationName: string;
    public channel: string;
    public codResp: string;
    public dateEnd: string;
    public dateIni: string;
    public descResp: string;
    public lavelLog: string;
    public logId: number;
    public request: string;
    public response: string;
    public serviceName: string;
    public transacionId: string;
    public userName: string;


    constructor(
        channel: string,
        codResp: string,
        descResp: string,
        dateIni: Date,
        dateEnd: Date,
        lavelLog: string,        
        request: string,
        response: string,
        serviceName: string,
        transacionId: string,
        userName: string) {

        this.applicationName = Constantes.NOMBRE_APLICACION;
        this.channel = channel;
        this.codResp = codResp;
        this.dateEnd = formatDate(dateEnd, 'yyyy-MM-dd HH:mm:ss.SSS', 'en-US');
        this.dateIni = formatDate(dateIni, 'yyyy-MM-dd HH:mm:ss.SSS', 'en-US');
        this.descResp = descResp;
        this.lavelLog = lavelLog;
        this.logId = null;
        this.request = request;
        this.response = response;
        this.serviceName = serviceName;
        this.transacionId = transacionId;
        this.userName = userName;
    }
}