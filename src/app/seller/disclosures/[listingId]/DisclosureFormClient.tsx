"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiFormAssistant } from "@/components/disclosures/AiFormAssistant";
import type { FieldSchema } from "@/components/disclosures/DisclosureForm";
import { DisclosureForm } from "@/components/disclosures/DisclosureForm";

interface DisclosureFormClientProps {
  listingId: string;
  state: string;
  formName: string;
  formId: string | null;
  fields: FieldSchema[];
  initialAnswers: Record<string, unknown>;
  isOptional: boolean;
  isComplete: boolean;
}

export function DisclosureFormClient({
  listingId,
  state,
  formName,
  formId: initialFormId,
  fields,
  initialAnswers,
  isOptional,
  isComplete,
}: DisclosureFormClientProps) {
  const router = useRouter();
  const [formId, setFormId] = useState<string | null>(initialFormId);
  const [currentField, setCurrentField] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Create the form if it doesn't exist yet
  async function ensureForm(): Promise<string> {
    if (formId) return formId;

    const res = await fetch("/api/disclosures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, state }),
    });

    if (!res.ok) throw new Error("Failed to create disclosure form");
    const data = (await res.json()) as { id: string };
    setFormId(data.id);
    return data.id;
  }

  async function handleSave(answers: Record<string, unknown>) {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const id = await ensureForm();
      const res = await fetch(`/api/disclosures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveMessage("Draft saved.");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Error saving draft.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleComplete() {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const id = await ensureForm();
      const res = await fetch(`/api/disclosures/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) throw new Error("Complete failed");
      setSaveMessage("Disclosure completed.");
      router.refresh();
    } catch {
      setSaveMessage("Error completing disclosure.");
    } finally {
      setIsSaving(false);
    }
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        No disclosure form schema available for {state}.
        {isOptional && " Disclosure is optional for this state."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Main form — takes 2/3 width on large screens */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">{formName}</h2>
            {isSaving && <span className="text-xs text-gray-500">Saving...</span>}
            {saveMessage && !isSaving && (
              <span className="text-xs text-gray-600">{saveMessage}</span>
            )}
          </div>

          {isComplete ? (
            <div className="py-6 text-center text-sm text-gray-500">
              This disclosure form has been completed and submitted.
            </div>
          ) : (
            <DisclosureForm
              formId={formId ?? "new"}
              state={state}
              fields={fields}
              initialAnswers={initialAnswers}
              onSave={handleSave}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>

      {/* AI assistant sidebar */}
      <div className="lg:col-span-1 min-h-[500px]">
        <AiFormAssistant state={state} formName={formName} currentField={currentField} />
      </div>
    </div>
  );
}
