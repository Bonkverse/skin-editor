import { useState, useEffect } from "react";
import { requireBonkverseAuth } from "./auth/requireAuth";
import SkinEditorInner from "./components/SkinEditorInner";

export default function SkinEditor() {
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const me = await requireBonkverseAuth();
      if (!me) return; // redirect already happened
      setAuthChecked(true);
    })();
  }, []);

  if (!authChecked) {
    return (
      <div className="editor-loading">
        Checking authentication…
      </div>
    );
  }

  return <SkinEditorInner />;
}
