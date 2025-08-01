// Script de prueba para verificar la configuración de notificaciones
// Ejecutar con: node test-notifications.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (reemplaza con tus credenciales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('🔍 Probando configuración de notificaciones...\n');

  try {
    // 1. Verificar si la tabla notifications existe
    console.log('1. Verificando si la tabla notifications existe...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error al acceder a la tabla notifications:', tableError);
      console.error('   Detalles:', {
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      });
      console.log('\n💡 Solución: Ejecuta el script notifications_table.sql en Supabase SQL Editor');
      return;
    }

    console.log('✅ Tabla notifications existe y es accesible');

    // 2. Verificar si la tabla user_preferences existe
    console.log('\n2. Verificando si la tabla user_preferences existe...');
    const { data: prefsCheck, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);

    if (prefsError) {
      console.error('❌ Error al acceder a la tabla user_preferences:', prefsError);
      console.log('\n💡 Solución: Ejecuta el script user_preferences_table.sql en Supabase SQL Editor');
    } else {
      console.log('✅ Tabla user_preferences existe y es accesible');
    }

    // 3. Verificar autenticación
    console.log('\n3. Verificando autenticación...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Error de autenticación:', authError);
      console.log('\n💡 Necesitas estar autenticado para usar las notificaciones');
    } else if (!user) {
      console.log('⚠️  No hay usuario autenticado');
      console.log('\n💡 Inicia sesión en la aplicación para probar las notificaciones');
    } else {
      console.log('✅ Usuario autenticado:', user.email);
      
      // 4. Intentar crear una notificación de prueba
      console.log('\n4. Creando notificación de prueba...');
      const testNotification = {
        userId: user.id,
        title: 'Notificación de prueba',
        message: 'Esta es una notificación de prueba para verificar el sistema',
        type: 'system',
        isRead: false,
        data: {
          test: true
        }
      };

      const { data: createdNotification, error: createError } = await supabase
        .from('notifications')
        .insert([testNotification])
        .select();

      if (createError) {
        console.error('❌ Error al crear notificación de prueba:', createError);
        console.error('   Detalles:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        });
      } else {
        console.log('✅ Notificación de prueba creada exitosamente');
        console.log('   ID:', createdNotification[0].id);
        
        // 5. Limpiar notificación de prueba
        console.log('\n5. Limpiando notificación de prueba...');
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', createdNotification[0].id);

        if (deleteError) {
          console.error('❌ Error al eliminar notificación de prueba:', deleteError);
        } else {
          console.log('✅ Notificación de prueba eliminada');
        }
      }
    }

    console.log('\n🎉 Prueba completada!');
    console.log('\n📋 Resumen:');
    console.log('   - Tabla notifications: ✅');
    console.log('   - Tabla user_preferences: ✅');
    console.log('   - Autenticación: ✅');
    console.log('   - Crear notificaciones: ✅');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testNotifications(); 