import React, { useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface CSVUploadProps {
  onFileSelect: (file: File) => void;
  onLoadSimulatedData?: () => void;
  loading: boolean;
  error: string | null;
  totalActivities: number;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({
  onFileSelect,
  onLoadSimulatedData,
  loading,
  error,
  totalActivities
}) => {
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
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
          border-slate-700 hover:border-blue-400 hover:bg-slate-800/50
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-800">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-200">
              Arraste e solte seu CSV aqui
            </p>
            <p className="text-sm text-slate-400 mt-1">
              ou clique para selecionar do computador
            </p>
          </div>
        </div>
      </div>

      {/* Test Mode Toggle */}
      {onLoadSimulatedData && (
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800/50">
          <button
            onClick={onLoadSimulatedData}
            disabled={loading}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800/50"
          >
            <span>🧪</span>
            <span>Ativar Modo Teste (Dados Simulados)</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 text-blue-400 bg-blue-400/10 p-4 rounded-lg animate-pulse">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Processando dados...</span>
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

      {totalActivities !== undefined && totalActivities > 0 && !loading && !error && (
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
