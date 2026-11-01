import 'zone.js'; // <-- AGREGAR ESTA LÍNEA AL PRINCIPIO DE TODO

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Registro de controladores y elementos de Chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
