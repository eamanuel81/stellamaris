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

export async function updateUserProfile(userId: string, userEmail: string, profileData: any) {
    try {
        // Update profile silently
        
        // Verificar si existe un perfil
        const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            throw new Error(`Error checking profile: ${profileError.message}`);
        }

        if (existingProfile) {
            // Actualizar perfil existente
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name: profileData.name,
                    last_name: profileData.lastName,
                    full_name: profileData.nickname,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) {
                throw new Error(`Error updating profile: ${updateError.message}`);
            }

            // Profile updated successfully
        }

        // Verificar si existe un empleado
        const { data: existingEmployee, error: employeeError } = await supabase
            .from('employees')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (employeeError && employeeError.code !== 'PGRST116') {
            throw new Error(`Error checking employee: ${employeeError.message}`);
        }

        if (existingEmployee) {
            // Actualizar empleado existente
            const { error: updateError } = await supabase
                .from('employees')
                .update({
                    name: profileData.name,
                    lastName: profileData.lastName,
                    nickname: profileData.nickname,
                    phone: profileData.phone,
                    address: profileData.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', (existingEmployee as any).id);

            if (updateError) {
                throw new Error(`Error updating employee: ${updateError.message}`);
            }

            // Employee updated successfully
        } else {
            // Crear nuevo perfil para empleado
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    name: profileData.name,
                    last_name: profileData.lastName,
                    full_name: profileData.nickname,
                    email: userEmail,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (insertError) {
                throw new Error(`Error creating profile: ${insertError.message}`);
            }

            // Profile created successfully
        }

        // Crear nuevo perfil y empleado si no existen
        if (!existingProfile && !existingEmployee) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    name: profileData.name,
                    last_name: profileData.lastName,
                    full_name: profileData.nickname,
                    email: userEmail,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (insertError) {
                throw new Error(`Error creating profile: ${insertError.message}`);
            }

            // Profile and employee created successfully
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
} 