import "zone.js";
import { createApplication } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideHttpClient } from "@angular/common/http";
import { AppComponent } from "./shell/app.component";
import { APP_INITIALIZER } from "@angular/core";
import { createCustomElement } from "@angular/elements";
import { environment } from "./environments/environment";
import _ from "lodash";
import moment from "moment";
import dayjs from "dayjs";
import { format as formatDateFns, addDays } from "date-fns";
import * as R from "ramda";
import * as math from "mathjs";
import * as THREE from "three";
import Chart from "chart.js/auto";
import * as echarts from "echarts";
import * as XLSX from "xlsx";

function forceHeavyDepsUsage() {
  const now = new Date();
  const dates = [
    moment(now).format("YYYY-MM-DD"),
    dayjs(now).add(1, "day").format("YYYY-MM-DD"),
    formatDateFns(addDays(now, 2), "yyyy-MM-dd"),
  ];

  const calc = math.evaluate("(2+3)^4") as number;
  const vec = new THREE.Vector3(3, 4, 12).length();
  const arr = _.range(0, 200).map((n) => n * 2);
  const grouped = R.groupBy((v: number) => (v % 3 === 0 ? "m3" : "other"), arr);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["calc", "vec", "chart", "echarts"],
    [calc, vec, Chart.version, echarts.version],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "metrics");

  (window as any).__heavyDepsSnapshot = {
    dates,
    calc,
    vec,
    groupedCount: Object.keys(grouped).length,
    xlsxSheets: wb.SheetNames.length,
    chartVersion: Chart.version,
    echartsVersion: echarts.version,
  };
}

forceHeavyDepsUsage();

const APP_CONFIG = {
  productName: "Angular 20 Native Federation",
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
      useFactory: () => () => console.info("✅ [Angular 20 NF] Config carregado", APP_CONFIG),
    },
  ],
})
  .then((appRef) => {
    const injector = appRef.injector;
    if (!customElements.get("angular-full-mfe-card")) {
      const element = createCustomElement(AppComponent, { injector });
      customElements.define("angular-full-mfe-card", element);
      console.log("✅ [Angular 20 NF] Custom element registered with Native Federation");
    }
  })
  .catch((err) => console.error("❌ [Angular 20 NF] Bootstrap error:", err));
