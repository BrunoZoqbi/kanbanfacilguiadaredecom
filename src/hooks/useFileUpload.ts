import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UploadResult {
  fileName: string;
  filePath: string;
  fileType: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File, taskId: string): Promise<UploadResult | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer upload');
      return null;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      return {
        fileName: file.name,
        filePath: data.path,
        fileType: file.type,
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Signed URLs are generated on demand (short expiry) instead of being
  // stored, since a URL saved in the database would go stale once it expires.
  const getSignedUrl = async (filePath: string, expiresIn = 60): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(filePath, expiresIn);

      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to generate signed URL');
      }

      return data.signedUrl;
    } catch (error: any) {
      console.error('Signed URL error:', error);
      toast.error('Erro ao gerar link do anexo: ' + error.message);
      return null;
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('task-attachments')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Erro ao excluir arquivo: ' + error.message);
      return false;
    }
  };

  return {
    uploadFile,
    getSignedUrl,
    deleteFile,
    isUploading,
    uploadProgress,
  };
};
