/**
 * Script de validación de contenido
 *
 * Ejecuta: pnpm content:validate
 *
 * Valida que todos los eventos y textos cumplan con los esquemas Zod
 */

import { loadEvents, loadKeyMoments, loadOrigins, loadWeeklyActions } from './career/load';
import { loadClubNamePool, loadCountries, loadPersonNamePool } from './worldgen/load';

function validateContent(): void {
  console.log('🔍 Validando contenido del juego...\n');

  let errors = 0;

  try {
    const countries = loadCountries();
    console.log(`📁 Países (worldgen): ${countries.length} archivos válidos`);

    loadClubNamePool();
    console.log('📁 Pool de nombres de club (worldgen): válido');

    for (const country of countries) {
      loadPersonNamePool(country.code);
    }
    console.log(`📁 Pools de nombres de persona (worldgen): ${countries.length} archivos válidos`);
  } catch (error) {
    errors++;
    console.error('❌ Error validando datos de worldgen:', error);
  }

  try {
    const origins = loadOrigins();
    console.log(`📁 Orígenes de personaje (carrera): ${origins.length} válidos`);
  } catch (error) {
    errors++;
    console.error('❌ Error validando orígenes de carrera:', error);
  }

  try {
    const weeklyActions = loadWeeklyActions();
    console.log(`📁 Acciones semanales (carrera): ${weeklyActions.length} válidas`);
  } catch (error) {
    errors++;
    console.error('❌ Error validando acciones semanales:', error);
  }

  try {
    const keyMoments = loadKeyMoments();
    console.log(`📁 Momentos clave (carrera): ${keyMoments.length} válidos`);
  } catch (error) {
    errors++;
    console.error('❌ Error validando momentos clave:', error);
  }

  try {
    const events = loadEvents();
    console.log(`📁 Eventos de decisión (carrera): ${events.length} válidos`);
  } catch (error) {
    errors++;
    console.error('❌ Error validando eventos de decisión:', error);
  }

  // TODO: Eventos de entrenador (Fase 4) y traducciones (Fase 6) cuando existan
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
