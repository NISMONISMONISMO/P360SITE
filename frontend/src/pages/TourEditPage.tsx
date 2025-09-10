import React from 'react';
import { useParams } from 'react-router-dom';
import TourBuilderPage from './TourBuilderPage';

const TourEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return <TourBuilderPage />;
};

export default TourEditPage;