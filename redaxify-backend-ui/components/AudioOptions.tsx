"use client";
import Image from "next/image";
import Link from "next/link";

interface AudioOptionsProps {
  checkedOptions: string[];
  onCheckboxChange: (option: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isProcessing: boolean;
  progress?: number;
  completedAudioId?: string | null;
}

const AudioOptions = ({
  checkedOptions,
  onCheckboxChange,
  onSubmit,
  isProcessing,
  progress = 0,
  completedAudioId,
}: AudioOptionsProps) => {
  return (
    <div className="mt-8 px-6 mb-8">
      <h1 className="text-white text-xl font-semibold mb-2">
        Select the type of analysis for your audio:
      </h1>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>{progress < 100 ? "Processing..." : "Finalizing..."}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Button */}
      {completedAudioId && (
        <div className="mb-4 flex justify-end">
          <Link
            href={`/audio/${completedAudioId}`}
            className="px-6 py-1.5 text-lg text-white bg-blue-600 border-blue-600 rounded-md transition-colors hover:bg-blue-700"
          >
            Show Results
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-white">
          {[
            { id: "option1", label: "Redaction" },
            { id: "option2", label: "Indexing" },
            { id: "option3", label: "Summary Report" },
          ].map((option) => (
            <div key={option.id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                id={option.id}
                name="options"
                value={option.label}
                checked={checkedOptions.includes(option.label)}
                onChange={() => onCheckboxChange(option.label)}
                className="hidden"
                disabled={isProcessing}
              />
              <label
                htmlFor={option.id}
                className={`checkmark w-5 h-5 border-2 rounded-sm flex items-center justify-center cursor-pointer transition-all
                  ${
                    checkedOptions.includes(option.label)
                      ? "bg-blue-600 border-blue-600"
                      : "border-[#515152] bg-[#0A0D1F]"
                  }
                  ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {checkedOptions.includes(option.label) && (
                  <Image
                    src="/icons/checked.svg"
                    alt="Checked"
                    width={16}
                    height={16}
                  />
                )}
              </label>
              <label
                htmlFor={option.id}
                className={`select-none ${isProcessing ? "opacity-50" : ""}`}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessing || !!completedAudioId}
          className={`px-6 py-1.5 text-lg text-white rounded-md flex items-center gap-2 transition-colors
            ${
              isProcessing
                ? "bg-blue-800 cursor-not-allowed"
                : completedAudioId
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {isProcessing ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : completedAudioId ? (
            "Processed"
          ) : (
            "Process"
          )}
        </button>
      </div>
    </div>
  );
};

export default AudioOptions;