'use client';

import { Assistant, assistants } from '../config/assistants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';

interface AssistantSelectorProps {
  onAssistantChange: (assistant: Assistant) => void;
  currentAssistant?: Assistant;
}

export function AssistantSelector({ onAssistantChange, currentAssistant }: AssistantSelectorProps) {
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>(
    currentAssistant || assistants[0]
  );

  const handleAssistantChange = (assistantName: string) => {
    const assistant = assistants.find(a => a.name === assistantName);
    if (assistant) {
      setSelectedAssistant(assistant);
      onAssistantChange(assistant);
    }
  };

  return (
    <div className="w-full p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Assistant
      </label>
      <Select
        value={selectedAssistant.name}
        onValueChange={handleAssistantChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an assistant" />
        </SelectTrigger>
        <SelectContent>
          {assistants.map((assistant) => (
            <SelectItem key={assistant.id} value={assistant.name}>
              {assistant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-sm text-gray-500">
        {selectedAssistant.description}
      </p>
    </div>
  );
} 