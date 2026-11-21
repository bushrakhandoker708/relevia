import { useEffect, useRef } from 'react';
import { recordTechniqueStart, recordTechniqueDone } from '../../services/activity';

/**
 * Records that an exercise was started or finished, each time the flag turns on (false
 * to true), never on every render. Counts only; nothing the person typed is passed in.
 */
export default function useTechniqueEvents(key, started, completed) {
  const was = useRef({ started: false, completed: false });
  useEffect(() => {
    if (started && !was.current.started) recordTechniqueStart(key);
    if (completed && !was.current.completed) recordTechniqueDone(key);
    was.current = { started: Boolean(started), completed: Boolean(completed) };
  }, [key, started, completed]);
}
