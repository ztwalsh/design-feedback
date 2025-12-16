'use client';

import Spinner from './Spinner';

interface AssessmentCardProps {
  label: string;
  rating: 'Good' | 'Strong' | 'Fair' | 'Needs Work' | null;
  type: 'accessibility' | 'overall';
  isLoading?: boolean;
}

export default function AssessmentCard({ label, rating, type, isLoading = false }: AssessmentCardProps) {
  const ratingColors = {
    'Good': 'text-green-400',
    'Strong': 'text-green-400',
    'Fair': 'text-yellow-400',
    'Needs Work': 'text-red-400',
  };

  return (
    <div className="bg-[#252525] border border-[#2F3134] rounded-xl p-6">
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      {isLoading || !rating ? (
        <div className="flex items-center">
          <Spinner size="sm" className="text-gray-500" />
        </div>
      ) : (
        <div className={`text-2xl font-semibold ${ratingColors[rating]}`}>
          {rating}
        </div>
      )}
    </div>
  );
}

