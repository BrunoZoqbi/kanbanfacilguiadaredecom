import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { extractPdfText } from '@/lib/pdfText';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  taskId: string;
  onUploadComplete?: () => void;
  compact?: boolean;
  // Quando informado, PDFs não são enviados ao storage: o texto é
  // extraído no browser e devolvido para quem chama inserir na descrição
  // da tarefa. Sem esse callback, PDFs seguem o fluxo normal de upload.
  onPdfTextExtracted?: (text: string) => void;
}

interface AttachmentPreview {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  taskId,
  onUploadComplete,
  compact = false,
  onPdfTextExtracted,
}) => {
  const { user } = useAuth();
  const { uploadFile, isUploading, uploadProgress } = useFileUpload();
  const queryClient = useQueryClient();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ file: File; text: string } | null>(null);
  const [pdfFailedFile, setPdfFailedFile] = useState<File | null>(null);

  const uploadRegular = useCallback(async (file: File) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    const result = await uploadFile(file, taskId);

    if (result) {
      const { error } = await supabase.from('task_attachments').insert({
        task_id: taskId,
        file_name: result.fileName,
        file_path: result.filePath,
        file_type: result.fileType,
        uploaded_by_id: user.id,
      });

      if (error) {
        toast.error('Erro ao salvar anexo');
      } else {
        toast.success(`${result.fileName} anexado!`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] });
    onUploadComplete?.();
  }, [taskId, user, uploadFile, queryClient, onUploadComplete]);

  const handlePdfFile = useCallback(async (file: File) => {
    setIsExtractingPdf(true);
    try {
      const text = await extractPdfText(file);
      if (!text) {
        setPdfFailedFile(file);
      } else {
        setPdfPreview({ file, text });
      }
    } catch {
      setPdfFailedFile(file);
    } finally {
      setIsExtractingPdf(false);
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    for (const file of acceptedFiles) {
      if (file.type === 'application/pdf' && onPdfTextExtracted) {
        await handlePdfFile(file);
      } else {
        await uploadRegular(file);
      }
    }
  }, [user, onPdfTextExtracted, handlePdfFile, uploadRegular]);

  const confirmPdfText = () => {
    if (pdfPreview) {
      onPdfTextExtracted?.(pdfPreview.text);
      toast.success('Texto do PDF adicionado à descrição da tarefa!');
    }
    setPdfPreview(null);
    onUploadComplete?.();
  };

  const uploadFailedPdfAsIs = () => {
    const file = pdfFailedFile;
    setPdfFailedFile(null);
    if (file) uploadRegular(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading || isExtractingPdf,
  });

  const pdfDialogs = (
    <>
      <AlertDialog open={!!pdfPreview} onOpenChange={(o) => { if (!o) setPdfPreview(null); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Texto extraído do PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme para adicionar este texto à descrição da tarefa. O arquivo PDF em si não
              é anexado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 overflow-y-auto rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
            {pdfPreview?.text}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPdfPreview(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPdfText}>Adicionar à descrição</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pdfFailedFile} onOpenChange={(o) => { if (!o) setPdfFailedFile(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Não foi possível extrair texto deste PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Esse arquivo pode ser um PDF escaneado (imagem), sem texto selecionável. Deseja
              anexar o arquivo normalmente mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPdfFailedFile(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={uploadFailedPdfAsIs}>Anexar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (compact) {
    return (
      <>
        <div
          {...getRootProps()}
          className={cn(
            'flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
              <Progress value={uploadProgress} className="flex-1 h-2" />
            </>
          ) : isExtractingPdf ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Lendo PDF...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isDragActive ? 'Solte aqui...' : 'Arraste arquivos ou clique'}
              </span>
            </>
          )}
        </div>
        {pdfDialogs}
      </>
    );
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando arquivo...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs h-2" />
          </div>
        ) : isExtractingPdf ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Lendo PDF...</p>
          </div>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos para anexar'}
            </p>
            <p className="text-xs text-muted-foreground">
              Imagens, PDFs e documentos (máx. 10MB)
            </p>
          </>
        )}
      </div>
      {pdfDialogs}
    </>
  );
};

export default FileUploadZone;

export const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return Image;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

export const AttachmentItem: React.FC<{
  attachment: AttachmentPreview;
  onDelete?: () => void;
  canDelete?: boolean;
}> = ({ attachment, onDelete, canDelete }) => {
  const { getSignedUrl } = useFileUpload();
  const Icon = getFileIcon(attachment.fileType);
  const isImage = attachment.fileType?.startsWith('image/');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    getSignedUrl(attachment.filePath).then((url) => {
      if (active) setPreviewUrl(url);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.filePath, isImage]);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOpening) return;
    setIsOpening(true);
    // Open a blank tab synchronously (on the user gesture) so popup blockers
    // don't kick in while the fresh signed URL is being fetched.
    const newWindow = window.open('', '_blank', 'noopener,noreferrer');
    const url = await getSignedUrl(attachment.filePath);
    setIsOpening(false);

    if (url && newWindow) {
      newWindow.location.href = url;
    } else {
      newWindow?.close();
      toast.error('Não foi possível abrir o anexo');
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border bg-card group">
      {isImage ? (
        <a
          href="#"
          onClick={handleOpen}
          className="h-12 w-12 rounded overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={attachment.fileName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon className="h-6 w-6 text-muted-foreground" />
          )}
        </a>
      ) : (
        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <a
          href="#"
          onClick={handleOpen}
          className="text-sm font-medium truncate block hover:text-primary"
        >
          {attachment.fileName}
        </a>
        <p className="text-xs text-muted-foreground">
          {attachment.fileType?.split('/')[1]?.toUpperCase() || 'Arquivo'}
        </p>
      </div>

      {canDelete && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remover anexo"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir anexo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este anexo? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: 'destructive' })}
                onClick={onDelete}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
