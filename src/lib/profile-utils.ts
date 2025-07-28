import { supabase } from './supabaseClient';

export interface ProfileUpdateResult {
  success: boolean;
  error?: string;
  updatedProfile?: any;
  updatedEmployee?: any;
}

export interface ProfileData {
  name: string;
  lastName: string;
  nickname: string;
  phone: string;
  address: string;
}

export async function updateUserProfile(
  userId: string, 
  userEmail: string, 
  profileData: ProfileData
): Promise<ProfileUpdateResult> {
  try {
    console.log('Updating profile for user:', userId, userEmail);
    console.log('Profile data:', profileData);

    let updateSuccess = false;
    let updatedProfile = null;
    let updatedEmployee = null;

    // 1. Intentar actualizar perfil en profiles (si existe)
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profileCheckError && existingProfile) {
      console.log('Updating existing profile...');
      const { data: profileUpdate, error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          last_name: profileData.lastName,
          full_name: profileData.nickname,
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Error updating profiles:', profileError);
      } else {
        console.log('Profile updated successfully');
        updatedProfile = profileUpdate;
        updateSuccess = true;
      }
    }

    // 2. Actualizar empleado (si existe)
    const { data: existingEmployee, error: employeeCheckError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!employeeCheckError && existingEmployee) {
      console.log('Updating existing employee...');
      const { data: employeeUpdate, error: employeeError } = await supabase
        .from('employees')
        .update({
          name: profileData.name,
          lastName: profileData.lastName,
          nickname: profileData.nickname,
          phone: profileData.phone,
          address: profileData.address,
        })
        .eq('id', existingEmployee.id)
        .select()
        .single();

      if (employeeError) {
        console.error('Error updating employees:', employeeError);
        throw employeeError;
      } else {
        console.log('Employee updated successfully');
        updatedEmployee = employeeUpdate;
        updateSuccess = true;
      }
    }

    // 3. Si no hay perfil pero sí empleado, crear perfil
    if (!existingProfile && existingEmployee) {
      console.log('Creating new profile for employee...');
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: profileData.name,
          last_name: profileData.lastName,
          full_name: profileData.nickname,
          email: userEmail,
          role: 'Empleado'
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        // No lanzar error aquí, al menos se actualizó employees
      } else {
        console.log('Profile created successfully');
        updatedProfile = newProfile;
      }
    }

    // 4. Si no hay ni perfil ni empleado, crear ambos
    if (!existingProfile && !existingEmployee) {
      console.log('Creating new profile and employee...');
      
      // Crear empleado primero
      const { data: newEmployee, error: createEmployeeError } = await supabase
        .from('employees')
        .insert({
          name: profileData.name,
          lastName: profileData.lastName,
          nickname: profileData.nickname,
          phone: profileData.phone,
          address: profileData.address,
          email: userEmail,
          subrole: 'empleado'
        })
        .select()
        .single();

      if (createEmployeeError) {
        console.error('Error creating employee:', createEmployeeError);
        throw createEmployeeError;
      }

      // Crear perfil
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: profileData.name,
          last_name: profileData.lastName,
          full_name: profileData.nickname,
          email: userEmail,
          role: 'Empleado'
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
      }

      updatedEmployee = newEmployee;
      updatedProfile = newProfile;
      updateSuccess = true;
    }

    if (updateSuccess) {
      return {
        success: true,
        updatedProfile,
        updatedEmployee
      };
    } else {
      return {
        success: false,
        error: 'No se pudo actualizar ningún registro'
      };
    }

  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    
    let errorMessage = 'Error desconocido al actualizar el perfil';
    
    if (error instanceof Error) {
      if (error.message.includes('policy')) {
        errorMessage = 'No tienes permisos para actualizar tu perfil. Contacta al administrador.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'Ya existe un registro con estos datos.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
} 