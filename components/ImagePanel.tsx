'use client';

interface ImagePanelProps {
  imageUrl: string;
  onNewScreenshot: () => void;
}

export default function ImagePanel({ imageUrl, onNewScreenshot }: ImagePanelProps) {
  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Header with New Screenshot button */}
      <div className="p-6 flex justify-end border-b border-gray-800">
        <button
          onClick={onNewScreenshot}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
        >
          New Screenshot
        </button>
      </div>

      {/* Image Display */}
      <div className="flex-1 p-6 flex items-center justify-center overflow-auto">
        <img
          src={imageUrl}
          alt="Uploaded screenshot"
          className="max-w-full max-h-full object-contain rounded-lg border border-gray-800"
        />
      </div>
    </div>
  );
}

