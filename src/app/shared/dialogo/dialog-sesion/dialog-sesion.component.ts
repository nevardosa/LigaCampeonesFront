import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as  countdown from 'countdown';

interface Time {
  minutes: number;
  seconds: number;
}
@Component({
  selector: 'app-dialog-sesion',
  templateUrl: './dialog-sesion.component.html',
  styleUrls: ['./dialog-sesion.component.css']
})
export class DialogSesionComponent implements OnInit {
  time: Time = null;
  timeId: number = null;
  constructor(
    public dialogRef: MatDialogRef<DialogSesionComponent>,
    @Inject(MAT_DIALOG_DATA)
    public message: string) { }

  ngOnInit() {
    this.timeId = countdown(new Date().setMinutes(new Date().getMinutes() + 5), (ts) => {
      this.time = ts;
      if (this.time.minutes == 0 && this.time.seconds == 0) {
        this.dialogRef.close();
      }
    }, countdown.MINUTES | countdown.SECONDS)
  }

  ngOnDestroy() {
    if (this.timeId) {
      clearInterval(this.timeId);
    }
  }

  onClickNO(): void {
    this.dialogRef.close();
  }

}
