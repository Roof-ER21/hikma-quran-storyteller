import React, { useState } from 'react';
import {
  markExperiencePromptShown,
  recordLowSatisfactionFeedback,
  requestInAppReviewIfEligible,
} from '../services/inAppReviewService';
import { openIssueReporter } from '../services/issueReportService';

interface ExperienceFeedbackPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExperienceFeedbackPrompt: React.FC<ExperienceFeedbackPromptProps> = ({
  isOpen,
  onClose,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const closePrompt = () => {
    markExperiencePromptShown();
    setStatus(null);
    onClose();
  };

  const handlePositive = async () => {
    setSubmitting(true);
    try {
      await requestInAppReviewIfEligible();
      setStatus('Thank you for helping us grow.');
      setTimeout(closePrompt, 900);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNegative = () => {
    recordLowSatisfactionFeedback();
    openIssueReporter({
      source: 'experience_prompt',
      category: 'needs_work',
      summary: 'User selected "Needs work" from in-app experience prompt.',
    });
    setStatus('Thanks for the feedback. We are listening.');
    setTimeout(closePrompt, 900);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-stone-100 dark:border-dark-border p-5">
        <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
          How is Alaya &amp; Soad&apos;s Gift working for your family?
        </h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
          Your feedback helps us improve reliability and learning quality.
        </p>

        {status && (
          <div className="mt-3 text-sm rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2">
            {status}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handlePositive}
            disabled={submitting}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            {submitting ? 'Submitting...' : 'Love it'}
          </button>
          <button
            onClick={handleNegative}
            disabled={submitting}
            className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
          >
            Needs work
          </button>
        </div>

        <button
          onClick={closePrompt}
          className="mt-3 w-full py-2 text-sm rounded-lg text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-dark-border hover:bg-stone-50 dark:hover:bg-dark-surface transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
};

export default ExperienceFeedbackPrompt;
