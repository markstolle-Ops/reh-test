"use client";

import { useForm } from "react-hook-form";

export interface FieldSchema {
  id: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "select";
  section: string;
  required: boolean;
  helpText?: string;
  options?: string[];
}

interface DisclosureFormProps {
  formId: string;
  state: string;
  fields: FieldSchema[];
  initialAnswers: Record<string, unknown>;
  onSave: (answers: Record<string, unknown>) => void;
  onComplete: () => void;
}

export function DisclosureForm({
  formId,
  state,
  fields,
  initialAnswers,
  onSave,
  onComplete,
}: DisclosureFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    defaultValues: initialAnswers,
  });

  const watchOptOut = watch("opt_out_with_credit") as boolean | undefined;

  // Group fields by section
  const sections = fields.reduce<Record<string, FieldSchema[]>>((acc, field) => {
    if (!acc[field.section]) acc[field.section] = [];
    acc[field.section].push(field);
    return acc;
  }, {});

  const handleSaveDraft = handleSubmit((data) => {
    onSave(data);
  });

  const handleComplete = handleSubmit((data) => {
    onSave(data);
    onComplete();
  });

  return (
    <div className="space-y-8">
      {/* GA: Optional disclosure banner */}
      {state === "GA" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <strong>Disclosure is optional in Georgia.</strong> You may skip this form if you choose.
        </div>
      )}

      {/* NY: $500 credit opt-out */}
      {state === "NY" && watchOptOut && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          You have opted to provide a $500 credit instead of completing this form.
        </div>
      )}

      <form id={`disclosure-form-${formId}`} className="space-y-8">
        {Object.entries(sections).map(([section, sectionFields]) => (
          <div key={section} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{section}</h3>
            <div className="space-y-4">
              {sectionFields.map((field) => {
                // Disable all fields except opt_out when NY opt-out is selected
                const isDisabled =
                  state === "NY" && watchOptOut === true && field.id !== "opt_out_with_credit";

                return (
                  <div key={field.id} className="space-y-1">
                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>

                    {field.type === "text" && (
                      <input
                        id={field.id}
                        type="text"
                        disabled={isDisabled}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        {...register(field.id, {
                          required:
                            field.required && !isDisabled ? `${field.label} is required` : false,
                        })}
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        id={field.id}
                        rows={3}
                        disabled={isDisabled}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        {...register(field.id, {
                          required:
                            field.required && !isDisabled ? `${field.label} is required` : false,
                        })}
                      />
                    )}

                    {field.type === "boolean" && (
                      <div className="flex items-center gap-2">
                        <input
                          id={field.id}
                          type="checkbox"
                          disabled={isDisabled}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          {...register(field.id)}
                        />
                        <span className="text-sm text-gray-600">Yes</span>
                      </div>
                    )}

                    {field.type === "select" && (
                      <select
                        id={field.id}
                        disabled={isDisabled}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        {...register(field.id, {
                          required:
                            field.required && !isDisabled ? `${field.label} is required` : false,
                        })}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}

                    {errors[field.id] && (
                      <p className="text-xs text-red-500">
                        {String(errors[field.id]?.message ?? "This field is required")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </form>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Complete &amp; Submit
        </button>
      </div>
    </div>
  );
}
