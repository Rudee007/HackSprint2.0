import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const AnimatedBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Living fluid particles
    const particleCount = 150;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    let time = 0;

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      colors[i * 3] = 0.2 + Math.random() * 0.6;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 2] = 0.4 + Math.random() * 0.4;

      sizes[i] = Math.random() * 0.3 + 0.1;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = customColor;
          vec3 pos = position;
          pos.x += sin(time * 0.5 + position.y * 0.1) * 2.0;
          pos.y += cos(time * 0.3 + position.x * 0.1) * 1.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z) * (1.0 + sin(time * 2.0) * 0.3);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, r);
          float pulse = sin(time * 3.0) * 0.3 + 0.7;
          gl_FragColor = vec4(vColor, alpha * 0.8 * pulse);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    camera.position.z = 12;

    const animate = () => {
      requestAnimationFrame(animate);

      time += 0.016;
      particleMaterial.uniforms.time.value = time;

      const positions = particleSystem.geometry.attributes.position.array;
      const colors = particleSystem.geometry.attributes.customColor.array;

      for (let i = 0; i < particleCount; i++) {
        colors[i * 3 + 1] = 0.6 + Math.sin(time * 2 + i) * 0.4;
      }

      particleSystem.geometry.attributes.customColor.needsUpdate = true;
      particleSystem.rotation.y += 0.001;

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* ECG Heartbeat Line */}
      <motion.svg
        className="fixed top-1/2 left-0 w-full h-32 pointer-events-none z-10 opacity-20"
        viewBox="0 0 1200 100"
      >
        <motion.path
          d="M0,50 L200,50 L220,30 L240,70 L260,20 L280,80 L300,50 L1200,50"
          stroke="#10b981"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 2
          }}
        />
      </motion.svg>

      {/* Floating Medical Icons */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-8 h-8 opacity-10 pointer-events-none z-10"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        >
          <div className="w-full h-full bg-emerald-400 rounded-full" />
        </motion.div>
      ))}

      {/* DNA Helix */}
      <motion.svg
        className="fixed right-10 top-1/4 w-16 h-32 opacity-15 pointer-events-none z-10"
        viewBox="0 0 60 120"
      >
        <motion.path
          d="M10,10 Q30,30 10,50 Q30,70 10,90 Q30,110 10,130"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          animate={{ pathLength: [0, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          d="M50,10 Q30,30 50,50 Q30,70 50,90 Q30,110 50,130"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          animate={{ pathLength: [1, 0], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.svg>

      {/* Pulse Rings */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="fixed w-32 h-32 border-2 border-teal-400 rounded-full opacity-20 pointer-events-none z-10"
          style={{
            left: `${70 + i * 5}%`,
            top: `${60 + i * 10}%`
          }}
          animate={{
            scale: [0.5, 1.5, 0.5],
            opacity: [0.4, 0.1, 0.4]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.3
          }}
        />
      ))}

      {/* Network Connections */}
      <motion.svg
        className="fixed bottom-20 left-10 w-40 h-40 opacity-10 pointer-events-none z-10"
        viewBox="0 0 100 100"
      >
        {[...Array(4)].map((_, i) => (
          <motion.line
            key={i}
            x1={20 + i * 20}
            y1={20}
            x2={20 + i * 20}
            y2={80}
            stroke="#6366f1"
            strokeWidth="1"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={20 + i * 20}
            cy={50}
            r="3"
            fill="#6366f1"
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </motion.svg>

      {/* Left Side Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`left-${i}`}
          className="fixed w-6 h-6 opacity-15 pointer-events-none z-10"
          style={{
            left: `${5 + (i % 3) * 8}%`,
            top: `${15 + i * 10}%`
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
            scale: [0.6, 1.2, 0.6]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8
          }}
        >
          <div className="w-full h-full bg-cyan-400 rounded-full" />
        </motion.div>
      ))}

      {/* Left Side Vertical Lines */}
      <motion.svg
        className="fixed left-5 top-1/4 w-8 h-64 opacity-10 pointer-events-none z-10"
        viewBox="0 0 20 200"
      >
        {[...Array(3)].map((_, i) => (
          <motion.line
            key={`vline-${i}`}
            x1={5 + i * 5}
            y1={0}
            x2={5 + i * 5}
            y2={200}
            stroke="#22d3ee"
            strokeWidth="1"
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1
            }}
          />
        ))}
      </motion.svg>

      {/* Bottom-Left Corner Elements */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`bottom-left-${i}`}
          className="fixed w-4 h-4 opacity-20 pointer-events-none z-10"
          style={{
            left: `${2 + i * 4}%`,
            bottom: `${5 + i * 8}%`
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.4, 0.8],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.6
          }}
        >
          <div className="w-full h-full bg-emerald-400 rounded-full" />
        </motion.div>
      ))}

      {/* Bottom-Left Wave Pattern */}
      <motion.svg
        className="fixed bottom-10 left-2 w-32 h-16 opacity-15 pointer-events-none z-10"
        viewBox="0 0 100 40"
      >
        <motion.path
          d="M0,20 Q25,5 50,20 T100,20"
          stroke="#10b981"
          strokeWidth="2"
          fill="none"
          animate={{ pathLength: [0, 1, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.svg>

      {/* Top-Right Corner Elements */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`top-right-${i}`}
          className="fixed w-5 h-5 opacity-18 pointer-events-none z-10"
          style={{
            right: `${3 + i * 5}%`,
            top: `${8 + i * 6}%`
          }}
          animate={{
            y: [-10, 10, -10],
            rotate: [0, -180, 0],
            scale: [0.7, 1.3, 0.7]
          }}
          transition={{
            duration: 5 + i * 0.7,
            repeat: Infinity,
            delay: i * 0.4
          }}
        >
          <div className="w-full h-full bg-blue-400 rounded-full" />
        </motion.div>
      ))}

      {/* Top-Right Spiral */}
      <motion.svg
        className="fixed top-12 right-8 w-24 h-24 opacity-12 pointer-events-none z-10"
        viewBox="0 0 60 60"
      >
        <motion.circle
          cx="30"
          cy="30"
          r="20"
          stroke="#3b82f6"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5,5"
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.svg>
    </>
  );
};

export default AnimatedBackground;