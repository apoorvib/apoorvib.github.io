// Enhanced Exosubmoon Simulation
// Save this as exosubmoon-simulation.js and include it in your HTML

function initEnhancedSimulation() {
    const container = document.getElementById('simulation-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = ''; // Clear existing content
    container.appendChild(renderer.domElement);
    
    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    // Create Star
    const starGeometry = new THREE.SphereGeometry(5, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
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
    
    const submoonOrbitGeometry = new THREE.RingGeometry(0.8, 0.82, 64);
    const submoonOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });
    const submoonOrbit = new THREE.Mesh(submoonOrbitGeometry, submoonOrbitMaterial);
    submoonOrbit.rotation.x = Math.PI / 2;
    
    scene.add(moonOrbit);
    scene.add(submoonOrbit);
    
    // Set camera position
    camera.position.z = 40;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);
    
    // Add orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    
    // Variables for animation
    let planetAngle = 0;
    let moonAngle = 0;
    let submoonAngle = 0;
    
    // Parameters (can be updated by sliders)
    let planetMass = 28;
    let moonMass = 0.5;
    let submoonMass = 0.05;
    let planetRadius = 20;
    let moonRadius = 3;
    let submoonRadius = 0.8;
    
    // Get slider elements
    const planetMassSlider = document.getElementById('planet-mass');
    const moonMassSlider = document.getElementById('moon-mass');
    const submoonMassSlider = document.getElementById('submoon-mass');
    
    // Add stabilityInfo div for displaying system stability
    const stabilityInfo = document.createElement('div');
    stabilityInfo.className = 'stability-info';
    stabilityInfo.innerHTML = `
        <h4>System Stability</h4>
        <div class="stability-indicator high">High</div>
        <p>Estimated lifetime: >100 million years</p>
    `;
    container.appendChild(stabilityInfo);
    
    // Style the stability info
    const style = document.createElement('style');
    style.innerHTML = `
        .stability-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        .stability-info h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
        }
        .stability-indicator {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .stability-indicator.high {
            background-color: #2ecc71;
        }
        .stability-indicator.medium {
            background-color: #f39c12;
        }
        .stability-indicator.low {
            background-color: #e74c3c;
        }
    `;
    document.head.appendChild(style);
    
    // Update the stability info based on system parameters
    function updateStabilityInfo() {
        const planetToMoonRatio = planetMass / moonMass;
        const moonToSubmoonRatio = moonMass / submoonMass;
        
        let stability = 'Low';
        let lifetime = '< 10 million years';
        let indicatorClass = 'low';
        
        if (moonToSubmoonRatio > 5 && planetToMoonRatio < 60) {
            stability = 'High';
            lifetime = '> 100 million years';
            indicatorClass = 'high';
        } else if (moonToSubmoonRatio > 3 && planetToMoonRatio < 80) {
            stability = 'Medium';
            lifetime = '~ 50 million years';
            indicatorClass = 'medium';
        }
        
        stabilityInfo.innerHTML = `
            <h4>System Stability</h4>
            <div class="stability-indicator ${indicatorClass}">${stability}</div>
            <p>Estimated lifetime: ${lifetime}</p>
            <p>P/M ratio: ${planetToMoonRatio.toFixed(1)}</p>
            <p>M/S ratio: ${moonToSubmoonRatio.toFixed(1)}</p>
        `;
    }
    
    // Update parameters on slider change
    planetMassSlider.addEventListener('input', function() {
        planetMass = parseFloat(this.value);
        updateOrbitalParameters();
    });
    
    moonMassSlider.addEventListener('input', function() {
        moonMass = parseFloat(this.value);
        updateOrbitalParameters();
    });
    
    submoonMassSlider.addEventListener('input', function() {
        submoonMass = parseFloat(this.value);
        updateOrbitalParameters();
    });
    
    function updateOrbitalParameters() {
        // Scale visual elements based on mass
        planet.scale.set(planetMass/20, planetMass/20, planetMass/20);
        moon.scale.set(moonMass, moonMass, moonMass);
        submoon.scale.set(submoonMass*5, submoonMass*5, submoonMass*5);
        
        // Update orbital speeds based on masses (simplified physics)
        planetSpeed = 0.002 * Math.sqrt(1/planetMass);
        moonSpeed = 0.006 * Math.sqrt(planetMass/moonMass);
        submoonSpeed = 0.01 * Math.sqrt(moonMass/submoonMass);
        
        // Update the stability info
        updateStabilityInfo();
    }
    
    // Initialize parameters
    let planetSpeed = 0.002;
    let moonSpeed = 0.006;
    let submoonSpeed = 0.01;
    updateOrbitalParameters();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update angles
        planetAngle += planetSpeed;
        moonAngle += moonSpeed;
        submoonAngle += submoonSpeed;
        
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
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
    
    animate();
}

// Call this function after the page has loaded
document.addEventListener('DOMContentLoaded', function() {
    initEnhancedSimulation();
});