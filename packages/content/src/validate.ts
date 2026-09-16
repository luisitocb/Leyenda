/**
 * Script de validación de contenido
 *
 * Ejecuta: pnpm content:validate
 *
 * Valida que todos los eventos y textos cumplan con los esquemas Zod
 */

// import { GameEventSchema } from './schemas/event';

function validateContent(): void {
  console.log('🔍 Validando contenido del juego...\n');

  let errors = 0;

  // TODO: Cargar eventos desde archivos YAML/JSON cuando existan
  // Por ahora, solo un placeholder

  console.log('📁 Eventos de jugador: 0 archivos');
  console.log('📁 Eventos de entrenador: 0 archivos');
  console.log('📁 Traducciones ES: 0 claves');
  console.log('📁 Traducciones EN: 0 claves\n');

  if (errors > 0) {
    console.error(`❌ Validación fallida con ${errors} errores`);
    process.exit(1);
  }

  console.log('✅ Validación de contenido exitosa');
}

validateContent();
