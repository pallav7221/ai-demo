import { useState, useCallback } from 'react';
import { Message } from '../types';
import { AIService } from '../services/aiService';
import { nanoid } from '../utils/nanoid';

export const useChat = (selectedModel: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }
    setError(null);

    const userMessage: Message = {
      id: nanoid(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use functional update to access the latest messages
      const response = await AIService.generateResponse(
        // Get the latest messages by using a callback
        await new Promise<Message[]>(resolve => {
          setMessages(prev => {
            resolve([...prev, userMessage]);
            return [...prev, userMessage];
          });
        }),
        selectedModel
      );

      const assistantMessage: Message = {
        id: nanoid(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: nanoid(),
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]); // Remove 'messages' from dependency array

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    error,
  };
};