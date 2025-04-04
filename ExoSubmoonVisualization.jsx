import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ExoSubmoonVisualization = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [viewMode, setViewMode] = useState('standard'); // standard, topDown, planet, moon
  
  // System parameters
  const [planetMass, setPlanetMass] = useState(28);
  const [moonMass, setMoonMass] = useState(0.5);
  const [submoonMass, setSubmoonMass] = useState(0.05);
  const [planetRadius, setPlanetRadius] = useState(20);
  const [moonRadius, setMoonRadius] = useState(3);
  const [submoonRadius, setSubmoonRadius] = useState(0.8);
  
  // Stats
  const [stats, setStats] = useState({
    stability: 'High',
    estimatedLifetime: '> 100 million years',
    tidalForces: 'Moderate',
    orbitRatio: ''
  });
  
  useEffect(() => {
    // Initialize the visualization
    const container = containerRef.current;
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    
    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Create Star (central body)
    const starGeometry = new THREE.SphereGeometry(5, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(star);
    
    // Add Point Light to simulate star's light
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 0, 0);
    scene.add(light);
    
    // Create Planet
    const planetGeometry = new THREE.SphereGeometry(2, 32, 32);
    const planetMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3498db,
      specular: 0x333333,
      shininess: 10
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(20, 0, 0);
    scene.add(planet);
    
    // Create Moon
    const moonGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xecf0f1,
      specular: 0x333333,
      shininess: 5
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(23, 0, 0);
    scene.add(moon);
    
    // Create Submoon
    const submoonGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const submoonMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe74c3c,
      specular: 0x333333,
      shininess: 5
    });
    const submoon = new THREE.Mesh(submoonGeometry, submoonMaterial);
    submoon.position.set(23.8, 0, 0);
    scene.add(submoon);
    
    // Create Orbits
    const planetOrbitGeometry = new THREE.RingGeometry(20, 20.1, 64);
    const planetOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });
    const planetOrbit = new THREE.Mesh(planetOrbitGeometry, planetOrbitMaterial);
    planetOrbit.rotation.x = Math.PI / 2;
    scene.add(planetOrbit);
    
    const moonOrbitGeometry = new THREE.RingGeometry(3, 3.05, 64);
    const moonOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });
    const moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
    moonOrbit.rotation.x = Math.PI / 2;
    scene.add(moonOrbit);
    
    const submoonOrbitGeometry = new THREE.RingGeometry(0.8, 0.82, 64);
    const submoonOrbitMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });
    const submoonOrbit = new THREE.Mesh(submoonOrbitGeometry, submoonOrbitMaterial);
    submoonOrbit.rotation.x = Math.PI / 2;
    scene.add(submoonOrbit);
    
    // Set initial camera position
    camera.position.z = 40;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);
    
    // Variables for animation
    let planetAngle = 0;
    let moonAngle = 0;
    let submoonAngle = 0;
    
    // Initialize parameters
    let planetSpeed = 0.002;
    let moonSpeed = 0.006;
    let submoonSpeed = 0.01;
    
    // Animation function
    const animate = () => {
      if (!isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
        return;
      }
      
      // Update angles
      planetAngle += planetSpeed * speedMultiplier;
      moonAngle += moonSpeed * speedMultiplier;
      submoonAngle += submoonSpeed * speedMultiplier;
      
      // Update positions
      planet.position.x = planetRadius * Math.cos(planetAngle);
      planet.position.z = planetRadius * Math.sin(planetAngle);
      
      // Update moon orbit position
      moonOrbit.position.x = planet.position.x;
      moonOrbit.position.z = planet.position.z;
      
      // Update moon position relative to planet
      moon.position.x = planet.position.x + moonRadius * Math.cos(moonAngle);
      moon.position.z = planet.position.z + moonRadius * Math.sin(moonAngle);
      
      // Update submoon orbit position
      submoonOrbit.position.x = moon.position.x;
      submoonOrbit.position.z = moon.position.z;
      
      // Update submoon position relative to moon
      submoon.position.x = moon.position.x + submoonRadius * Math.cos(submoonAngle);
      submoon.position.z = moon.position.z + submoonRadius * Math.sin(submoonAngle);
      
      // Update orbit visibility based on state
      planetOrbit.visible = showOrbits;
      moonOrbit.visible = showOrbits;
      submoonOrbit.visible = showOrbits;
      
      // Update camera position based on view mode
      if (viewMode === 'topDown') {
        camera.position.set(0, 40, 0);
        camera.lookAt(0, 0, 0);
      } else if (viewMode === 'planet') {
        const offset = new THREE.Vector3(0, 5, 15);
        camera.position.set(
          planet.position.x + offset.x,
          planet.position.y + offset.y,
          planet.position.z + offset.z
        );
        camera.lookAt(planet.position);
      } else if (viewMode === 'moon') {
        const offset = new THREE.Vector3(0, 2, 5);
        camera.position.set(
          moon.position.x + offset.x,
          moon.position.y + offset.y,
          moon.position.z + offset.z
        );
        camera.lookAt(moon.position);
      }
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Handle window resize
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
    };
  }, [isPlaying, speedMultiplier, showOrbits, viewMode]);
  
  // Update object scales and speeds when parameters change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    
    // Find objects in the scene
    const planet = scene.children.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.material.color.getHexString() === '3498db');
    const moon = scene.children.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.material.color.getHexString() === 'ecf0f1');
    const submoon = scene.children.find(obj => obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.material.color.getHexString() === 'e74c3c');
    
    if (planet && moon && submoon) {
      // Scale objects based on mass
      planet.scale.set(planetMass/20, planetMass/20, planetMass/20);
      moon.scale.set(moonMass, moonMass, moonMass);
      submoon.scale.set(submoonMass*5, submoonMass*5, submoonMass*5);
      
      // Calculate and update system stability metrics
      const planetToMoonRatio = planetMass / moonMass;
      const moonToSubmoonRatio = moonMass / submoonMass;
      const orbitRatio = moonRadius / planetRadius;
      
      let stability = 'Low';
      let lifetime = '< 10 million years';
      let tidalForces = 'Strong';
      
      if (moonToSubmoonRatio > 5 && planetToMoonRatio < 60) {
        stability = 'High';
        lifetime = '> 100 million years';
        tidalForces = 'Weak';
      } else if (moonToSubmoonRatio > 3 && planetToMoonRatio < 80) {
        stability = 'Medium';
        lifetime = '~ 50 million years';
        tidalForces = 'Moderate';
      }
      
      setStats({
        stability,
        estimatedLifetime: lifetime,
        tidalForces,
        orbitRatio: orbitRatio.toFixed(2)
      });
    }
  }, [planetMass, moonMass, submoonMass, planetRadius, moonRadius, submoonRadius]);
  
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4 overflow-hidden" style={{ height: '450px' }}>
        <div ref={containerRef} className="w-full h-full relative">
          {/* Information overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm z-10">
            <h3 className="text-lg font-bold mb-2">System Statistics</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Stability:</div>
              <div className={`font-bold ${stats.stability === 'High' ? 'text-green-400' : stats.stability === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats.stability}
              </div>
              
              <div>Estimated Lifetime:</div>
              <div className="font-bold">{stats.estimatedLifetime}</div>
              
              <div>Tidal Forces:</div>
              <div className="font-bold">{stats.tidalForces}</div>
              
              <div>Moon/Planet Orbit Ratio:</div>
              <div className="font-bold">{stats.orbitRatio}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
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
                <span className="text-gray-400">Ganymede ≈ 0.025</span>
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
                <span className="text-red-400">Earth ≈ 0.003</span>
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
              <label className="text-gray-300 text-sm">Moon Orbital Radius: {moonRadius} R<sub>Hill</sub></label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={moonRadius}
                onChange={(e) => setMoonRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-gray-300 text-sm">Submoon Orbital Radius: {submoonRadius} R<sub>Hill</sub></label>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.05"
                value={submoonRadius}
                onChange={(e) => setSubmoonRadius(Number(e.target.value))}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          {/* Simulation controls */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-2">Simulation Controls</h3>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-1"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button 
                onClick={() => setShowOrbits(!showOrbits)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex-1"
              >
                {showOrbits ? 'Hide Orbits' : 'Show Orbits'}
              </button>
            </div>
            
            <div className="space-y-1">
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
              <div className="grid grid-cols-4 gap-1">
                {['standard', 'topDown', 'planet', 'moon'].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-1 rounded-lg text-sm ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {mode === 'standard' ? 'Default' : 
                     mode === 'topDown' ? 'Top Down' :
                     mode === 'planet' ? 'Planet View' : 'Moon View'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Research explanation */}
      <div className="bg-gray-800 rounded-lg p-4 text-white">
        <h3 className="text-lg font-bold mb-2">About Exosubmoons</h3>
        <p className="text-gray-300 mb-3">
          This interactive simulation demonstrates the conditions required for exosubmoons (moons of exomoons) to maintain stable orbits. Research suggests that specific mass ratios and orbital configurations can allow submoons to survive for over 100 million years.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-blue-400 mb-1">Key Stability Factors:</h4>
            <ul className="list-disc list-inside text-gray-300 text-sm">
              <li>Low planet-to-moon mass ratio increases submoon stability</li>
              <li>Submoons with low mass have greater lifetimes</li>
              <li>Greater orbital distance from the parent moon provides more space for inward evolution</li>
              <li>Tidal forces significantly impact long-term stability</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-blue-400 mb-1">Optimal Configuration:</h4>
            <ul className="list-disc list-inside text-gray-300 text-sm">
              <li>Planet/Moon mass ratio: &lt; 60</li>
              <li>Moon/Submoon mass ratio: &gt; 5</li>
              <li>Submoon orbital radius: 0.4-0.6 Hill radii</li>
              <li>Low eccentricity orbits for all bodies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExoSubmoonVisualization;