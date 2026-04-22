import { useState } from "react";
import { FileText, Download } from "lucide-react";

export default function CycleReportViewer({ reportFilePath }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!reportFilePath) return null;

  const fileUrl = `http://localhost:8080/autoclave/cycle/report/${reportFilePath}`;
  const fileExtension = reportFilePath.split(".").pop().toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(
    fileExtension
  );

  return (
    <div className="mt-6">
      <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Relatório do Ciclo
      </h5>

      {isImage ? (
        <div className="flex flex-col items-center space-y-3">
          {/* Miniatura */}
          <img
            src={fileUrl}
            alt="Relatório"
            className="w-52 h-auto rounded-lg shadow cursor-pointer hover:opacity-80 transition"
            onClick={() => setIsOpen(true)}
          />

          {/* Modal de preview */}
          {isOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
              onClick={() => setIsOpen(false)}
            >
              <img
                src={fileUrl}
                alt="Preview"
                className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Download */}
          <a
            href={fileUrl}
            download
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Baixar Arquivo
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-gray-700">Arquivo disponível para download</p>
          <a
            href={fileUrl}
            download
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Baixar Arquivo
          </a>
        </div>
      )}
    </div>
  );
}
