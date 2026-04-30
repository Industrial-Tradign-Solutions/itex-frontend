// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api_url: 'http://localhost:8080/itex/api/',
  webSocket_url: 'ws://localhost:8080/itex/api/websocket',
  encrypt_data_key: 'clave para encriptar los datos del local storage',
  web_url: 'http://localhost:4200/p/',
  timeout: 1000,
  max_open_tabs: 5
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
