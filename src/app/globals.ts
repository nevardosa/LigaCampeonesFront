import { Injectable } from '@angular/core';

@Injectable()
export class Globals {
  TOKEN: string;
  LOGIN: boolean;
  TIME: number;
  ADMIN: boolean;

  constructor(){
    this.LOGIN = true;
  }
}
