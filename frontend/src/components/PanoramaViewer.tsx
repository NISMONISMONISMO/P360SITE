import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Panorama, Hotspot } from '@/types';
import { cn } from '@/utils';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Share2, 
  Maximize, 
  Minimize,
  Play,
  X as CloseIcon
} from 'lucide-react';

interface PanoramaViewerProps {
  panorama: Panorama;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  // New props for transition creation
  tourPanoramas?: Panorama[];
  onCreateHotspot?: (position: { x: number; y: number; z: number }, targetPanoramaId: number, title: string) => void;
  isCreatingTransition?: boolean;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  panorama,
  hotspots = [],
  onHotspotClick,
  autoRotate = false,
  showControls = true,
  className,
  tourPanoramas = [],
  onCreateHotspot,
  isCreatingTransition = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controls, setControls] = useState({
    zoom: 75,
    isPlaying: autoRotate,
    isFullscreen: false,
  });
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    position: { x: number; y: number; z: number } | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    position: null
  });
  
  // Hotspot creation form state
  const [hotspotForm, setHotspotForm] = useState<{
    visible: boolean;
    targetPanoramaId: number | null;
    title: string;
  }>({
    visible: false,
    targetPanoramaId: null,
    title: ''
  });
  
  // Camera state for rotation and zoom
  const cameraStateRef = useRef({
    phi: 0,
    theta: Math.PI / 2,
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

  // Mouse event handlers
  const handleMouseDown = (event: MouseEvent) => {
    // Hide context menu on any click
    setContextMenu(prev => ({ ...prev, visible: false }));
    setHotspotForm(prev => ({ ...prev, visible: false }));
    
    if (event.button === 0) { // Left mouse button
      mouseStateRef.current.isDown = true;
      mouseStateRef.current.startX = event.clientX;
      mouseStateRef.current.startY = event.clientY;
      mouseStateRef.current.previousX = event.clientX;
      mouseStateRef.current.previousY = event.clientY;
      mouseStateRef.current.velocityX = 0;
      mouseStateRef.current.velocityY = 0;
    } else if (event.button === 2) { // Right mouse button
      event.preventDefault();
      handleRightClick(event);
    }
  };

  // Keep track of currently hovered hotspot
  const hoveredHotspotRef = useRef<THREE.Object3D | null>(null);
  
  const handleMouseMove = (event: MouseEvent) => {
    if (mouseStateRef.current.isDown) {
      const deltaX = event.clientX - mouseStateRef.current.previousX;
      const deltaY = event.clientY - mouseStateRef.current.previousY;

      // Apply rotation with improved sensitivity
      cameraStateRef.current.targetPhi -= deltaX * 0.003;
      // Invert vertical movement to match Google Street View (drag down = look up, drag up = look down)
      cameraStateRef.current.targetTheta -= deltaY * 0.003;

      // Calculate velocity for inertia
      mouseStateRef.current.velocityX = deltaX;
      mouseStateRef.current.velocityY = deltaY;

      // Clamp vertical rotation to prevent flipping
      cameraStateRef.current.targetTheta = Math.max(0.1, Math.min(Math.PI - 0.1, cameraStateRef.current.targetTheta));

      mouseStateRef.current.previousX = event.clientX;
      mouseStateRef.current.previousY = event.clientY;
    } else if (cameraRef.current && hotspotGroupRef.current) {
      // Handle hover effects when not dragging
      const container = containerRef.current;
      if (!container) return;
      
      // Calculate normalized device coordinates
      const rect = container.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Create raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      
      // Check intersection with hotspots
      const intersects = raycaster.intersectObjects(hotspotGroupRef.current.children);
      
      // Handle hover out
      if (hoveredHotspotRef.current && (!intersects.length || intersects[0].object !== hoveredHotspotRef.current)) {
        // Hide label for previously hovered hotspot
        const prevHotspotGroup = hoveredHotspotRef.current as any;
        if (prevHotspotGroup.onPointerOut) {
          prevHotspotGroup.onPointerOut();
        }
        hoveredHotspotRef.current = null;
      }
      
      // Handle hover in
      if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        if (hoveredObject !== hoveredHotspotRef.current) {
          // Hide label for previously hovered hotspot
          if (hoveredHotspotRef.current) {
            const prevHotspotGroup = hoveredHotspotRef.current as any;
            if (prevHotspotGroup.onPointerOut) {
              prevHotspotGroup.onPointerOut();
            }
          }
          
          // Show label for newly hovered hotspot
          const hotspotGroup = hoveredObject as any;
          if (hotspotGroup.onPointerOver) {
            hotspotGroup.onPointerOver();
          }
          
          hoveredHotspotRef.current = hoveredObject;
        }
      }
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    mouseStateRef.current.isDown = false;
    
    // Handle left click for hotspot interaction
    if (event.button === 0 && onHotspotClick && hotspots.length > 0 && cameraRef.current) {
      const container = containerRef.current;
      if (!container) return;
      
      // Calculate normalized device coordinates
      const rect = container.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Create raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      
      // Check intersection with hotspots
      if (hotspotGroupRef.current) {
        const intersects = raycaster.intersectObjects(hotspotGroupRef.current.children);
        if (intersects.length > 0) {
          // Get the clicked hotspot object
          const clickedObject = intersects[0].object as THREE.Sprite;
          
          // Add animation effect
          if (clickedObject && clickedObject.scale) {
            // Store original scale
            const originalScale = clickedObject.scale.clone();
            
            // Animate with smooth transition
            let progress = 0;
            const duration = 300; // ms
            const startTime = performance.now();
            
            const animate = (currentTime: number) => {
              progress = Math.min(1, (currentTime - startTime) / duration);
              
              // Ease out function for smooth animation
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              
              // Scale animation
              const scale = 1 + 0.3 * Math.sin(easeProgress * Math.PI);
              clickedObject.scale.set(originalScale.x * scale, originalScale.y * scale, 1);
              
              // Rotation animation
              if (clickedObject.rotation) {
                clickedObject.rotation.z = easeProgress * Math.PI / 4;
              }
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                // Return to original state
                clickedObject.scale.copy(originalScale);
                if (clickedObject.rotation) {
                  clickedObject.rotation.z = 0;
                }
              }
            };
            requestAnimationFrame(animate);
          }
          
          // Get hotspot data from the sprite
          const hotspotData = (clickedObject as any).hotspotData;
          if (hotspotData) {
            onHotspotClick(hotspotData);
          } else {
            // Fallback to old method
            const hotspotPositions = hotspots.map(h => new THREE.Vector3(h.position_x, h.position_y, h.position_z));
            const clickedPosition = clickedObject.position;
            const closestHotspotIndex = hotspotPositions.reduce((closestIndex, pos, index) => {
              const distance = pos.distanceTo(clickedPosition);
              const closestDistance = closestIndex === -1 ? Infinity : hotspotPositions[closestIndex].distanceTo(clickedPosition);
              return distance < closestDistance ? index : closestIndex;
            }, -1);
            
            if (closestHotspotIndex !== -1) {
              onHotspotClick(hotspots[closestHotspotIndex]);
            }
          }
        }
      }
    }
    
    // Apply inertia on mouse release for smooth movement
    // Velocity will be reduced in the animation loop
  };

  const [tooltip, setTooltip] = useState<{visible: boolean, message: string, x: number, y: number}>({visible: false, message: '', x: 0, y: 0});
  
  const handleRightClick = (event: MouseEvent) => {
    console.log('[PanoramaViewer] handleRightClick called', { isCreatingTransition, hasCamera: !!cameraRef.current });
    
    if (!isCreatingTransition) {
      // Show a message to the user that they need to activate transition creation mode
      console.log('[PanoramaViewer] Transition creation mode not active');
      
      // Show tooltip
      setTooltip({
        visible: true,
        message: 'Сначала нажмите "Создать переход"',
        x: event.clientX,
        y: event.clientY
      });
      
      // Hide tooltip after 3 seconds
      setTimeout(() => {
        setTooltip(prev => ({...prev, visible: false}));
      }, 3000);
      
      return;
    }
    
    if (!cameraRef.current) {
      console.log('[PanoramaViewer] handleRightClick cancelled - no camera');
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate normalized device coordinates
    const rect = container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    console.log('[PanoramaViewer] Mouse coordinates', { mouseX, mouseY });
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    
    // Check intersection with sphere
    if (sphereRef.current) {
      const intersects = raycaster.intersectObject(sphereRef.current);
      console.log('[PanoramaViewer] Intersections found', intersects.length);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log('[PanoramaViewer] Intersection point', point);
        
        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          position: { x: point.x, y: point.y, z: point.z }
        });
        
        console.log('[PanoramaViewer] Context menu set');
      }
    }
  };

  const handleCreateHotspot = () => {
    if (!contextMenu.position || hotspotForm.targetPanoramaId === null) return;
    
    if (onCreateHotspot) {
      onCreateHotspot(contextMenu.position, hotspotForm.targetPanoramaId, hotspotForm.title);
    }
    
    // Hide menus
    setContextMenu(prev => ({ ...prev, visible: false }));
    setHotspotForm(prev => ({ ...prev, visible: false }));
  };

  // Wheel event handler for zoom
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault(); // Prevent page scrolling

    // Zoom with improved sensitivity
    const delta = event.deltaY > 0 ? 5 : -5;
    cameraStateRef.current.targetFov = Math.max(20, Math.min(100, cameraStateRef.current.targetFov + delta));
    setControls(prev => ({ ...prev, zoom: Math.round(100 - ((cameraStateRef.current.targetFov - 20) / 80) * 100) })); // Update zoom display
  };

  // Click handler for hotspots (placeholder)
  const handleClick = (event: MouseEvent) => {
    // Hotspot logic will go here later
    console.log('Click handled (placeholder)');
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

  // Prevent context menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  // Set up mouse and touch event listeners
  const setupEventListeners = () => {
    const container = containerRef.current;
    if (!container) return;

    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu); // Prevent context menu

    // Wheel event for zoom
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
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
    container.removeEventListener('contextmenu', handleContextMenu);

    container.removeEventListener('wheel', handleWheel);

    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
  };

  // Handle window resize
  const handleResize = () => {
    if (containerRef.current && cameraRef.current && rendererRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  // Create hotspots
  // Animation loop

  // Control handlers
  const handleZoomIn = () => {
    console.log('Zoom in button clicked');
    cameraStateRef.current.targetFov = Math.max(20, cameraStateRef.current.targetFov - 5);
    setControls(prev => ({ ...prev, zoom: Math.round(100 - ((cameraStateRef.current.targetFov - 20) / 80) * 100) }));
  };
  
  const handleZoomOut = () => {
    console.log('Zoom out button clicked');
    cameraStateRef.current.targetFov = Math.min(100, cameraStateRef.current.targetFov + 5);
    setControls(prev => ({ ...prev, zoom: Math.round(100 - ((cameraStateRef.current.targetFov - 20) / 80) * 100) }));
  };
  
  const handleResetView = () => {
    console.log('Reset view button clicked');
    cameraStateRef.current.targetPhi = 0;
    cameraStateRef.current.targetTheta = Math.PI / 2;
    cameraStateRef.current.targetFov = 75;
    // Also reset the current values to make the transition immediate
    cameraStateRef.current.phi = 0;
    cameraStateRef.current.theta = Math.PI / 2;
    cameraStateRef.current.fov = 75;
    setControls(prev => ({ ...prev, zoom: Math.round(100 - ((75 - 20) / 80) * 100) }));
  };
  
  const handleShare = () => {
    // Implement sharing functionality
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Ссылка скопирована в буфер обмена!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Не удалось скопировать ссылку');
    });
  };
  
  const toggleAutoRotate = () => {
    setControls(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Initialize Three.js scene
  const initScene = (currentPanoramaId: number) => {
    console.log('[PanoramaViewer] initScene called with panorama ID:', currentPanoramaId);
    
    if (!containerRef.current) {
      console.log('[PanoramaViewer] initScene cancelled - no container');
      return;
    }
  
    try {
      // Clean up existing renderer if it exists
      // if (rendererRef.current && containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
      //   rendererRef.current.dispose();
      //   containerRef.current.removeChild(rendererRef.current.domElement);
      //   }
  
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      console.log(`[PanoramaViewer] Container dimensions: ${width}x${height}`);
      
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
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;
      
      // Add renderer to container
      container.appendChild(renderer.domElement);

      // Create sphere geometry and material
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      sphereRef.current = sphere;

      // Create hotspot group
      const hotspotGroup = new THREE.Group();
      scene.add(hotspotGroup);
      hotspotGroupRef.current = hotspotGroup;

      // Load panorama texture
      loadPanoramaTexture(currentPanoramaId);

      // Start animation loop
      animate();

    } catch (err) {
      console.error('Error initializing Three.js scene:', err);
      setError('Ошибка инициализации 3D движка: ' + (err as Error).message);
      setIsLoading(false);
    }
  };
  
  // Create 3D hotspots
  const createHotspots = () => {
    console.log('[PanoramaViewer] createHotspots called with hotspots:', hotspots);
    
    if (!hotspotGroupRef.current || !cameraRef.current) {
      console.log('[PanoramaViewer] createHotspots cancelled - no hotspotGroup or camera');
      return;
    }
    
    // Clear existing hotspots
    while (hotspotGroupRef.current.children.length > 0) {
      const child = hotspotGroupRef.current.children[0];
      if (child instanceof THREE.Sprite) {
        // Dispose of sprite material and texture if needed
        if (child.material instanceof THREE.SpriteMaterial) {
          child.material.dispose();
        }
      }
      hotspotGroupRef.current.remove(child);
    }
    
    // Create new hotspots
    hotspots.forEach((hotspot) => {
      console.log('[PanoramaViewer] Creating hotspot:', hotspot);
      
      // Create a group to hold both the arrow and the label
      const hotspotGroup = new THREE.Group();
      
      // Create a sprite for the hotspot with arrow
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        // Draw a more prominent arrow
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        // Draw arrow body
        context.fillStyle = '#3b82f6'; // Blue color
        context.beginPath();
        context.moveTo(64, 20);
        context.lineTo(100, 64);
        context.lineTo(64, 108);
        context.lineTo(64, 80);
        context.lineTo(28, 80);
        context.lineTo(28, 48);
        context.lineTo(64, 48);
        context.closePath();
        context.fill();
        
        // Add white border
        context.strokeStyle = '#ffffff';
        context.lineWidth = 3;
        context.stroke();
        
        // Reset shadow
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Draw a small circle at the tip for better visibility
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(100, 64, 6, 0, Math.PI * 2);
        context.fill();
        
        context.fillStyle = '#3b82f6';
        context.beginPath();
        context.arc(100, 64, 3, 0, Math.PI * 2);
        context.fill();
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false // Always render on top
      });
      
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(40, 40, 1);
      
      // Position the hotspot
      sprite.position.set(hotspot.position_x, hotspot.position_y, hotspot.position_z);
      
      // Store hotspot data in the sprite for interaction
      (sprite as any).hotspotData = hotspot;
      
      // Add sprite to group
      hotspotGroup.add(sprite);
      
      // Create label if hotspot has a title
      if (hotspot.title) {
        // Create a canvas for the text
        const textCanvas = document.createElement('canvas');
        const textContext = textCanvas.getContext('2d');
        if (textContext) {
          // Set font and measure text
          textContext.font = 'Bold 24px Arial';
          const textWidth = textContext.measureText(hotspot.title).width;
          
          // Set canvas size
          textCanvas.width = textWidth + 20;
          textCanvas.height = 40;
          
          // Draw background
          textContext.fillStyle = 'rgba(59, 130, 246, 0.9)';
          textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);
          
          // Draw text
          textContext.fillStyle = 'white';
          textContext.font = 'Bold 24px Arial';
          textContext.textAlign = 'center';
          textContext.textBaseline = 'middle';
          textContext.fillText(hotspot.title, textCanvas.width / 2, textCanvas.height / 2);
        }
        
        const textTexture = new THREE.CanvasTexture(textCanvas);
        const textMaterial = new THREE.SpriteMaterial({
          map: textTexture,
          transparent: true,
          depthTest: false
        });
        
        const textSprite = new THREE.Sprite(textMaterial);
        textSprite.scale.set(60, 20, 1);
        textSprite.position.set(0, 50, 0); // Position above the arrow
        textSprite.visible = false; // Hidden by default
        
        // Store reference to text sprite in main sprite
        (sprite as any).textSprite = textSprite;
        
        hotspotGroup.add(textSprite);
      }
      
      // Position the entire group
      hotspotGroup.position.set(hotspot.position_x, hotspot.position_y, hotspot.position_z);
      
      // Store hotspot data in the group for interaction
      (hotspotGroup as any).hotspotData = hotspot;
      
      // Add hover events
      (hotspotGroup as any).onPointerOver = () => {
        if ((sprite as any).textSprite) {
          (sprite as any).textSprite.visible = true;
        }
      };
      
      (hotspotGroup as any).onPointerOut = () => {
        if ((sprite as any).textSprite) {
          (sprite as any).textSprite.visible = false;
        }
      };
      
      if (hotspotGroupRef.current) {
        hotspotGroupRef.current.add(hotspotGroup);
      }
    });
    
    console.log('[PanoramaViewer] Hotspots created, count:', hotspots.length);
  };
  
  // Update hotspots when they change
  useEffect(() => {
    if (!isLoading && !error) {
      console.log('[PanoramaViewer] Updating hotspots:', hotspots);
      createHotspots();
    }
  }, [hotspots, isLoading, error]);

  // Load panorama texture
  const loadPanoramaTexture = (panoramaId: number) => {
    console.log('[PanoramaViewer] loadPanoramaTexture called with panorama ID:', panoramaId);
    setIsLoading(true);
    setError(null);
  
    const imageUrl = `/api/panoramas/${panoramaId}/image`;
    console.log('[PanoramaViewer] Loading texture from:', imageUrl);
    const textureLoader = new THREE.TextureLoader();
  
    textureLoader.load(
      imageUrl,
      (texture) => {
        console.log('[PanoramaViewer] Texture loaded successfully');
        if (!isMountedRef.current) {
          texture.dispose();
          return;
        }

        texture.flipY = true; // Set to true for correct orientation of equirectangular textures
        texture.colorSpace = THREE.SRGBColorSpace; // Set color space
        texture.needsUpdate = true; // Ensure texture update is triggered
        console.log('[PanoramaViewer] texture.flipY after setting:', texture.flipY);
        console.log('[PanoramaViewer] Texture dimensions:', texture.image.width, 'x', texture.image.height);

        if (sphereRef.current) {
          const material = sphereRef.current.material as THREE.MeshBasicMaterial;
          material.map = texture; // Texture application logic (restored)
          material.needsUpdate = true;
        }

        setIsLoading(false);
        console.log('[PanoramaViewer] Texture loaded and applied successfully');
      },
      undefined,
      (err) => {
        console.log('[PanoramaViewer] Error loading texture:', err);
        if (!isMountedRef.current) return;
        console.error('[PanoramaViewer] Error loading texture:', err);
        setError('Не удалось загрузить изображение панорамы.');
        setIsLoading(false);
        // Fallback to gray sphere
        if (sphereRef.current) {
          const material = sphereRef.current.material as THREE.MeshBasicMaterial;
          material.map = null;
          material.color.set(0x333333);
          material.needsUpdate = true;
        }
      }
    );
  };
  
  // Animation loop
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
  
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
  
    const cameraState = cameraStateRef.current;
    const mouseState = mouseStateRef.current;

    // Apply inertia if mouse/touch is not down
    if (!mouseState.isDown) {
      // Apply velocity with damping for smooth deceleration
      cameraState.targetPhi -= mouseState.velocityX * 0.003; // Use same sensitivity as direct control
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
    if (cameraRef.current) {
      cameraRef.current.lookAt(x, y, z);
      cameraRef.current.fov = cameraState.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  
    // Auto-rotate if enabled
    if (controls.isPlaying) {
      cameraState.targetPhi += 0.002; // Auto-rotation speed
    }
  
    // Update hotspot positions to always face the camera
    if (hotspotGroupRef.current && cameraRef.current) {
      hotspotGroupRef.current.children.forEach((hotspot) => {
        if (hotspot instanceof THREE.Sprite) {
          // Make hotspot look at camera
          hotspot.lookAt(cameraRef.current!.position);
        }
      });
    }
  
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
  
  // Handle fullscreen change (kept as is)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setControls(prev => ({ ...prev, isFullscreen }));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Initialize scene on mount and when panorama changes (ensure initScene and event listeners are called)
  useEffect(() => {
    // Clean up previous scene if it exists
    if (rendererRef.current) {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      cleanupEventListeners();
      
      // Dispose of Three.js objects
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
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
      sceneRef.current = null;
      cameraRef.current = null;
      hotspotGroupRef.current = null;
    }
    
    isMountedRef.current = true;
    initScene(panorama.id);
    setupEventListeners(); // Re-enable event listeners

    return () => {
      isMountedRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      cleanupEventListeners(); // Clean up event listeners
      // Dispose of Three.js objects (moved from initScene)
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement);
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
      sceneRef.current = null;
      cameraRef.current = null;
      hotspotGroupRef.current = null;
    };
  }, [panorama.id]);
  
  // Handle sharing (placeholder)

  if (error) {
    return (
      <div className={cn('relative w-full h-full overflow-hidden flex items-center justify-center bg-black', className)}>
        <div className="text-center text-white max-w-md mx-4">
          <p className="text-red-400 mb-4 text-lg">❌ {error}</p>
          <button 
            onClick={() => loadPanoramaTexture(panorama.id)}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
  
  // Debug information
  console.log('[PanoramaViewer] Rendering with panorama:', panorama);
  
  if (!panorama || !panorama.id) {
    return (
      <div className={cn('relative w-full h-full overflow-hidden flex items-center justify-center bg-black', className)}>
        <div className="text-center text-white max-w-md mx-4">
          <p className="text-yellow-400 mb-4 text-lg">⚠️ Нет данных о панораме</p>
          <p className="text-gray-400 text-sm">Panorama prop: {JSON.stringify(panorama)}</p>
          <p className="text-gray-400 text-sm">Panorama ID: {panorama?.id || 'N/A'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Debug information */}
      <div className="absolute top-0 left-0 z-50 bg-black bg-opacity-70 text-white text-xs p-2">
        Panorama ID: {panorama?.id || 'N/A'}
        Hotspots: {hotspots?.length || 0}
        Creating transition: {isCreatingTransition ? 'Yes' : 'No'}
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && (
        <div 
          className="absolute bg-yellow-500 text-white text-sm font-medium rounded py-2 px-3 shadow-lg z-50"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            transform: 'translate(0, 0)'
          }}
        >
          {tooltip.message}
        </div>
      )}
      
      {/* Three.js container */}
      <div 
        ref={containerRef} 
        className="w-full h-full bg-black"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-40">
          <div className="text-center text-white">
            <div className="w-8 h-8 mx-auto mb-4 border-t-2 border-primary-500 border-solid rounded-full animate-spin" />
            <p className="text-lg">Загрузка панорамы...</p>
            <p className="text-sm text-gray-400 mt-2">ID: {panorama.id}</p>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(10px, 10px)'
          }}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setHotspotForm(prev => ({ ...prev, visible: true }))}
          >
            Создать переход
          </button>
        </div>
      )}
      
      {/* Hotspot Creation Form */}
      {hotspotForm.visible && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Создать переход</h3>
              <button 
                onClick={() => setHotspotForm(prev => ({ ...prev, visible: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-2">
                <p className="text-sm text-blue-700">
                  Создайте переход, указав название и выбрав целевую панораму.
                  После создания стрелка появится в том месте, где вы кликнули правой кнопкой мыши.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название перехода
                </label>
                <input
                  type="text"
                  value={hotspotForm.title}
                  onChange={(e) => setHotspotForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Введите название (необязательно)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Целевая панорама *
                </label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {tourPanoramas
                    .filter(p => p.id !== panorama.id)
                    .map((panorama) => (
                      <div 
                        key={panorama.id}
                        onClick={() => setHotspotForm(prev => ({ ...prev, targetPanoramaId: panorama.id }))}
                        className={`flex items-center p-3 cursor-pointer border-b last:border-b-0 ${
                          hotspotForm.targetPanoramaId === panorama.id 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`http://localhost:5000/api/panoramas/${panorama.id}/image`}
                            alt={panorama.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center"><span class="text-white text-xs">Пан</span></div>';
                              }
                            }}
                          />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {panorama.title}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {panorama.description || 'Без описания'}
                          </p>
                        </div>
                        {hotspotForm.targetPanoramaId === panorama.id && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  {tourPanoramas.filter(p => p.id !== panorama.id).length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      Нет доступных панорам для перехода
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-4 border-t">
              <button
                onClick={() => setHotspotForm(prev => ({ ...prev, visible: false }))}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateHotspot}
                disabled={hotspotForm.targetPanoramaId === null}
                className="btn-primary disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Controls */}
      {showControls && !isLoading && !error && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute top-4 right-4 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-3 flex flex-col space-y-2 pointer-events-auto">
            <button
              onClick={handleZoomIn}
              className="text-white hover:text-primary-400 transition-colors p-2 rounded hover:bg-white/10"
              title="Приблизить"
            >
              <ZoomIn size={20} />
            </button>
            
            <span className="text-white text-xs text-center py-1 px-2 min-w-[3rem]">
              {controls.zoom}%
            </span>
            
            <button
              onClick={handleZoomOut}
              className="text-white hover:text-primary-400 transition-colors p-2 rounded hover:bg-white/10"
              title="Отдалить"
            >
              <ZoomOut size={20} />
            </button>
            
            <div className="h-px bg-gray-600" />
            
            <button
              onClick={handleResetView}
              className="text-white hover:text-primary-400 transition-colors p-2 rounded hover:bg-white/10"
              title="Сбросить вид"
            >
              <RotateCcw size={20} />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-400 transition-colors p-2 rounded hover:bg-white/10"
              title={controls.isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            >
              {controls.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      )}
      
      {/* Removed the panorama info panel since it's already in PanoramaPage */}
    </div>
  );
};

export default PanoramaViewer;