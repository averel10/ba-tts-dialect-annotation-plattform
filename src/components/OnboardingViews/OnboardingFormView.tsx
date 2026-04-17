'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveOnboardingAnswers } from '@/app/actions/onboarding';
import { DIALECT_LABELS_WITHOUT_DE } from '@/lib/dialects';

interface OnboardingFormViewProps {
  experimentId: number;
  onBack: () => void;
  userEmail: string;
}

interface ResidenceEntry {
  canton: string;
  years: string;
}

interface FormData {
  age?: string;
  participateInRaffle?: boolean;
  residences?: ResidenceEntry[];
  ownDialectRegion?: string;
  dialectQualities?: Record<string, string>;
  listeningExperience?: string;
  additionalNotes?: string;
}

type Step = 1 | 2 | 3 | 4;

const AVAILABLE_CANTONS = {
  ag: 'Aargau',
  ar: 'Appenzell Ausserrhoden',
  ai: 'Appenzell Innerrhoden',
  bl: 'Basel-Landschaft',
  bs: 'Basel-Stadt',
  be: 'Bern',
  gl: 'Glarus',
  gr: 'Graubünden',
  lu: 'Luzern',
  nw: 'Nidwalden',
  ow: 'Obwalden',
  sh: 'Schaffhausen',
  sz: 'Schwyz',
  so: 'Solothurn',
  sg: 'St. Gallen',
  tg: 'Thurgau',
  ur: 'Uri',
  vs: 'Wallis',
  zg: 'Zug',
  zh: 'Zürich',
  other: 'Anderer Kanton/Ausland'
};

export default function OnboardingFormView({ experimentId, onBack, userEmail }: OnboardingFormViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  const initializeDialectQualities = (): Record<string, string> => {
    return {};
  };
  
  const [formData, setFormData] = useState<FormData>({
    age: '',
    participateInRaffle: false,
    residences: [{ canton: '', years: '' }],
    ownDialectRegion: '',
    dialectQualities: initializeDialectQualities()
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentStep]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
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
      residences: [...(prev.residences || []), { canton: '', years: '' }],
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
          setError('Bitte wählen deine Altersgruppe aus.');
          return false;
        }
        break;
      case 2:
        const allResidencesValid = formData.residences?.every((r) => {
          const years = parseInt(r.years);
          return r.canton && r.years && years >= 1 && years <= 100;
        });
        if (!allResidencesValid) {
          setError('Bitte füllen alle deine Aufenthaltsorte vollständig aus und stelle sicher, dass die Jahres-Angaben zwischen 1 und 100 liegen.');
          return false;
        }
        break;
      case 3:
        if (!formData.ownDialectRegion) {
          setError('Bitte wählen deine Region deines eigenen Dialekts aus.');
          return false;
        }
        break;
      case 4:
        const allDialects = Object.keys(DIALECT_LABELS_WITHOUT_DE);
        const hasAllDialectQualities = allDialects.every(
          (region) => !!formData.dialectQualities?.[region]
        );
        if (!hasAllDialectQualities) {
          setError('Bitte bewerte deine Fähigkeit für alle Dialekte.');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as Step);
      }
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = () => {
    if(!validateStep(4)) {
      return;
    }
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
    2: 'Aufenthaltsorte in der Deutschschweiz',
    3: 'Dialektzuordnung',
    4: 'Selbsteinschätzung',
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-600">
                Schritt {currentStep} von 4
              </h2>
              <div className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}%</div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
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
              <div className="space-y-6">
                <div>
                  <label htmlFor="age" className="block text-s font-medium text-gray-900 mb-2">
                    Meine Altersgruppe <span className="text-red-600">*</span>
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
                    <option value="66+">Über 65 Jahre</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="participateInRaffle"
                      checked={formData.participateInRaffle ?? false}
                      onChange={(e) => handleChange('participateInRaffle', e.target.checked ? true : false)}
                      className="mt-1 w-5 h-5 cursor-pointer accent-blue-600"
                    />
                    <div className="flex-1">
                      <label htmlFor="participateInRaffle" className="block text-s font-medium text-gray-900 mb-2 cursor-pointer">
                        Ich möchte an der Gutscheinverlosung teilnehmen
                      </label>
                      <p className="text-sm text-gray-600 mb-2">
                        Wir werden deine E-Mail-Adresse<strong>{userEmail && ` (${userEmail})`}</strong> verwenden, um dich im Falle eines Gewinns zu kontaktieren.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Aufenthaltsorte */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-s text-gray-600 mb-8">
                  Bitte gib an, in welchen deutschschweizer Kantonen du länger als 1 Jahr gelebt hast und wie viele Jahre insgesamt.
                  <br />
                  Wenn du mehrmals im gleichen Kanton gewohnt hast, zähle die Zeit zusammen und mache nur einen Eintrag pro Kanton.
                  <br />
                  Falls ein Kanton nicht in der Liste ist oder du im Ausland gelebt hast, wähle „Anderer Kanton/Ausland“ 
                </p>

                {/* Residence Entries */}
                <div>
                  <label className="block text-s font-medium text-gray-900 mb-4">
                    Meine Aufenthaltsorte (mind. 1 Jahr) <span className="text-red-600">*</span>
                  </label>

                  <div className="space-y-4">
                    {formData.residences?.map((residence, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Kanton
                          </label>
                          <select
                            value={residence.canton}
                            onChange={(e) =>
                              handleResidenceChange(index, 'canton', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">-- Wählen --</option>
                            {Object.entries(AVAILABLE_CANTONS).map(
                              ([key, label]) => {
                                // Hide cantons already selected in other residence entries
                                const isSelectedElsewhere = formData.residences?.some(
                                  (r, i) => i !== index && r.canton === key
                                );
                                
                                if (isSelectedElsewhere) {
                                  return null;
                                }
                                
                                return (
                                  <option key={key} value={key}>
                                    {label}
                                  </option>
                                );
                              }
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
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-600 disabled:text-gray-400 font-medium rounded-lg transition-colors text-sm"
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

            {/* Step 3: Dialektzuordnung */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-s text-gray-600 mb-8">
                  Zu welcher Region würdest du deinen eigenen Dialekt am ehesten zuordnen?
                  <br />
                  Orientiere dich an der folgenden Karte der deutschschweizer Dialektregionen.
                  <br />
                  Wenn du keinen deutschschweizer Dialekt sprichst, wähle "Ich spreche keinen deutschschweizer Dialekt" aus.
                </p>

                <div className="flex justify-center mb-8">
                  <img
                    src="/swiss_regions_map.png"
                    alt="Karte der deutschschweizer Dialektregionen"
                    className="w-full max-w-md h-auto"
                  />
                </div>

                <div>
                  <label htmlFor="ownDialect" className="block text-s font-medium text-gray-900 mb-4">
                    Meine Dialektregion <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="ownDialect"
                    value={formData.ownDialectRegion || ''}
                    onChange={(e) => handleChange('ownDialectRegion', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Bitte wählen --</option>
                    {Object.entries(DIALECT_LABELS_WITHOUT_DE).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                    <option value="none">Ich spreche keinen deutschschweizer Dialekt</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Selbsteinschätzung */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-s text-gray-600 mb-8">
                  Bewerte deine Fähigkeit, die folgenden deutschschweizer Dialekte zu erkennen. Diese Selbsteinschätzung hilft uns, deine Kalibrierungsergebnisse besser zu interpretieren.
                </p>

                <ul className="text-s text-gray-600 mb-8 space-y-1">
                  <li><strong>1</strong> = Sehr schlecht</li>
                  <li><strong>2</strong> = Schlecht</li>
                  <li><strong>3</strong> = Gut</li>
                  <li><strong>4</strong> = Sehr gut</li>
                  <li><strong>N</strong> = Nicht vertraut</li>
                </ul>

                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-sm font-medium text-gray-700 text-left pb-2"></th>
                      <th className="w-[120px] text-xs font-medium text-gray-700 text-center pb-2">1</th>
                      <th className="w-[120px] text-xs font-medium text-gray-700 text-center pb-2">2</th>
                      <th className="w-[120px] text-xs font-medium text-gray-700 text-center pb-2">3</th>
                      <th className="w-[120px] text-xs font-medium text-gray-700 text-center pb-2">4</th>
                      <th className="w-[120px] text-xs font-medium text-gray-700 text-center pb-2 border-l border-gray-200">N</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(DIALECT_LABELS_WITHOUT_DE).map(([key, label], index) => {
                      const currentValue = formData.dialectQualities?.[key] ?? '';
                      return (
                        <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="text-sm font-medium text-gray-900 py-3">{label}</td>
                          {['1', '2', '3', '4'].map((value) => (
                            <td key={value} className="w-[120px] text-center py-3">
                              <input
                                type="radio"
                                name={key}
                                value={value}
                                checked={currentValue === value}
                                onChange={() => handleDialectQualityChange(key, value)}
                                className="cursor-pointer accent-blue-600 w-5 h-5"
                              />
                            </td>
                          ))}
                          <td className="w-[120px] text-center py-3 border-l border-gray-200">
                            <input
                              type="radio"
                              name={key}
                              value="-1"
                              checked={currentValue === '-1'}
                              onChange={() => handleDialectQualityChange(key, '-1')}
                              className="cursor-pointer accent-blue-600 w-5 h-5"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-between pt-8 mb-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isPending}
                className="px-6 py-3 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
              >
                ← Zurück
              </button>

              {currentStep < 4 ? (
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
                  {isPending ? 'Wird gespeichert...' : 'Abschliessen'}
                </button>
              )}
            </div>
          </form>


        </div>
      </div>
    </div>
  );
}
