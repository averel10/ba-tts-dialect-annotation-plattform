'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveOnboardingAnswers } from '@/app/actions/onboarding';
import { DIALECT_LABELS_WITHOUT_DE } from '@/lib/dialects';

interface OnboardingFormViewProps {
  experimentId: number;
}

interface ResidenceEntry {
  region: string;
  years: string;
}

interface FormData {
  age?: string;
  residences?: ResidenceEntry[];
  dialectQualities?: Record<string, string>;
  listeningExperience?: string;
  additionalNotes?: string;
}

type Step = 1 | 2 | 3;

export default function OnboardingFormView({ experimentId }: OnboardingFormViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Initialize dialect qualities with default value of '3' for each dialect
  const initializeDialectQualities = (): Record<string, string> => {
    const qualities: Record<string, string> = {};
    Object.keys(DIALECT_LABELS_WITHOUT_DE).forEach(key => {
      qualities[key] = '3';
    });
    return qualities;
  };
  
  const [formData, setFormData] = useState<FormData>({
    age: '',
    residences: [{ region: '', years: '' }],
    dialectQualities: initializeDialectQualities()
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentStep]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDialectQualityChange = (region: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dialectQualities: {
        ...prev.dialectQualities,
        [region]: value,
      },
    }));
  };

  const handleResidenceChange = (
    index: number,
    field: keyof ResidenceEntry,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      residences: prev.residences?.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  };

  const addResidence = () => {
    setFormData((prev) => ({
      ...prev,
      residences: [...(prev.residences || []), { region: '', years: '' }],
    }));
  };

  const removeResidence = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      residences: prev.residences?.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.age) {
          setError('Bitte wählen Sie eine Altersgruppe aus.');
          return false;
        }
        break;
      case 2:
        const hasValidResidence = formData.residences?.some(
          (r) => r.region && r.years
        );
        if (!hasValidResidence) {
          setError('Bitte fügen Sie mindestens einen Wohnort mit Jahresangabe hinzu.');
          return false;
        }
        break;
      case 3:
        const allDialects = Object.keys(DIALECT_LABELS_WITHOUT_DE);
        const hasAllDialectQualities = allDialects.every(
          (region) => formData.dialectQualities?.[region]
        );
        if (!hasAllDialectQualities) {
          setError('Bitte bewerten Sie Ihre Fähigkeit für alle Dialekte.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = () => {
    setError(null);

    startTransition(async () => {
      try {
        await saveOnboardingAnswers(experimentId, formData);
        // Redirect to the experiment annotation page to trigger a refresh
        router.refresh();
      } catch (err) {
        console.error('Error saving onboarding answers:', err);
        setError('Fehler beim Speichern des Formulars. Bitte versuchen Sie es erneut.');
      }
    });
  };

  const stepTitles: Record<Step, string> = {
    1: 'Persönliche Informationen',
    2: 'Aufenthaltsorte',
    3: 'Selbsteinschätzung',
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-600">
                Schritt {currentStep} von 3
              </h2>
              <div className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}%</div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{stepTitles[currentStep]}</h1>
          </div>

          {/* Form */}
          <form className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Persönliche Informationen */}
            {currentStep === 1 && (
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-900 mb-2">
                  Altersgruppe <span className="text-red-600">*</span>
                </label>
                <select
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Bitte wählen --</option>
                  <option value="18-">Unter 18 Jahre</option>
                  <option value="18-25">18-25 Jahre</option>
                  <option value="26-35">26-35 Jahre</option>
                  <option value="36-45">36-45 Jahre</option>
                  <option value="46-55">46-55 Jahre</option>
                  <option value="56-65">56-65 Jahre</option>
                  <option value="66+">66+ Jahre</option>
                </select>
              </div>
            )}

            {/* Step 2: Aufenthaltsorte */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600 mb-4">
                  Bitte geben Sie die Regionen an, in denen Sie länger als 1 Jahr gelebt haben, sowie die Anzahl der Jahre. Diese Informationen helfen uns, Ihre Dialektkenntnisse besser einzuschätzen.
                </p>
                {/* Map Placeholder */}
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-gray-500 font-medium">Karte kommt hier (mit Dialektregionen)</p>
                  </div>
                </div>

                {/* Residence Entries */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">
                    Aufenthaltsorte, die länger als 1 Jahr waren <span className="text-red-600">*</span>
                  </label>

                  <div className="space-y-4">
                    {formData.residences?.map((residence, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Region
                          </label>
                          <select
                            value={residence.region}
                            onChange={(e) =>
                              handleResidenceChange(index, 'region', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">-- Wählen --</option>
                            {Object.entries(DIALECT_LABELS_WITHOUT_DE).map(
                              ([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Jahre
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={residence.years}
                            onChange={(e) =>
                              handleResidenceChange(index, 'years', e.target.value)
                            }
                            placeholder="z.B. 10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeResidence(index)}
                          disabled={(formData.residences?.length || 0) <= 1}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-600 disabled:text-gray-400 font-medium rounded-lg transition-colors text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addResidence}
                    className="mt-4 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 font-medium rounded-lg transition-colors text-sm"
                  >
                    + Weiterer Ort
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Selbsteinschätzung */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-6">
                    Bewerten Sie Ihre Fähigkeit, die folgenden Dialekte zu identifizieren, auf einer Skala von "sehr schlecht" bis "sehr gut". Diese Selbsteinschätzung hilft uns, Ihre nachfolgendenKalibrierungsergebnisse besser zu interpretieren.
                  </p>

                  <div className="space-y-5">
                    {Object.entries(DIALECT_LABELS_WITHOUT_DE).map(([key, label]) => {
                      const qualityLabels: Record<string, string> = {
                        '1': 'Sehr schlecht',
                        '2': 'Schlecht',
                        '3': 'Weder noch',
                        '4': 'Gut',
                        '5': 'Sehr gut',
                      };
                      const currentValue = formData.dialectQualities?.[key] || '3';
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-900">
                              {label}
                            </label>
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {qualityLabels[currentValue]}
                            </span>
                          </div>
                          <div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={currentValue}
                              onChange={(e) =>
                                handleDialectQualityChange(key, e.target.value)
                              }
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
                            <span>Sehr schlecht</span>
                            <span>Sehr gut</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-between pt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isPending}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
              >
                ← Zurück
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isPending}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
                >
                  Weiter →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {isPending ? 'Wird gespeichert...' : 'Abschließen'}
                </button>
              )}
            </div>
          </form>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <p className="text-blue-800 text-sm">
              Die mit <span className="text-red-600">*</span> gekennzeichneten Felder sind erforderlich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
