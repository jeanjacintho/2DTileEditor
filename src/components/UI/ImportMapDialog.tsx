import React, { useRef, useState } from 'react';
import { Upload } from '@nsmr/pixelart-react';

// Componentes simples para ícones não disponíveis
const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const AlertCircleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

const CheckCircleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

interface ImportMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: { mapFile: File; tilesFile?: File }) => Promise<void>;
}

export default function ImportMapDialog({ isOpen, onClose, onImport }: ImportMapDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<{ mapFile: File | null; tilesFile: File | null }>({
    mapFile: null,
    tilesFile: null
  });
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    let mapFile: File | null = null;
    let tilesFile: File | null = null;

    // Separar arquivos por tipo
    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      if (fileName === 'map.json') {
        mapFile = file;
      } else if (fileName === 'tiles.json') {
        tilesFile = file;
      } else if (fileName.endsWith('.json')) {
        // Se não tem nome específico, assumir que é map.json se não tiver um ainda
        if (!mapFile) {
          mapFile = file;
        }
      }
    });

    // Validar se pelo menos o map.json foi selecionado
    if (!mapFile) {
      setError('Por favor, selecione pelo menos um arquivo map.json válido.');
      setSelectedFiles({ mapFile: null, tilesFile: null });
      return;
    }

    setSelectedFiles({ mapFile, tilesFile });
    setError(null);
    setSuccess(false);
  };

  const handleFileButtonClick = () => {
    console.log('Botão clicado, fileInputRef.current:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('fileInputRef.current é null');
    }
  };

  const handleImport = async () => {
    if (!selectedFiles.mapFile) return;

    setIsImporting(true);
    setError(null);
    setSuccess(false);

    try {
      await onImport({ 
        mapFile: selectedFiles.mapFile!, 
        tilesFile: selectedFiles.tilesFile || undefined 
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao importar mapa');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles({ mapFile: null, tilesFile: null });
    setError(null);
    setSuccess(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogClose = () => {
    handleClose();
    onClose();
  };

  if (!isOpen) {
    return (
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isImporting}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
      {/* Input file sempre presente, mas invisível */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isImporting}
      />
      
      <div className="bg-custom-black border border-custom-light-gray p-6 w-96 max-w-full mx-4" style={{ zIndex: 10000, pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-custom-white">Importar Mapa</h2>
          <button
            onClick={handleDialogClose}
            className="text-custom-light-gray hover:text-custom-white transition-colors"
            disabled={isImporting}
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status de sucesso */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 text-green-400">
              <CheckCircleIcon size={16} />
              <span className="text-sm">Mapa importado com sucesso!</span>
            </div>
          )}

          {/* Status de erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 text-red-400">
              <AlertCircleIcon size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Área de upload */}
          <div className="border-2 border-dashed border-custom-light-gray p-6 text-center bg-custom-pure-black">
            <Upload size={32} className="mx-auto text-custom-light-gray mb-2" />
            <p className="text-custom-white mb-2">Selecione arquivos de mapa (.json)</p>
            <p className="text-sm text-custom-light-gray mb-4">
              Selecione map.json (obrigatório) e opcionalmente tiles.json<br/>
              O map.json deve conter layers com tiles no formato: {`{id: "x_y", x: number, y: number}`}
            </p>
            
            <button
              onClick={handleFileButtonClick}
              disabled={isImporting}
              className="w-full px-4 py-2 bg-custom-color hover:bg-blue-600 text-custom-white border border-black shadow-button font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selecionar Arquivo
            </button>
          </div>

          {/* Arquivos selecionados */}
          {(selectedFiles.mapFile || selectedFiles.tilesFile) && (
            <div className="space-y-2">
              {selectedFiles.mapFile && (
                <div className="p-3 bg-custom-medium-gray border border-custom-light-gray">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-custom-white font-medium">📄 {selectedFiles.mapFile.name}</p>
                      <p className="text-sm text-custom-light-gray">
                        {(selectedFiles.mapFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles(prev => ({ ...prev, mapFile: null }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-custom-light-gray hover:text-custom-white transition-colors"
                      disabled={isImporting}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              {selectedFiles.tilesFile && (
                <div className="p-3 bg-custom-medium-gray border border-custom-light-gray">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-custom-white font-medium">🎨 {selectedFiles.tilesFile.name}</p>
                      <p className="text-sm text-custom-light-gray">
                        {(selectedFiles.tilesFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFiles(prev => ({ ...prev, tilesFile: null }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-custom-light-gray hover:text-custom-white transition-colors"
                      disabled={isImporting}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDialogClose}
              disabled={isImporting}
              className="flex-1 px-4 py-2 bg-custom-light-gray hover:bg-custom-black text-custom-white shadow-button font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFiles.mapFile || isImporting}
              className="flex-1 px-4 py-2 bg-custom-color hover:bg-blue-600 text-custom-white border border-black shadow-button font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-custom-color focus:ring-offset-2 focus:ring-offset-custom-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}