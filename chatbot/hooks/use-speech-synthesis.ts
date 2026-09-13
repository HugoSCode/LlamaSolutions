"use client";

import { useCallback, useEffect, useState } from "react";

type SpeechState = {
  messageId: string | null;
  speaking: boolean;
};

let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeMessageId: string | null = null;
const listeners = new Set<(state: SpeechState) => void>();

function emit() {
  const state = {
    messageId: activeMessageId,
    speaking: activeMessageId !== null,
  };

  for (const listener of listeners) {
    listener(state);
  }
}

function stopSpeaking() {
  activeUtterance = null;
  activeMessageId = null;

  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }

  emit();
}

function speakText(messageId: string, text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = navigator.language || "zh-CN";
  utterance.onend = () => {
    if (activeUtterance === utterance) {
      stopSpeaking();
    }
  };
  utterance.onerror = () => {
    if (activeUtterance === utterance) {
      stopSpeaking();
    }
  };

  activeUtterance = utterance;
  activeMessageId = messageId;
  emit();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function useSpeechSynthesis(messageId: string) {
  const [state, setState] = useState<SpeechState>({
    messageId: activeMessageId,
    speaking: activeMessageId !== null,
  });

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const speak = useCallback(
    (text: string) => speakText(messageId, text),
    [messageId]
  );

  const stop = useCallback(() => {
    stopSpeaking();
  }, []);

  return {
    isSpeakingThis: state.speaking && state.messageId === messageId,
    speak,
    stop,
    supported: isSpeechSynthesisSupported(),
  };
}
