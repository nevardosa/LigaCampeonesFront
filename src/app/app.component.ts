import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BnNgIdleService } from 'bn-ng-idle';
import { CookieService } from 'ngx-cookie-service';
import { StorageService } from './services/storage.service';
import { DialogSesionComponent } from './shared/dialogo/dialog-sesion/dialog-sesion.component';
import IdleTimer from './shared/sessionTime/IdleTimer.js';
import { Router } from '@angular/router';
import { Constantes } from './shared/Constantes';
import { ComponenteFlotanteComponent } from './shared/componente-flotante/componente-flotante.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LigaCampeones';
  timer: IdleTimer;
  session: any;
  token: any;
  timeGen: number = null;
  timeInact: number = null;
  constructor(private cookieService: CookieService
    , private router: Router
    , private storageService: StorageService
    , private bnIdle: BnNgIdleService
    , public dialog: MatDialog
    ) { }
    
  ngOnInit() {
    this.sessionTime();
    
    }
  
  ngOnDestroy() {
    this.timer.clear();
  }
  
  visualizarBoton(){
    return (this.cookieService.get('admin')==null || this.cookieService.get('admin')!='true')?true:false;
  }
  
  sessionTime() {
    let session = this.storageService.isAuthenticated();
    let token = this.cookieService.check('token');

    if (session || token) {
      this.timeGen = Number(this.storageService.getValuePropiedad(Constantes.CONST_TIMEOUT_GENERAL));
      this.timer = new IdleTimer({
        timeout: this.timeGen,
        onTimeout: () => {
          this.cerrarSesion();
        }
      });

      this.timeInact = 60 * Number(this.storageService.getValuePropiedad(Constantes.CONST_TIMEOUT_INACTIVIDAD));
      this.bnIdle.startWatching(this.timeInact).subscribe((inAct) => {
        if (inAct) {
          const dialogRefEliminar = this.dialog.open(DialogSesionComponent, {
            data: 'Cierre de sesión automática'
          });
          dialogRefEliminar.afterClosed().subscribe(resp => {
            if (resp) {
              this.bnIdle.stopTimer();
              this.cerrarSesion();
            }
          });
        }
      });
    }
  }

  cerrarSesion() {
    this.cookieService.deleteAll();
    this.storageService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

}
