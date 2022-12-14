import {NgModule, Optional, SkipSelf} from '@angular/core';
//import {BaseRequestOptions} from '@angular/http';
import {StorageService} from "./storage.service";


@NgModule({
    declarations: [  ],
    imports: [],
    providers: [
      StorageService,
      //BaseRequestOptions
    ],
    bootstrap: []
  })
  export class CoreModule {
    constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
      if (parentModule) {
        throw new Error(
          'CoreModule is already loaded. Import it in the AppModule only');
      }
    }
  }