import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UploadResult {
  fileName: string;
  fileUrl: string;
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

      // Get signed URL (bucket is private for security)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(data.path, 3600 * 24 * 7); // 7 days expiry

      if (urlError || !urlData?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      setUploadProgress(100);

      return {
        fileName: file.name,
        fileUrl: urlData.signedUrl,
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

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('task-attachments') + 1).join('/');

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
    deleteFile,
    isUploading,
    uploadProgress,
  };
};
