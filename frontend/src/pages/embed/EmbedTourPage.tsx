import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TourViewer from '@/components/TourViewer';

const EmbedTourPage: React.FC = () => {
  const { embedCode } = useParams<{ embedCode: string }>();
  
  return (
    <div className="w-full h-screen">
      <TourViewer embedMode={true} />
    </div>
  );
};

export default EmbedTourPage;