"use client";

import { supabase } from './supabase-client';
import { toast } from 'sonner';

export interface Case {
  id: string;
  title: string;
  clientName: string;
  description: string;
  status: "active" | "pending" | "closed";
  priority: "high" | "medium" | "low";
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateCaseInput {
  title: string;
  clientName: string;
  description: string;
  status: "active" | "pending" | "closed";
  priority: "high" | "medium" | "low";
  tags?: string[];
  userId: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const caseService = {
  async createCase(data: CreateCaseInput) {
    try {
      console.log('Creating case with data:', {
        ...data,
        userId: data.userId,
        isDevelopment
      });

      // Validate Supabase connection
      const { error: healthCheck } = await supabase.from('cases').select('count').limit(1);
      if (healthCheck) {
        console.error('Supabase connection error:', healthCheck);
        throw new Error('Database connection error. Please check your configuration.');
      }

      const { data: newCase, error } = await supabase
        .from('cases')
        .insert({
          title: data.title,
          client_name: data.clientName,
          description: data.description,
          status: data.status,
          priority: data.priority,
          tags: data.tags || [],
          user_id: isDevelopment ? process.env.NEXT_PUBLIC_DEV_USER_ID : data.userId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error cases
        switch (error.code) {
          case '23503':
            throw new Error('User authentication error. Please sign in again.');
          case '23505':
            throw new Error('A case with this title already exists.');
          case '42501':
            throw new Error('Permission denied. Please check your access rights.');
          case 'PGRST301':
            throw new Error('Database connection error. Please check your configuration.');
          default:
            throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log('Case created successfully:', newCase);
      return newCase;
    } catch (err) {
      console.error('Detailed error:', {
        error: err,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });

      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Failed to create case. Please try again.');
    }
  },

  async getCases(userId: string) {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting cases:', err);
      throw err;
    }
  },

  async getCase(id: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting case:', err);
      throw err;
    }
  },

  async updateCase(id: string, userId: string, data: Partial<CreateCaseInput>) {
    try {
      const { data: updatedCase, error } = await supabase
        .from('cases')
        .update({
          title: data.title,
          client_name: data.clientName,
          description: data.description,
          status: data.status,
          priority: data.priority,
          tags: data.tags
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updatedCase;
    } catch (err) {
      console.error('Error updating case:', err);
      throw err;
    }
  },

  async deleteCase(id: string, userId: string) {
    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting case:', err);
      throw err;
    }
  }
}; 