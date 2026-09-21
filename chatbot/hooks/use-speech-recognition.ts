"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: ((this: SpeechRecognitionLike, event: Event) => void) | null;
  onerror: ((this: SpeechRecognitionLike, event: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognitionLike, event: SpeechResultEvent) => void)
    | null;
  start: () => void;
  stop: () => void;
};

type SpeechResultEvent = Event & {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognitionCtor() !== null;
}

export function useSpeechRecognition({
  onTranscript,
}: {
  onTranscript: (transcript: string, isFinal: boolean) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition = getSpeechRecognitionCtor();

    if (!Recognition) {
      return false;
    }

    recognitionRef.current?.abort();

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "zh-CN";
    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (!result) {
          continue;
        }
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        onTranscriptRef.current(finalText, true);
      } else if (interim) {
        onTranscriptRef.current(interim, false);
      }
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    return true;
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    []
  );

  return { listening, start, stop, supported };
}
