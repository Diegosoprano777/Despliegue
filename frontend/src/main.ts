import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';

// 🔥 IMPORTS PARA ESPAÑOL
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// 🔥 REGISTRAR ESPAÑOL
registerLocaleData(localeEs);

import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    ...appConfig.providers
  ]
})
.catch(err => console.error(err));