// ResearchShowcase.jsx
import React from 'react';
import ExoSubmoonVisualization from './ExoSubmoonVisualization';

const ResearchShowcase = () => {
  return (
    <section id="research-showcase" className="research-showcase">
      <div className="stars-bg"></div>
      <div className="container">
        <div className="section-title">
          <h2>Research Showcase</h2>
        </div>
        <p className="subtitle">Explore interactive demonstrations of my research work and scientific findings</p>
        
        <div className="showcase-intro">
          <h3>Exosubmoon Stability Simulation</h3>
          <p className="showcase-description">
            Can moons have their own moons? This interactive simulation explores the conditions required 
            for exosubmoons to maintain stable orbits over extended periods. Adjust parameters to test 
            different configurations and see how they affect long-term stability.
          </p>
          
          <div className="research-badges">
            <span className="research-badge">Astronomy</span>
            <span className="research-badge">Orbital Dynamics</span>
            <span className="research-badge">3D Simulation</span>
          </div>
        </div>
        
        <div className="simulation-container">
          <ExoSubmoonVisualization />
        </div>
        
        <div className="research-details">
          <div className="research-detail-grid">
            <div className="research-detail-card">
              <div className="detail-icon">
                <i className="fas fa-flask"></i>
              </div>
              <h4>Research Question</h4>
              <p>Under what conditions can submoons maintain stable orbits around exomoons for periods exceeding 100 million years?</p>
            </div>
            
            <div className="research-detail-card">
              <div className="detail-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h4>Methodology</h4>
              <p>High-performance simulations on Google Cloud (Vertex AI) analyzing tidal effects on orbital dynamics with NASA exoplanet datasets.</p>
            </div>
            
            <div className="research-detail-card">
              <div className="detail-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h4>Key Findings</h4>
              <p>Specific mass ratios between planet-moon-submoon systems and orbital configurations can create stable environments for submoons.</p>
            </div>
            
            <div className="research-detail-card">
              <div className="detail-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <h4>Impact</h4>
              <p>Contributes to our understanding of complex orbital systems and expands possibilities for habitable environments in exoplanetary systems.</p>
            </div>
          </div>
          
          <div className="research-paper">
            <h4>Research Paper</h4>
            <div className="paper-preview">
              <div className="paper-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="paper-details">
                <h5>Can Moons Have Moons? Stability Analysis of Exosubmoons</h5>
                <p className="paper-authors">Apoorv Belgundi, et al.</p>
                <p className="paper-date">2023</p>
                <a href="#" className="btn btn-outline btn-sm">Download Paper</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchShowcase;