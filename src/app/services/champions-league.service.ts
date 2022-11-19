import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { PeticionesHTTP } from '../models/general/ENUM';
import { RequestStartOrderModel } from '../models/WS_championsLeague.model';
import { Constantes } from '../shared/Constantes';
import { GeneralService } from './api-ser-general.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ChampionsLeagueService {

  private urlChampionsLeague = this.storageService.getValuePropiedad(Constantes.PROP_ENDPOINT_CHAMPIONS_LEAGUE); 

  constructor(private http: HttpClient
            , private cookieService: CookieService
            , private router: Router
            , private storageService: StorageService ) { }

  startOrder(requestStartOrderModel: RequestStartOrderModel):Observable<any>{
    return this.http.post(`${this.urlChampionsLeague + this.storageService.getValuePropiedad(Constantes.PROP_RUTA_CL_START_ORDER)}`, requestStartOrderModel);
  }
}
