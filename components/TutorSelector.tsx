/**
 * TutorSelector - Select your personalized AI tutor
 * Displays 5 pre-built personas with unique personalities and teaching styles
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TutorPreset,
  getAllTutors,
  getSelectedTutorId,
  setSelectedTutor,
  isSelectedTutor,
} from '../services/tutorService';

interface TutorSelectorProps {
  onSelect: (tutor: TutorPreset) => void;
  onContinue: () => void;
}

export default function TutorSelector({ onSelect, onContinue }: TutorSelectorProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const tutors = getAllTutors();
  const [selectedId, setSelectedId] = React.useState(getSelectedTutorId());

  const handleSelect = (tutor: TutorPreset) => {
    setSelectedTutor(tutor.id);
    setSelectedId(tutor.id);
    onSelect(tutor);
  };

  const selectedTutor = tutors.find(t => t.id === selectedId);

  return (
    <div className="min-h-screen-safe bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 p-4 mobile-scroll pb-safe">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          {isArabic ? 'اختر معلّمك' : 'Choose Your Learning Guide'}
        </h1>
        <p className="text-emerald-200 text-sm">
          {isArabic
            ? 'كل معلّم لديه شخصية وأسلوب تعليم فريد'
            : 'Each tutor has a unique personality and teaching style'}
        </p>
      </div>

      {/* Tutor Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 max-w-lg mx-auto">
        {tutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            isSelected={tutor.id === selectedId}
            isArabic={isArabic}
            onSelect={() => handleSelect(tutor)}
          />
        ))}
      </div>

      {/* Selected Tutor Details */}
      {selectedTutor && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 max-w-lg mx-auto overflow-hidden">
          {/* Detail Image */}
          <div className="relative -mx-4 -mt-4 mb-4 h-40 overflow-hidden">
            <img
              src={selectedTutor.detailImage}
              alt={selectedTutor.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to emoji if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-white font-bold text-xl drop-shadow-lg">
                {isArabic ? selectedTutor.nameAr : selectedTutor.name}
              </h3>
              <p className="text-emerald-200 text-sm drop-shadow-md">
                {isArabic ? selectedTutor.subtitleAr : selectedTutor.subtitle}
              </p>
            </div>
          </div>
          <p className="text-white/80 text-sm mb-3">
            {isArabic ? selectedTutor.descriptionAr : selectedTutor.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {(isArabic ? selectedTutor.bestForAr : selectedTutor.bestFor).map((tag, idx) => (
              <span
                key={idx}
                className="bg-emerald-600/50 text-emerald-100 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="max-w-lg mx-auto">
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>{isArabic ? 'متابعة' : 'Continue'}</span>
          <i className={`fas fa-arrow-${isArabic ? 'left' : 'right'}`}></i>
        </button>
      </div>
    </div>
  );
}

// Individual Tutor Card Component
interface TutorCardProps {
  tutor: TutorPreset;
  isSelected: boolean;
  isArabic: boolean;
  onSelect: () => void;
}

function TutorCard({ tutor, isSelected, isArabic, onSelect }: TutorCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <button
      onClick={onSelect}
      className={`
        relative p-4 rounded-2xl text-center transition-all transform
        ${isSelected
          ? 'bg-emerald-500 scale-105 shadow-xl ring-2 ring-white'
          : 'bg-white/10 hover:bg-white/20 hover:scale-102'
        }
      `}
    >
      {/* Selected Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center z-10">
          <i className="fas fa-check text-emerald-600 text-sm"></i>
        </div>
      )}

      {/* Avatar Image */}
      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-white/20">
        {!imageError ? (
          <img
            src={tutor.avatarImage}
            alt={tutor.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {tutor.avatar}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-white font-bold text-sm mb-1">
        {isArabic ? tutor.nameAr : tutor.name}
      </h3>

      {/* Subtitle */}
      <p className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-emerald-300'}`}>
        {isArabic ? tutor.subtitleAr : tutor.subtitle}
      </p>
    </button>
  );
}

// Compact Tutor Badge for use in headers
interface TutorBadgeProps {
  tutorId?: string;
  onClick?: () => void;
}

export function TutorBadge({ tutorId, onClick }: TutorBadgeProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');
  const tutors = getAllTutors();
  const tutor = tutors.find(t => t.id === (tutorId || getSelectedTutorId()));
  const [imageError, setImageError] = React.useState(false);

  if (!tutor) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-2 py-1 transition-all"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20">
        {!imageError ? (
          <img
            src={tutor.avatarImage}
            alt={tutor.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            {tutor.avatar}
          </div>
        )}
      </div>
      <span className="text-white text-sm font-medium">
        {isArabic ? tutor.nameAr : tutor.name}
      </span>
      <i className="fas fa-chevron-down text-white/60 text-xs"></i>
    </button>
  );
}
