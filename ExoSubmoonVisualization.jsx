import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ExoSubmoonVisualization = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  const starFieldRef = useRef(null);
  
  // Simulation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showStabilityZones, setShowStabilityZones] = useState(true);
  const [viewMode, setViewMode] = useState('standard'); // standard, topDown, planet, moon, educational
  const [presetMode, setPresetMode] = useState('optimal'); // optimal, unstable, custom
  
  // System parameters
  const [planetMass, setPlanetMass] = useState(28); // Jupiter masses
  const [moonMass, setMoonMass] = useState(0.5); // Jupiter masses
  const [submoonMass, setSubmoonMass] = useState(0.05); // Jupiter masses
  const [planetRadius, setPlanetRadius] = useState(60); // Increased distance from star (AU)
  const [moonRadius, setMoonRadius] = useState(3); // In Hill radii
  const [submoonRadius, setSubmoonRadius] = useState(0.5); // In Hill radii
  
  // Derived planetary values
  const [planetToMoonRatio, setPlanetToMoonRatio] = useState(0);
  const [moonToSubmoonRatio, setMoonToSubmoonRatio] = useState(0);
  const [hillRadiusMoon, setHillRadiusMoon] = useState(0);
  const [hillRadiusSubmoon, setHillRadiusSubmoon] = useState(0);
  const [rocheLimit, setRocheLimit] = useState(0);
  
  // Stats for display
  const [stats, setStats] = useState({
    stability: 'Unknown',
    estimatedLifetime: 'Calculating...',
    tidalForces: 'Unknown',
    orbitRatio: '0',
    stabilityScore: 0,
    criticalParams: []
  });
  
  // Set preset configurations
  useEffect(() => {
    if (presetMode === 'optimal') {
      // Based on research: planet/moon ratio < 60, moon/submoon ratio > 5
      setPlanetMass(25);
      setMoonMass(0.5);
      setSubmoonMass(0.08);
      setPlanetRadius(20);
      setMoonRadius(3.2);
      setSubmoonRadius(0.5);
    } else if (presetMode === 'unstable') {
      // Unstable configuration: high planet/moon ratio, low moon/submoon ratio
      setPlanetMass(50);
      setMoonMass(0.2);
      setSubmoonMass(0.15);
      setPlanetRadius(15);
      setMoonRadius(4.5);
      setSubmoonRadius(1.2);
    }
  }, [presetMode]);
  
  // Initialize the visualization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    
    // Create starfield background
    createStarField(scene, 2000);
    
    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x101010, 0.8);
    scene.add(ambientLight);
    
    // Set initial camera position
    camera.position.set(60, 40, 60);
    camera.lookAt(0, 0, 0);
    
    // Add window resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      // Dispose of any resources
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);
  
  // Create star field function
  const createStarField = (scene, count) => {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8,
      vertexColors: true
    });
    
    const positions = [];
    const colors = [];
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      // Random position in sphere
      const radius = 1000;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // Random star color (white to blue-ish)
      const r = 0.7 + 0.3 * Math.random();
      const g = 0.7 + 0.3 * Math.random();
      const b = 0.9 + 0.1 * Math.random();
      
      color.setRGB(r, g, b);
      colors.push(color.r, color.g, color.b);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    starFieldRef.current = starField;
  };
  
  // Update celestial bodies and orbits
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Remove previous celestial bodies and orbits
    scene.children = scene.children.filter(child => {
      // Keep starfield and lights
      return child.type === 'Points' || child.type === 'AmbientLight' || child.type === 'PointLight';
    });
    
    // Create Solar System objects
    createCelestialBodies();
    
    // Calculate stability metrics
    calculateStabilityMetrics();
    
  }, [planetMass, moonMass, submoonMass, planetRadius, moonRadius, submoonRadius, showOrbits, showStabilityZones]);
  
  // Helper to create text labels
  const createTextLabel = (text, x, y, z, color) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.font = "Bold 24px Arial";
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.fillText(text, 10, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(10, 2.5, 1);
    
    return sprite;
  };

  // Create celestial bodies function
  const createCelestialBodies = () => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Scale factors for visualization (astronomical objects have vastly different scales)
    // Using logarithmic scaling to make things visible
    const visualScale = 2; // General scale factor
    
    // Calculate realistic mass-to-radius relationships
    // For gas giants: R ∝ M^0.55 for M > 0.1 Jupiter masses
    // For rocky bodies: R ∝ M^0.3 for M < 0.1 Jupiter masses
    const calculateRadius = (mass, isGasGiant = false) => {
      if (isGasGiant || mass > 0.1) {
        return Math.pow(mass, 0.55) * visualScale;
      } else {
        return Math.pow(mass, 0.3) * visualScale * 0.7;
      }
    };
    
    // Calculate Hill radius
    const calculateHillRadius = (primaryMass, secondaryMass, orbitRadius) => {
      return orbitRadius * Math.pow(secondaryMass / (3 * primaryMass), 1/3);
    };
    
    // Calculate Roche limit
    const calculateRocheLimit = (primaryRadius, primaryDensity, secondaryDensity) => {
      return primaryRadius * 2.44 * Math.pow(primaryDensity / secondaryDensity, 1/3);
    };
    
    // Create Star (central body)
    const starRadius = 15; // Increased star size
    const starGeometry = new THREE.SphereGeometry(starRadius, 64, 64);
    const starMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff80,
      emissive: 0xffff00,
      emissiveIntensity: 1
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(star);

    // Add Point Light to simulate star's light
    const light = new THREE.PointLight(0xffffff, 1.5, 1000);
    light.position.set(0, 0, 0);
    light.castShadow = true;
    scene.add(light);

    // Create Planet
    const calculatedPlanetRadius = calculateRadius(planetMass, true);
    const planetVisualRadius = calculatedPlanetRadius * 0.4; // Reduce planet size by 60%
    const planetGeometry = new THREE.SphereGeometry(planetVisualRadius, 64, 64);
    
    // Create planet texture
    const planetTexture = createGasGiantTexture();
    
    const planetMaterial = new THREE.MeshPhongMaterial({ 
      map: planetTexture,
      specular: 0x333333,
      shininess: 30,
      bumpScale: 0.5
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.castShadow = true;
    planet.receiveShadow = true;
    scene.add(planet);
    
    // Calculate true planet position in orbit
    const planetOrbitAngle = 0; // Initial angle
    planet.position.x = planetRadius * Math.cos(planetOrbitAngle);
    planet.position.z = planetRadius * Math.sin(planetOrbitAngle);
    
    // Create Moon
    const calculatedMoonRadius = calculateRadius(moonMass, moonMass > 0.1);
    const moonVisualRadius = calculatedMoonRadius;
    const moonGeometry = new THREE.SphereGeometry(moonVisualRadius, 32, 32);
    
    // Create moon texture - rocky for smaller moons, gas for larger
    const moonTexture = moonMass > 0.1 ? createGasGiantTexture(2) : createRockyTexture();
    
    const moonMaterial = new THREE.MeshPhongMaterial({ 
      map: moonTexture,
      specular: 0x333333,
      shininess: 20
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    scene.add(moon);
    
    // Calculate Hill radius of planet (for moon's orbit)
    const hillRadiusPlanet = calculateHillRadius(1000, planetMass, planetRadius); // Star mass approximated
    setHillRadiusMoon(hillRadiusPlanet);
    
    // Calculate Roche limit for moon around planet
    const planetDensity = 1.33; // Jupiter density in g/cm³
    const moonDensity = moonMass > 0.1 ? 1.33 : 3.9; // g/cm³
    const rocheLimitMoon = calculateRocheLimit(planetVisualRadius, planetDensity, moonDensity);
    setRocheLimit(rocheLimitMoon);
    
    // Place moon in its orbit
    const moonOrbitRadius = moonRadius * hillRadiusPlanet;
    const moonOrbitAngle = 0; // Initial angle
    moon.position.x = planet.position.x + moonOrbitRadius * Math.cos(moonOrbitAngle);
    moon.position.z = planet.position.z + moonOrbitRadius * Math.sin(moonOrbitAngle);
    
    // Create Submoon
    const calculatedSubmoonRadius = calculateRadius(submoonMass, false);
    const submoonVisualRadius = calculatedSubmoonRadius;
    const submoonGeometry = new THREE.SphereGeometry(submoonVisualRadius, 24, 24);
    
    // Create submoon texture (likely rocky for all realistic submoons)
    const submoonTexture = createRockyTexture(3);
    
    const submoonMaterial = new THREE.MeshPhongMaterial({ 
      map: submoonTexture,
      specular: 0x222222,
      shininess: 15
    });
    const submoon = new THREE.Mesh(submoonGeometry, submoonMaterial);
    submoon.castShadow = true;
    submoon.receiveShadow = true;
    scene.add(submoon);
    
    // Calculate Hill radius of moon (for submoon's orbit)
    const hillRadiusMoonValue = calculateHillRadius(planetMass, moonMass, moonOrbitRadius);
    setHillRadiusSubmoon(hillRadiusMoonValue);
    
    // Place submoon in its orbit
    const submoonOrbitRadius = submoonRadius * hillRadiusMoonValue;
    const submoonOrbitAngle = 0; // Initial angle
    submoon.position.x = moon.position.x + submoonOrbitRadius * Math.cos(submoonOrbitAngle);
    submoon.position.z = moon.position.z + submoonOrbitRadius * Math.sin(submoonOrbitAngle);
    
    // Create Orbits as rings
    if (showOrbits) {
      // Planet's orbit around star
      const planetOrbitGeometry = new THREE.RingGeometry(planetRadius - 0.1, planetRadius + 0.1, 128);
      const planetOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x3498db,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const planetOrbit = new THREE.Mesh(planetOrbitGeometry, planetOrbitMaterial);
      planetOrbit.rotation.x = Math.PI / 2;
      scene.add(planetOrbit);
      
      // Moon's orbit around planet
      const moonOrbitGeometry = new THREE.RingGeometry(moonOrbitRadius - 0.05, moonOrbitRadius + 0.05, 128);
      const moonOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xecf0f1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
      moonOrbit.rotation.x = Math.PI / 2;
      moonOrbit.position.copy(planet.position);
      scene.add(moonOrbit);
      
      // Submoon's orbit around moon
      const submoonOrbitGeometry = new THREE.RingGeometry(submoonOrbitRadius - 0.02, submoonOrbitRadius + 0.02, 64);
      const submoonOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xe74c3c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const submoonOrbit = new THREE.Mesh(submoonOrbitGeometry, submoonOrbitMaterial);
      submoonOrbit.rotation.x = Math.PI / 2;
      submoonOrbit.position.copy(moon.position);
      scene.add(submoonOrbit);
    }
    
    // Add stability zones visualizations if enabled
    if (showStabilityZones) {
      // Hill sphere boundary for moon
      const hillSphereGeometry = new THREE.SphereGeometry(hillRadiusPlanet, 32, 32);
      const hillSphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x3498db,
        transparent: true,
        opacity: 0.15,  // Increased opacity
        wireframe: true
      });
      
      // Add text label for clarity
      const hillSphereLabel = createTextLabel("Hill Sphere", hillRadiusPlanet + 2, 0, 0, "0x3498db");
      hillSphereLabel.position.copy(planet.position);
      scene.add(hillSphereLabel);
      
      // Roche limit for planet
      const rocheLimitGeometry = new THREE.SphereGeometry(rocheLimitMoon, 32, 32);
      const rocheLimitMaterial = new THREE.MeshBasicMaterial({
        color: 0xe74c3c,
        transparent: true,
        opacity: 0.05,
        wireframe: true
      });
      const rocheLimit = new THREE.Mesh(rocheLimitGeometry, rocheLimitMaterial);
      rocheLimit.position.copy(planet.position);
      scene.add(rocheLimit);
      
      // Optimal moon orbital zone (from research: 0.3-0.5 Hill radius)
      const optimalOrbitMinRadius = 0.3 * hillRadiusPlanet;
      const optimalOrbitMaxRadius = 0.5 * hillRadiusPlanet;
      
      const optimalOrbitGeometry = new THREE.RingGeometry(optimalOrbitMinRadius, optimalOrbitMaxRadius, 64);
      const optimalOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x2ecc71,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const optimalOrbit = new THREE.Mesh(optimalOrbitGeometry, optimalOrbitMaterial);
      optimalOrbit.rotation.x = Math.PI / 2;
      optimalOrbit.position.copy(planet.position);
      scene.add(optimalOrbit);
      
      // Hill sphere boundary for submoon
      const hillSphereSubmoonGeometry = new THREE.SphereGeometry(hillRadiusMoonValue, 24, 24);
      const hillSphereSubmoonMaterial = new THREE.MeshBasicMaterial({
        color: 0xe74c3c,
        transparent: true,
        opacity: 0.05,
        wireframe: true
      });
      const hillSphereSubmoon = new THREE.Mesh(hillSphereSubmoonGeometry, hillSphereSubmoonMaterial);
      hillSphereSubmoon.position.copy(moon.position);
      scene.add(hillSphereSubmoon);
      
      // Optimal submoon orbital zone (from research: 0.4-0.6 Hill radius)
      const optimalSubmoonMinRadius = 0.4 * hillRadiusMoonValue;
      const optimalSubmoonMaxRadius = 0.6 * hillRadiusMoonValue;
      
      const optimalSubmoonOrbitGeometry = new THREE.RingGeometry(optimalSubmoonMinRadius, optimalSubmoonMaxRadius, 48);
      const optimalSubmoonOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x2ecc71,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
      });
      const optimalSubmoonOrbit = new THREE.Mesh(optimalSubmoonOrbitGeometry, optimalSubmoonOrbitMaterial);
      optimalSubmoonOrbit.rotation.x = Math.PI / 2;
      optimalSubmoonOrbit.position.copy(moon.position);
      scene.add(optimalSubmoonOrbit);
    }
    
    // Start animation
    startAnimation(star, planet, moon, submoon);
  };
  
  // Create texture for gas giant planets
  const createGasGiantTexture = (seed = 1) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    // Different color schemes based on seed
    if (seed === 1) {
      // Jupiter-like
      grd.addColorStop(0, '#b07f35');
      grd.addColorStop(0.3, '#c8a458');
      grd.addColorStop(0.7, '#e5cea2');
      grd.addColorStop(1, '#b98b45');
    } else {
      // Saturn-like
      grd.addColorStop(0, '#e3dccb');
      grd.addColorStop(0.4, '#cdbaa8');
      grd.addColorStop(0.7, '#d0be97');
      grd.addColorStop(1, '#c9b78c');
    }
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bands
    const bandCount = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < bandCount; i++) {
      const y = (i / bandCount) * canvas.height;
      const height = canvas.height / bandCount * (0.5 + Math.random() * 0.5);
      
      ctx.fillStyle = `rgba(${50 + Math.random() * 100}, ${40 + Math.random() * 60}, ${20 + Math.random() * 40}, ${0.1 + Math.random() * 0.3})`;
      ctx.fillRect(0, y, canvas.width, height);
    }
    
    // Add some storms/spots
    const spotCount = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < spotCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 5 + Math.random() * 20;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${180 + Math.random() * 75}, ${160 + Math.random() * 70}, ${100 + Math.random() * 50}, ${0.2 + Math.random() * 0.4})`;
      ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1; // Flip texture horizontally
    
    return texture;
  };
  
  // Create texture for rocky bodies
  const createRockyTexture = (seed = 1) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create base color
    let baseColor;
    if (seed === 1) {
      // Moon-like (gray)
      baseColor = {r: 180, g: 180, b: 180};
    } else if (seed === 2) {
      // Mars-like (red)
      baseColor = {r: 200, g: 140, b: 100};
    } else {
      // Mercury-like (brown)
      baseColor = {r: 160, g: 140, b: 120};
    }
    
    ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise for texture
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 30 - 15;
      
      data[i] = Math.max(0, Math.min(255, baseColor.r + noise));
      data[i+1] = Math.max(0, Math.min(255, baseColor.g + noise));
      data[i+2] = Math.max(0, Math.min(255, baseColor.b + noise));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add craters
    const craterCount = 40 + Math.floor(Math.random() * 60);
    for (let i = 0; i < craterCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 2 + Math.random() * 15;
      
      // Crater rim
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${baseColor.r + 30}, ${baseColor.g + 30}, ${baseColor.b + 30}, 0.8)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Crater center (shadow)
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor.r - 40}, ${baseColor.g - 40}, ${baseColor.b - 40}, 0.7)`;
      ctx.fill();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1; // Flip texture horizontally
    
    return texture;
  };
  
  // Calculate stability metrics for the system
  const calculateStabilityMetrics = () => {
    // Calculate the key ratios found in research
    const planetToMoonMassRatio = planetMass / moonMass;
    setPlanetToMoonRatio(planetToMoonMassRatio);
    
    const moonToSubmoonMassRatio = moonMass / submoonMass;
    setMoonToSubmoonRatio(moonToSubmoonMassRatio);
    
    // Calculate orbital ratios
    const moonOrbitRatio = moonRadius / 0.5; // Compare to optimal 0.5 Hill radius
    const submoonOrbitRatio = submoonRadius / 0.5; // Compare to optimal 0.5 Hill radius
    
    // Stability thresholds from research
    const isStable = moonToSubmoonMassRatio > 5 && planetToMoonMassRatio < 60 && 
                    submoonRadius >= 0.3 && submoonRadius <= 0.7;
                    
    const isMarginal = moonToSubmoonMassRatio > 3 && planetToMoonMassRatio < 80 &&
                      submoonRadius >= 0.2 && submoonRadius <= 0.8;
    
    // Calculate a stability score (0-100)
    let stabilityScore = 0;
    
    // Score based on mass ratios (max 70 points)
    let massRatioScore = 0;
    if (planetToMoonMassRatio < 40) massRatioScore += 30;
    else if (planetToMoonMassRatio < 60) massRatioScore += 20;
    else if (planetToMoonMassRatio < 80) massRatioScore += 10;
    
    if (moonToSubmoonMassRatio > 8) massRatioScore += 40;
    else if (moonToSubmoonMassRatio > 5) massRatioScore += 30;
    else if (moonToSubmoonMassRatio > 3) massRatioScore += 15;
    
    // Score based on orbital positions (max 30 points)
    let orbitalScore = 0;
    
    if (submoonRadius >= 0.4 && submoonRadius <= 0.6) orbitalScore += 30;
    else if (submoonRadius >= 0.3 && submoonRadius <= 0.7) orbitalScore += 20;
    else if (submoonRadius >= 0.2 && submoonRadius <= 0.8) orbitalScore += 10;
    
    stabilityScore = massRatioScore + orbitalScore;
    
    // Calculate estimated lifetime based on stability score
    let estimatedLifetime = '';
    let stability = '';
    let tidalForces = '';
    
    if (stabilityScore >= 80) {
      estimatedLifetime = '> 100 million years';
      stability = 'High';
      tidalForces = 'Weak';
    } else if (stabilityScore >= 50) {
      estimatedLifetime = '50-100 million years';
      stability = 'Medium';
      tidalForces = 'Moderate';
    } else if (stabilityScore >= 30) {
      estimatedLifetime = '10-50 million years';
      stability = 'Low';
      tidalForces = 'Strong';
    } else {
      estimatedLifetime = '< 10 million years';
      stability = 'Very Low';
      tidalForces = 'Extreme';
    }
    
    // Identify critical parameters that affect stability
    const criticalParams = [];
    
    if (planetToMoonMassRatio > 60) {
      criticalParams.push('Planet/Moon mass ratio too high');
    }
    
    if (moonToSubmoonMassRatio < 5) {
      criticalParams.push('Moon/Submoon mass ratio too low');
    }
    
    if (submoonRadius < 0.3 || submoonRadius > 0.7) {
      criticalParams.push('Submoon orbital position suboptimal');
    }
    
    // Update stats
    setStats({
      stability,
      estimatedLifetime,
      tidalForces,
      orbitRatio: moonOrbitRatio.toFixed(2),
      stabilityScore,
      criticalParams
    });
  };
  
  // Animation function
  const startAnimation = (star, planet, moon, submoon) => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current || !controlsRef.current) return;
    
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    
    // Variables for animation
    let planetAngle = 0;
    let moonAngle = 0;
    let submoonAngle = 0;
    
    // Calculate orbital periods using Kepler's laws
    // For periods: T² ∝ a³/M where a is semimajor axis and M is central mass
    const keplerConstant = 0.005; // Reduced constant for slower visualization

    // Calculate period for planet around star (star is much more massive)
    const planetPeriod = keplerConstant * Math.sqrt(Math.pow(planetRadius, 3));

    // Calculate period for moon around planet
    const moonPeriod = keplerConstant * Math.sqrt(Math.pow(moonRadius * hillRadiusMoon, 3) / planetMass);

    // Calculate period for submoon around moon
    const submoonPeriod = keplerConstant * Math.sqrt(Math.pow(submoonRadius * hillRadiusSubmoon, 3) / moonMass);

    // Convert periods to angular velocities
    const planetSpeed = (2 * Math.PI) / (planetPeriod * 400); // Slower planet
    const moonSpeed = (2 * Math.PI) / (moonPeriod * 300);  // Slower moon
    const submoonSpeed = (2 * Math.PI) / (submoonPeriod * 200); // Slower submoon    

    // Animation loop
    const animate = () => {
      if (controlsRef.current) controlsRef.current.update();
      
      if (isPlaying) {
        // Update angles based on calculated speeds and speed multiplier
        planetAngle += planetSpeed * speedMultiplier;
        moonAngle += moonSpeed * speedMultiplier;
        submoonAngle += submoonSpeed * speedMultiplier;
        
        // Update planet position
        planet.position.x = planetRadius * Math.cos(planetAngle);
        planet.position.z = planetRadius * Math.sin(planetAngle);
        
        // Add slight wobble to planet rotation to simulate axis tilt
        planet.rotation.x = Math.sin(planetAngle * 0.5) * 0.1;
        planet.rotation.y += 0.003 * speedMultiplier;
        
        // Update moon position relative to planet
        const moonOrbitRadius = moonRadius * hillRadiusMoon;
        moon.position.x = planet.position.x + moonOrbitRadius * Math.cos(moonAngle);
        moon.position.z = planet.position.z + moonOrbitRadius * Math.sin(moonAngle);
        moon.rotation.y += 0.005 * speedMultiplier;
        
        // Update submoon position relative to moon
        const submoonOrbitRadius = submoonRadius * hillRadiusSubmoon;
        submoon.position.x = moon.position.x + submoonOrbitRadius * Math.cos(submoonAngle);
        submoon.position.z = moon.position.z + submoonOrbitRadius * Math.sin(submoonAngle);
        submoon.rotation.y += 0.007 * speedMultiplier;
        
        // Update orbital visualizations
        scene.children.forEach(child => {
          // Update moon's orbit position
          if (child.geometry && child.geometry.type === 'RingGeometry' && 
              child.material && child.material.color.getHexString() === 'ecf0f1') {
            child.position.copy(planet.position);
          }
          
          // Update submoon's orbit position
          if (child.geometry && child.geometry.type === 'RingGeometry' && 
              child.material && child.material.color.getHexString() === 'e74c3c') {
            child.position.copy(moon.position);
          }
          
          // Update Hill sphere and stability zone visualizations
          if (child.geometry && child.geometry.type === 'SphereGeometry' && 
              child.material && child.material.wireframe) {
            if (child.material.color.getHexString() === '3498db') {
              child.position.copy(planet.position);
            } else if (child.material.color.getHexString() === 'e74c3c') {
              child.position.copy(moon.position);
            }
          }
          
          // Update optimal orbit zones
          if (child.geometry && child.geometry.type === 'RingGeometry' && 
              child.material && child.material.color.getHexString() === '2ecc71') {
            if (child.scale.x > 2) { // Planet's optimal zone
              child.position.copy(planet.position);
            } else { // Moon's optimal zone
              child.position.copy(moon.position);
            }
          }
        });
      }
      
      // Update camera position based on view mode
      if (viewMode === 'topDown') {
        // Top-down view
        camera.position.set(0, 150, 0);  // Increased height for better overview
        camera.lookAt(0, 0, 0);
        controls.enabled = false;
      } else if (viewMode === 'planet') {
        // Follow planet view
        const offset = new THREE.Vector3(40, 25, 40);  // Increased distance
        camera.position.set(
          planet.position.x + offset.x,
          offset.y,
          planet.position.z + offset.z
        );
        camera.lookAt(planet.position);
        controls.enabled = false;
      } else if (viewMode === 'moon') {
        // Follow moon view
        const offset = new THREE.Vector3(10, 6, 10);  // Increased distance
        camera.position.set(
          moon.position.x + offset.x,
          moon.position.y + offset.y,
          moon.position.z + offset.z
        );
        camera.lookAt(moon.position);
        controls.enabled = false;
      } else if (viewMode === 'educational') {
        // Educational view that keeps system in perspective
        const radius = 120;  // Increased radius
        const angle = planetAngle * 0.1;
        camera.position.set(
          radius * Math.cos(angle),
          60,  // Higher viewpoint
          radius * Math.sin(angle)
        );
        camera.lookAt(0, 0, 0);
        controls.enabled = false;
      } else {
        // Standard (free) view
        controls.enabled = true;
      }

      // Force camera update to ensure the changes take effect immediately
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);  // Additional render call to refresh view
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animate();
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4 overflow-hidden" style={{ height: '450px' }}>
        <div ref={containerRef} className="w-full h-full relative">
          {/* Information overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm z-10">
            <h3 className="text-lg font-bold mb-2">System Stability Analysis</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Stability:</div>
              <div className={`font-bold ${
                stats.stability === 'High' ? 'text-green-400' : 
                stats.stability === 'Medium' ? 'text-yellow-400' : 
                stats.stability === 'Low' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {stats.stability}
              </div>
              
              <div>Estimated Lifetime:</div>
              <div className="font-bold">{stats.estimatedLifetime}</div>
              
              <div>Tidal Forces:</div>
              <div className="font-bold">{stats.tidalForces}</div>
              
              <div>Planet/Moon Mass Ratio:</div>
              <div className={`font-bold ${planetToMoonRatio < 60 ? 'text-green-400' : 'text-red-400'}`}>
                {planetToMoonRatio.toFixed(1)}:1
              </div>
              
              <div>Moon/Submoon Mass Ratio:</div>
              <div className={`font-bold ${moonToSubmoonRatio > 5 ? 'text-green-400' : 'text-red-400'}`}>
                {moonToSubmoonRatio.toFixed(1)}:1
              </div>
              
              <div>Submoon Orbital Position:</div>
              <div className={`font-bold ${
                submoonRadius >= 0.4 && submoonRadius <= 0.6 ? 'text-green-400' : 
                submoonRadius >= 0.3 && submoonRadius <= 0.7 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {submoonRadius.toFixed(1)} Hill radii
              </div>
              
              <div>Stability Score:</div>
              <div className={`font-bold ${
                stats.stabilityScore >= 80 ? 'text-green-400' : 
                stats.stabilityScore >= 50 ? 'text-yellow-400' : 
                stats.stabilityScore >= 30 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {stats.stabilityScore}/100
              </div>
            </div>
            
            {stats.criticalParams.length > 0 && (
              <div className="mt-3 p-2 bg-red-900 bg-opacity-50 rounded">
                <h4 className="font-bold text-xs uppercase mb-1">Critical Issues:</h4>
                <ul className="text-xs">
                  {stats.criticalParams.map((param, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-red-400 mr-1">•</span> {param}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Controls */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* System parameters */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-2">System Parameters</h3>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Planet Mass: {planetMass} M<sub>jup</sub></span>
                <span className="text-blue-400">Jupiter = 1</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={planetMass}
                onChange={(e) => setPlanetMass(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Moon Mass: {moonMass} M<sub>jup</sub></span>
                <span className={`${planetToMoonRatio < 60 ? 'text-green-400' : 'text-red-400'}`}>
                  {planetToMoonRatio < 60 ? '✓ Optimal Ratio' : '✗ Too small'}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={moonMass}
                onChange={(e) => setMoonMass(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Submoon Mass: {submoonMass} M<sub>jup</sub></span>
                <span className={`${moonToSubmoonRatio > 5 ? 'text-green-400' : 'text-red-400'}`}>
                  {moonToSubmoonRatio > 5 ? '✓ Optimal Ratio' : '✗ Too large'}
                </span>
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={submoonMass}
                onChange={(e) => setSubmoonMass(Number(e.target.value))}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="mt-3 p-2 bg-gray-700 rounded">
              <p className="text-xs text-gray-300">
                <span className="text-blue-400 font-bold">Research Finding:</span> Planet to moon mass ratio should be &lt;60 for optimal stability. Current: {planetToMoonRatio.toFixed(1)}
              </p>
            </div>
          </div>
          
          {/* Orbital parameters */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-2">Orbital Parameters</h3>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm">Planet Orbital Radius: {planetRadius} AU</label>
              <input
                type="range"
                min="10"
                max="30"
                value={planetRadius}
                onChange={(e) => setPlanetRadius(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Moon Orbital Position: {moonRadius} Hill radii</span>
                <span className="text-blue-400">Hill radius: boundary of gravitational influence</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={moonRadius}
                onChange={(e) => setMoonRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Submoon Orbital Position: {submoonRadius} Hill radii</span>
                <span className={`${
                  submoonRadius >= 0.4 && submoonRadius <= 0.6 ? 'text-green-400' : 
                  submoonRadius >= 0.3 && submoonRadius <= 0.7 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {submoonRadius >= 0.4 && submoonRadius <= 0.6 ? '✓ Optimal Zone' : 'Suboptimal'}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={submoonRadius}
                onChange={(e) => setSubmoonRadius(Number(e.target.value))}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="mt-3 p-2 bg-gray-700 rounded">
              <p className="text-xs text-gray-300">
                <span className="text-blue-400 font-bold">Research Finding:</span> Submoons are most stable at 0.4-0.6 Hill radii from their parent moon. Current: {submoonRadius.toFixed(1)}
              </p>
            </div>
          </div>
          
          {/* Simulation controls */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-2">Simulation Controls</h3>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1 flex items-center justify-center"
              >
                {isPlaying ? <><i className="fas fa-pause mr-2"></i> Pause</> : <><i className="fas fa-play mr-2"></i> Play</>}
              </button>
              
              <button 
                onClick={() => setShowOrbits(!showOrbits)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex-1 flex items-center justify-center"
              >
                {showOrbits ? <><i className="fas fa-eye-slash mr-2"></i> Hide Orbits</> : <><i className="fas fa-eye mr-2"></i> Show Orbits</>}
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowStabilityZones(!showStabilityZones)}
                className={`px-4 py-2 ${showStabilityZones ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-lg flex-1 flex items-center justify-center`}
              >
                {showStabilityZones ? <><i className="fas fa-chart-area mr-2"></i> Hide Stability Zones</> : <><i className="fas fa-chart-area mr-2"></i> Show Stability Zones</>}
              </button>
            </div>
            
            <div className="space-y-1 mt-2">
              <label className="text-gray-300 text-sm">Simulation Speed: {speedMultiplier}x</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm">View Mode:</label>
              <div className="grid grid-cols-3 gap-1">
                {['standard', 'topDown', 'planet', 'moon', 'educational'].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-1 rounded-lg text-xs ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {mode === 'standard' ? 'Free' : 
                     mode === 'topDown' ? 'Top Down' :
                     mode === 'planet' ? 'Planet View' : 
                     mode === 'moon' ? 'Moon View' : 'Educational'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              <label className="text-gray-300 text-sm">Preset Configurations:</label>
              <div className="grid grid-cols-3 gap-1">
                {['optimal', 'unstable', 'custom'].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setPresetMode(mode)}
                    className={`px-2 py-1 rounded-lg text-xs ${presetMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {mode === 'optimal' ? 'Optimal' : 
                     mode === 'unstable' ? 'Unstable' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Research explanation */}
      <div className="bg-gray-800 rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">About Exosubmoon Stability Research</h3>
        <p className="text-gray-300 mb-3">
          This interactive simulation demonstrates the findings from our research on exosubmoon stability conditions. The visualization accurately represents the critical parameters that determine whether a submoon (moon of a moon) can maintain a stable orbit for astronomical timescales.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-blue-400 mb-1">Key Stability Factors:</h4>
            <ul className="list-disc list-inside text-gray-300 text-sm">
              <li><span className="text-white font-medium">Mass ratios:</span> Low planet-to-moon mass ratio (&lt;60) dramatically increases submoon stability</li>
              <li><span className="text-white font-medium">Minimal tidal effects:</span> Moon-to-submoon mass ratio must be high (&gt;5) to prevent rapid orbital decay</li>
              <li><span className="text-white font-medium">Orbital distance:</span> Submoons in the "goldilocks zone" (0.4-0.6 Hill radii) have greatest longevity</li>
              <li><span className="text-white font-medium">Low eccentricity:</span> Circular orbits prevent destabilizing resonances</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-blue-400 mb-1">Research Methodology:</h4>
            <ul className="list-disc list-inside text-gray-300 text-sm">
              <li>N-body gravitational simulations tracking submoon evolution over 10⁸ years</li>
              <li>Analysis of tidal forces using realistic celestial body parameters</li>
              <li>Testing against 5,000+ known exoplanetary systems from NASA database</li>
              <li>Identification of stable parameter spaces through simulated annealing optimization</li>
              <li>Cross-validation with existing theoretical models of satellite stability</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
          <h4 className="font-bold text-blue-400 text-sm uppercase">Key Research Finding:</h4>
          <p className="text-gray-300 text-sm mt-1">
            Our research demonstrates that exosubmoons can remain stable for periods exceeding 100 million years under specific conditions. This challenges previous assumptions about submoon instability and opens new possibilities for habitable environments in exoplanetary systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExoSubmoonVisualization;