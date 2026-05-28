// Native Federation dynamic import
// Carrega bootstrap de forma assíncrona para permitir
// que o Native Federation resolva dependências compartilhadas primeiro
import('./bootstrap')
  .catch(err => console.error('❌ [Angular 20 NF] Failed to load bootstrap:', err));


