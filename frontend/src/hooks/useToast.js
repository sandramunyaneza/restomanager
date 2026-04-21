import { useCallback, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState(null);

  const show = useCallback((text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3200);
  }, []);

  return { message, show };
}
