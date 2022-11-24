// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

 // Ambiente LOCAL
/*
url_proxy: 'http://localhost:62586',
url_sergeneral: 'http://localhost:61418',
url_ligaCampeones: 'http://localhost:8080',
*/

  // Ambiente DEV nuevo CO_Claro_IntCus_EAF_Domain_Dev
  
   url_proxy: 'http://100.123.13.103:8002/wsProxy',
   url_ligaCampeones: 'http://100.123.13.103:8002/WSLigaCampeones',
  // url_ligaCampeones: 'http://100.123.246.50:8080/WSSalesChannelredemption-web',
   url_sergeneral: 'http://100.123.13.103:8002/WSSerGeneral'


/*
     url_proxy: 'https://ligadecampeonesclaro.com.co/wsProxy',
     url_sergeneral: 'https://ligadecampeonesclaro.com.co/WSSerGeneral',
     url_ligaCampeones: 'https://ligadecampeonesclaro.com.co/WSLigaCampeones' 
 */   
}

