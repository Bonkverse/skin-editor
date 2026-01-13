import { useState } from "react";

export function useCamera() {

    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

    function resetCamera() {
        setCamera({ x: 0, y: 0, zoom: 1 });
    }
    
    return { camera, setCamera, resetCamera };
}