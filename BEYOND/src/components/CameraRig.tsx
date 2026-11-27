import { Vector3, type Group } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react'

interface CameraRigProps {
  focusObject: Group | null
}

const OVERVIEW_POSITION = new Vector3(0, 20, 50); // std pos
const OVERVIEW_TARGET = new Vector3(0, 0, 0);     // center
const FOCUS_OFFSET = new Vector3(0, 3, 10); // so we dont go inside the planet

export function CameraRig({ focusObject }: CameraRigProps) {
    const {camera} = useThree(); // take camera from useThree

    const focusPoint = useRef(new Vector3())

    const targetPosition = useRef(new Vector3());
    const currentLookAt = useRef(new Vector3());

    useFrame((_state, delta) => {
        const focusAlpha = 1 - Math.exp(-4 * delta);
        const overviewAlpha = 1 - Math.exp(-2 * delta);

        if (focusObject !== null) {
            
            focusObject.getWorldPosition(focusPoint.current)

      targetPosition.current.copy(focusPoint.current).add(FOCUS_OFFSET);

      camera.position.lerp(targetPosition.current, focusAlpha);

      currentLookAt.current.lerp(focusPoint.current, focusAlpha);

      
    } else {
      
      camera.position.lerp(OVERVIEW_POSITION, overviewAlpha);
      currentLookAt.current.lerp(OVERVIEW_TARGET, overviewAlpha);
    }

    camera.lookAt(currentLookAt.current);
    });

    return null;
}