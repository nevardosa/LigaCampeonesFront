import { Component, OnInit, Inject } from '@angular/core';
import{MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Config } from 'protractor';
import { inject } from '@angular/core/testing';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public  message: string ) { }

  ngOnInit() {
  }

  onClickNO(): void{
  this.dialogRef.close();    

  }

}
