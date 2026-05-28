const { withNativeFederation } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',
  
  // HOST não expõe nada, apenas consome e compartilha
  exposes: {},
  
  // Lista de remotes que o shell pode carregar
  remotes: {
    // Será carregado dinamicamente via loadRemoteModule
  },

  // Runtime compartilhado (provido pelo HOST)
  shared: {
    // Angular core
    '@angular/core': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/common': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/common/http': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/router': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/platform-browser': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/platform-browser-dynamic': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/animations': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/elements': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    
    // RxJS
    'rxjs': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    'rxjs/operators': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    
    // Zone.js (se não for zoneless)
    // 'zone.js': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    
    // Heavy deps compartilhadas (economiza MB!)
    'lodash': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'moment': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'dayjs': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'date-fns': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'ramda': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'mathjs': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'three': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'chart.js': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'echarts': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
    'xlsx': { singleton: false, strictVersion: false, requiredVersion: 'auto', eager: false },
  },

  // Skip: não precisamos validar versões em dev
  skip: [
    'tslib',
  ],
});
