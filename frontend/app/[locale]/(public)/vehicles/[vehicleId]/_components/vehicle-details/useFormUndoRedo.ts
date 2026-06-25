import { useEffect, useRef, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";

export function useFormUndoRedo<TFieldValues extends Record<string, unknown>>(
  methods: UseFormReturn<TFieldValues>,
  defaultValues: TFieldValues
) {
  const [history, setHistory] = useState<TFieldValues[]>([defaultValues]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isNavigatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { watch, reset, getValues } = methods;

  const updateHistory = useCallback(
    (currentValues: TFieldValues) => {
      setHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        const lastState = newHistory[newHistory.length - 1];
        if (JSON.stringify(lastState) !== JSON.stringify(currentValues)) {
          newHistory.push(currentValues);
          setCurrentIndex(newHistory.length - 1);
          return newHistory;
        }
        return prev;
      });
    },
    [currentIndex]
  );

  useEffect(() => {
    const subscription = watch(() => {
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const currentValues = structuredClone(getValues());
        updateHistory(currentValues);
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watch, getValues, updateHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      isNavigatingRef.current = true;
      setCurrentIndex(prevIndex);
      reset(history[prevIndex]);
    }
  }, [currentIndex, history, reset]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      isNavigatingRef.current = true;
      setCurrentIndex(nextIndex);
      reset(history[nextIndex]);
    }
  }, [currentIndex, history, reset]);

  return {
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}
