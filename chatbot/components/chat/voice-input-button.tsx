"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function VoiceInputButton({
  disabled,
  input,
  setInput,
}: {
  disabled?: boolean;
  input: string;
  setInput: (value: string) => void;
}) {
  const committedRef = useRef(input);
  committedRef.current = input;
  const prefixRef = useRef(input);

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      const next = `${prefixRef.current}${
        prefixRef.current && !prefixRef.current.endsWith(" ") ? " " : ""
      }${transcript.trim()}`;
      setInput(next);

      if (isFinal) {
        prefixRef.current = next;
      }
    },
    [setInput]
  );

  const { listening, start, stop, supported } = useSpeechRecognition({
    onTranscript: handleTranscript,
  });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (!supported) {
        toast.error("当前浏览器不支持语音输入");
        return;
      }

      if (listening) {
        stop();
        return;
      }

      prefixRef.current = committedRef.current;
      const started = start();
      if (!started) {
        toast.error("当前浏览器不支持语音输入");
      }
    },
    [listening, start, stop, supported]
  );

  return (
    <Button
      aria-label={listening ? "停止语音输入" : "语音输入"}
      className={cn(
        "h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors",
        listening
          ? "border-destructive/40 text-destructive hover:text-destructive"
          : supported
            ? "text-foreground hover:border-border hover:text-foreground"
            : "cursor-not-allowed text-muted-foreground/30"
      )}
      data-testid="voice-input-button"
      disabled={disabled}
      onClick={handleClick}
      type="button"
      variant="ghost"
    >
      {listening ? (
        <SquareIcon className="size-3.5" />
      ) : (
        <MicIcon className="size-3.5" />
      )}
    </Button>
  );
}
