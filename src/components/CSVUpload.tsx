import React, { useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  totalActivities?: number;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ onFileSelect, loading, error, totalActivities }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      console.log('📤 Arquivo dropado:', file.name, 'Tipo:', file.type);
      onFileSelect(file);
    } else if (file) {
      console.warn('⚠️ Arquivo rejeitado (não é CSV):', file.name, 'Tipo:', file.type);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 transition"
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
        <p className="text-slate-300 font-medium">
          Selecione ou arraste o Framework CSV aqui
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Formato: CSV | Encoding: Latin-1
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {loading && (
        <div className="mt-4 p-3 bg-blue-900 border border-blue-700 rounded flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-300">Processando arquivo...</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">Erro ao processar</p>
            <p className="text-red-400 text-sm whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {totalActivities && totalActivities > 0 && !loading && !error && (
        <div className="mt-4 p-3 bg-green-900 border border-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300">
            ✅ {totalActivities} atividades carregadas com sucesso
          </span>
        </div>
      )}
    </div>
  );
};
