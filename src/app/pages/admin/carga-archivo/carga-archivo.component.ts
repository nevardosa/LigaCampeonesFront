import { Component, OnInit } from '@angular/core';
import { PedidoModel } from '../../../models/pedido.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import * as XLSX from 'xlsx';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Constantes } from 'src/app/shared/Constantes';
import * as FileSaver from 'file-saver';
import { CookieService } from 'ngx-cookie-service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';

type AOA = any[][];

@Component({
  selector: 'app-carga-archivo',
  templateUrl: './carga-archivo.component.html',
  styleUrls: ['./carga-archivo.component.css']
})
export class CargaArchivoComponent implements OnInit {

  divVisible: boolean;
  pedidos: PedidoModel[] = [];
  data: AOA = [];
  archivoActual: File;
  token: string = null;

  constructor(private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private cookieService: CookieService
    , private authTokenService: AuthTokenService) { }

  ngOnInit(): void {
    this.divVisible = true;
  }

  mostrarTabla() {
    this.divVisible = false;
  }

  regresarCargaArchivo() {
    this.divVisible = true;
  }
  onFileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(evt.target);

    if (target.files.length !== 1) throw new Error('No se pueden usar multiples archivos');
    this.archivoActual = target.files.item(0);
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      this.mostrarTabla();
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = <AOA>(XLSX.utils.sheet_to_json(ws, { header: 1 }));

    };
    reader.readAsBinaryString(target.files[0]);
  }

  procesarArchivo() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.procesarArchivoActualizacionPedido(this.archivoActual, this.token).subscribe(
        (event: HttpEvent<any>) => {

          switch (event.type) {
            case HttpEventType.Response:
              Swal.close();
              this.generalService.mostrarMensaje('', 'Procesamiento exitoso', 'success');
              let blob: any = new Blob([event.body], { type: Constantes.TIPO_ARCHIVO_EXCEL });
              FileSaver.saveAs(blob, this.cookieService.get(Constantes.NOMBRE_ARCHIVO_DESC_ACT_PEDIDOS) + new Date());
          }
        }
      ), error => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Error, vuelva a intentarlo'
        })
      };
    });
  }


}
