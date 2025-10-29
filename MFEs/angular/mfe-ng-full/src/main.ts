import "zone.js";
import { createApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { AppComponent } from "./shell/app.component";
import { APP_INITIALIZER } from "@angular/core";
import { createCustomElement } from "@angular/elements";
import { environment } from "./environments/environment";

const APP_CONFIG = {
  productName: "Angular Full",
  version: "0.1.0",
  apiBaseUrl: environment.apiUrl,
};

createApplication({
  providers: [
    provideHttpClient(),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [],
      useFactory: () => () => console.info("Config carregado", APP_CONFIG),
    },
  ],
})
  .then((appRef) => {
    const injector = appRef.injector;
    if (!customElements.get("angular-full-mfe-card")) {
      const element = createCustomElement(AppComponent, { injector });
      customElements.define("angular-full-mfe-card", element);
    }
  })
  .catch((err) => console.error(err));

