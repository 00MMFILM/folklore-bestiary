"use client";

import { useState } from "react";
import styles from "./sample.module.css";

export default function ThreatTrack({ steps }: { steps: { name: string; body: string }[] }) {
  const [stage, setStage] = useState(0);
  const [oversized, setOversized] = useState(false);

  return (
    <div className={styles.tracker}>
      <p className={styles.eyebrow}>At the table</p>
      <h2>Keep two separate records.</h2>
      <p className={styles.small}>Threats can be prevented. Advancing this track never marks growth automatically.</p>
      <fieldset className={styles.trackChoices}>
        <legend>Current threat</legend>
        {["Not started / paused", ...steps.map((step) => step.name)].map((name, index) => (
          <label key={name} className={styles.trackChoice}>
            <input type="radio" name="threat-stage" value={index} checked={stage === index} onChange={() => setStage(index)} />
            <span>{name}</span>
          </label>
        ))}
      </fieldset>
      {stage > 0 && <p className={styles.currentThreat}>{steps[stage - 1].body}</p>}
      <label className={styles.growthChoice}>
        <input type="checkbox" checked={oversized} onChange={(event) => setOversized(event.target.checked)} aria-describedby="growth-help" />
        <span><strong>OVERSIZED</strong><br />Ate a large iron object</span>
      </label>
      <p id="growth-help" className={styles.small}>Mark only after an actual large iron meal. A test nail does not count. Once marked, the original kiln is too small.</p>
      <p className={styles.trackerStatus} aria-live="polite" aria-atomic="true">Threat: {stage === 0 ? "not started / paused" : steps[stage - 1].name}. Growth: {oversized ? "OVERSIZED; the original kiln cannot hold it." : "initial size; the kiln remains available."}</p>
      <button className={styles.resetButton} type="button" onClick={() => { setStage(0); setOversized(false); }}>Reset both records</button>
      <p className={styles.small}>Session notes stay on this page only. Reloading resets them.</p>
    </div>
  );
}
