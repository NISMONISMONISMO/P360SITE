import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface DebugPanoramaViewerProps {
  panoramaId: number;
}

const DebugPanoramaViewer: React.FC<DebugPanoramaViewerProps> = ({ panoramaId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Camera state for rotation and zoom
  const cameraStateRef = useRef({
    phi: 0,        // Horizontal rotation
    theta: Math.PI / 2,  // Vertical rotation
    targetPhi: 0,
    targetTheta: Math.PI / 2,
    fov: 75,
    targetFov: 75,
  });
  
  // Mouse interaction state
  const mouseStateRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    previousX: 0,
    previousY: 0,
    velocityX: 0,
    velocityY: 0,
  });

  // Set up mouse and touch event listeners
  const setupEventListeners = () => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    // Wheel event for zoom
    container.addEventListener('wheel', handleWheel);

    // Touch events
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
  };

  // Clean up event listeners
  const cleanupEventListeners = () => {
    const container = containerRef.current;
    if (!container) return;

    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseup', handleMouseUp);
    container.removeEventListener('mouseleave', handleMouseUp);

    container.removeEventListener('wheel', handleWheel);

    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
  };

  // Mouse event handlers
  const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      mouseStateRef.current.isDown = true;
      mouseStateRef.current.startX = event.clientX;
      mouseStateRef.current.startY = event.clientY;
      mouseStateRef.current.previousX = event.clientX;
      mouseStateRef.current.previousY = event.clientY;
      // Reset velocity on mouse down for immediate response
      mouseStateRef.current.velocityX = 0;
      mouseStateRef.current.velocityY = 0;
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (mouseStateRef.current.isDown) {
      const deltaX = event.clientX - mouseStateRef.current.previousX;
      const deltaY = event.clientY - mouseStateRef.current.previousY;

      // Apply rotation with improved sensitivity
      cameraStateRef.current.targetPhi -= deltaX * 0.003;
      // Invert vertical movement to match Google Street View (drag down = look up, drag up = look down)
      cameraStateRef.current.targetTheta -= deltaY * 0.003; // Inverted vertical movement

      // Calculate velocity for inertia
      mouseStateRef.current.velocityX = deltaX;
      mouseStateRef.current.velocityY = deltaY;

      // Clamp vertical rotation to prevent flipping
      cameraStateRef.current.targetTheta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraStateRef.current.targetTheta));

      mouseStateRef.current.previousX = event.clientX;
      mouseStateRef.current.previousY = event.clientY;
    }
  };

  const handleMouseUp = () => {
    mouseStateRef.current.isDown = false;
    // Apply inertia on mouse release for smooth movement
  };

  // Wheel event handler for zoom
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault(); // Prevent page scrolling

    // Zoom with improved sensitivity
    const delta = event.deltaY > 0 ? 5 : -5;
    cameraStateRef.current.targetFov = Math.max(20, Math.min(100, cameraStateRef.current.targetFov + delta));
  };

  // Touch event handlers
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      mouseStateRef.current.isDown = true;
      mouseStateRef.current.startX = event.touches[0].clientX;
      mouseStateRef.current.startY = event.touches[0].clientY;
      mouseStateRef.current.previousX = event.touches[0].clientX;
      mouseStateRef.current.previousY = event.touches[0].clientY;
      mouseStateRef.current.velocityX = 0; // Reset velocity on touch start
      mouseStateRef.current.velocityY = 0; // Reset velocity on touch start
    }
    event.preventDefault(); // Prevent scrolling
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (mouseStateRef.current.isDown && event.touches.length === 1) {
      const deltaX = event.touches[0].clientX - mouseStateRef.current.previousX;
      const deltaY = event.touches[0].clientY - mouseStateRef.current.previousY;

      // Apply rotation with improved sensitivity
      cameraStateRef.current.targetPhi -= deltaX * 0.003;
      // Invert vertical movement to match Google Street View (drag down = look up, drag up = look down)
      cameraStateRef.current.targetTheta -= deltaY * 0.003; // Inverted vertical movement

      // Calculate velocity for inertia
      mouseStateRef.current.velocityX = deltaX;
      mouseStateRef.current.velocityY = deltaY;

      // Clamp vertical rotation to prevent flipping
      cameraStateRef.current.targetTheta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraStateRef.current.targetTheta));

      mouseStateRef.current.previousX = event.touches[0].clientX;
      mouseStateRef.current.previousY = event.touches[0].clientY;
    }
    event.preventDefault();
  };

  const handleTouchEnd = () => {
    mouseStateRef.current.isDown = false;
    // Apply inertia on touch release for smooth movement
  };

  // Handle window resize
  const handleResize = () => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  // Initialize Three.js scene
  const initScene = () => {
    if (!containerRef.current) return;
    
    try {
      // Clean up existing renderer if it exists
      if (rendererRef.current) {
        try {
          rendererRef.current.dispose();
          if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
            rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
          }
        } catch (e) {
          console.warn('Error cleaning up renderer:', e);
        }
      }
      
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 0);
      cameraRef.current = camera;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 1);
      rendererRef.current = renderer;
      
      // Add renderer to container
      container.appendChild(renderer.domElement);
      
      // Create sphere geometry
      const geometry = new THREE.SphereGeometry(500, 64, 32);
      geometry.scale(-1, 1, 1); // Invert for inside viewing
      
      // Create material
      const material = new THREE.MeshBasicMaterial({
        color: 0x333333, // Gray fallback color
        side: THREE.BackSide,
      });
      
      // Create sphere mesh
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      sphereRef.current = sphere;
      
      // Load panorama texture
      loadPanoramaTexture(panoramaId);
      
      // Set up event listeners
      setupEventListeners();
      
      // Start animation loop
      animate();
      
    } catch (err) {
      console.error('Error initializing scene:', err);
      setError('Error initializing 3D engine: ' + (err as Error).message);
      setIsLoading(false);
    }
  };
  
  // Load panorama texture
  const loadPanoramaTexture = (panoramaId: number) => {
    try {
      const textureLoader = new THREE.TextureLoader();
      // Using relative URL to leverage Vite proxy
      const imageUrl = `/api/panoramas/${panoramaId}/image`;
      
      textureLoader.load(
        imageUrl,
        (texture) => {
          // Success callback
          try {
            // Apply texture to material
            if (sphereRef.current) {
              const material = sphereRef.current.material as THREE.MeshBasicMaterial;
              material.map = texture;
              material.needsUpdate = true;
              material.color.set(0xffffff); // White color for texture
            }
            
            setIsLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error applying texture:', err);
            texture.dispose();
            setError('Error applying texture: ' + (err as Error).message);
            setIsLoading(false);
          }
        },
        undefined, // Progress callback
        (err) => {
          // Error callback
          console.error('Texture loader error:', err);
          setError('Failed to load panorama: ' + (err as Error).message);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Error in loadPanoramaTexture:', err);
      setError('Error loading texture: ' + (err as Error).message);
      setIsLoading(false);
    }
  };
  
  // Animation loop with Google Street View-like controls
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    const cameraState = cameraStateRef.current;
    const mouseState = mouseStateRef.current;

    // Apply inertia if mouse/touch is not down
    if (!mouseState.isDown) {
      // Apply velocity with damping for smooth deceleration
      cameraState.targetPhi -= mouseState.velocityX * 0.003;
      cameraState.targetTheta -= mouseState.velocityY * 0.003; // Inverted vertical movement

      // Apply deceleration with more natural feel
      mouseState.velocityX *= 0.85; // Reduced deceleration for smoother feel
      mouseState.velocityY *= 0.85; // Reduced deceleration for smoother feel

      // Stop inertia if velocity is very low
      if (Math.abs(mouseState.velocityX) < 0.1 && Math.abs(mouseState.velocityY) < 0.1) {
        mouseState.velocityX = 0;
        mouseState.velocityY = 0;
      }
    }

    // Improved camera movement with better damping for smoother experience
    const dampingFactor = 0.08; // Reduced damping for smoother movement
    
    // Handle horizontal rotation with continuous 360° movement
    let deltaPhi = cameraState.targetPhi - cameraState.phi;
    
    // Normalize delta for shortest path rotation
    if (deltaPhi > Math.PI) {
      deltaPhi -= 2 * Math.PI;
    } else if (deltaPhi < -Math.PI) {
      deltaPhi += 2 * Math.PI;
    }
    
    // Limit maximum rotation speed to prevent infinite spinning
    const maxDeltaPhi = 0.3; // Reduced max speed for smoother control
    deltaPhi = Math.max(-maxDeltaPhi, Math.min(maxDeltaPhi, deltaPhi));
    
    cameraState.phi += deltaPhi * dampingFactor;
    cameraState.theta += (cameraState.targetTheta - cameraState.theta) * dampingFactor;
    cameraState.fov += (cameraState.targetFov - cameraState.fov) * dampingFactor;
    
    // Normalize phi to keep it in [-PI, PI] range for continuous rotation
    if (cameraState.phi > Math.PI) {
      cameraState.phi -= 2 * Math.PI;
    } else if (cameraState.phi < -Math.PI) {
      cameraState.phi += 2 * Math.PI;
    }
    
    // Also normalize targetPhi
    if (cameraState.targetPhi > Math.PI) {
      cameraState.targetPhi -= 2 * Math.PI;
    } else if (cameraState.targetPhi < -Math.PI) {
      cameraState.targetPhi += 2 * Math.PI;
    }

    // Apply rotations and FOV
    // Convert spherical coordinates to Cartesian for camera lookAt
    const x = Math.sin(cameraState.theta) * Math.cos(cameraState.phi);
    const y = Math.cos(cameraState.theta);
    const z = Math.sin(cameraState.theta) * Math.sin(cameraState.phi);
    
    // Point camera in the correct direction
    cameraRef.current.lookAt(x, y, z);
    cameraRef.current.fov = cameraState.fov;
    cameraRef.current.updateProjectionMatrix();
    
    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    } catch (err) {
      console.error('Error rendering scene:', err);
    }
  };
  
  // Initialize scene on mount
  useEffect(() => {
    initScene();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up on unmount
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      cleanupEventListeners();
      
      // Dispose of Three.js objects
      try {
        if (rendererRef.current) {
          rendererRef.current.dispose();
          if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
            rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
          }
        }
        
        if (sphereRef.current) {
          sphereRef.current.geometry.dispose();
          const material = sphereRef.current.material as THREE.MeshBasicMaterial;
          if (material.map) {
            material.map.dispose();
          }
          material.dispose();
        }
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
    };
  }, [panoramaId]);
  
  if (error) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
        <div className="text-center text-white max-w-md mx-4">
          <p className="text-red-400 mb-4 text-lg">❌ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full bg-black"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-center text-white">
            <div className="w-8 h-8 mx-auto mb-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin" />
            <p className="text-lg">Loading panorama...</p>
            <p className="text-sm text-gray-400 mt-2">ID: {panoramaId}</p>
          </div>
        </div>
      )}
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg px-4 py-3 text-white z-10">
        <h3 className="font-semibold text-sm mb-1">Debug Panorama Viewer</h3>
        <p className="text-xs text-gray-400">
          Panorama ID: {panoramaId}
        </p>
      </div>
    </div>
  );
};

export default DebugPanoramaViewer;