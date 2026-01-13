import { useState } from "react";

export function useEditorUI() {
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showShapes, setShowShapes] = useState(false);
    const [showLayers, setShowLayers] = useState(false);
    const [showToolbar, setShowToolbar] = useState(true);

    return {
        showShortcuts,
        setShowShortcuts,
        showWelcome,
        setShowWelcome,
        showShapes,
        setShowShapes,
        showLayers,
        setShowLayers,
        showToolbar,
        setShowToolbar,
    };
}
