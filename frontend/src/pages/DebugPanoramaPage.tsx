import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import DebugPanoramaViewer from '../components/DebugPanoramaViewer';

const DebugPanoramaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [panoramaId, setPanoramaId] = useState<number>(id ? parseInt(id, 10) : 1);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setPanoramaId(value);
    }
  };

  const loadPanorama = () => {
    navigate(`/debug/panorama/${panoramaId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 mr-2" />
              Back to Home
            </button>
            
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={panoramaId}
                onChange={handleIdChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                min="1"
              />
              <button
                onClick={loadPanorama}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-screen pt-20">
        <DebugPanoramaViewer panoramaId={panoramaId} />
      </div>
    </div>
  );
};

export default DebugPanoramaPage;