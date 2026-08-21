import { useState, useRef, useEffect, useCallback } from 'react';

export default function Interactive3DCard({
  children,
  className = '',
  style = {},
  maxTilt = 14,
  depth = 25,
  glareColor = 'rgba(255, 255, 255, 0.45)',
  shadowColor = 'rgba(15, 23, 42, 0.15)',
  enableBorderGlow = true,
  enableGyroscope = true,
  enableHaptics = true,
  onHover,
  onClick,
}) {
  const cardRef = useRef(null);
  const animFrameRef = useRef(null);
  const hasTriggeredHaptic = useRef(false);

  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [boxShadow, setBoxShadow] = useState('0 15px 35px rgba(15, 23, 42, 0.08)');
  const [cursorAngle, setCursorAngle] = useState(135);
  const [isFocused, setIsFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check WCAG prefers-reduced-motion preference for accessibility compliance
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const updateCardTilt = useCallback((clientX, clientY) => {
    if (!cardRef.current || reducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    const rotateX = (dy / centerY) * -maxTilt; // tilt up/down
    const rotateY = (dx / centerX) * maxTilt;  // tilt left/right

    const angleDeg = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;

    const shadowX = (-rotateY * 1.5).toFixed(1);
    const shadowY = (Math.abs(rotateX) + 15).toFixed(1);

    // Haptic feedback trigger on initial enter (if supported by device)
    if (enableHaptics && !hasTriggeredHaptic.current && navigator.vibrate) {
      navigator.vibrate(8);
      hasTriggeredHaptic.current = true;
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    animFrameRef.current = requestAnimationFrame(() => {
      setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
      setBoxShadow(`${shadowX}px ${shadowY}px 35px ${shadowColor}`);
      setCursorAngle(Math.round(angleDeg));
      setGlarePos({
        x: ((x / rect.width) * 100).toFixed(1),
        y: ((y / rect.height) * 100).toFixed(1),
        opacity: 0.35,
      });
    });
  }, [maxTilt, shadowColor, reducedMotion, enableHaptics]);

  const handleMouseMove = (e) => {
    updateCardTilt(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateCardTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseEnter = () => {
    if (onHover) onHover(true);
  };

  const resetCard = () => {
    hasTriggeredHaptic.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (onHover) onHover(false);

    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setBoxShadow('0 15px 35px rgba(15, 23, 42, 0.08)');
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  // Keyboard accessibility focus states (a11y)
  const handleFocus = () => {
    setIsFocused(true);
    if (!reducedMotion) {
      setTransform('perspective(1000px) rotateX(4deg) rotateY(0deg) scale3d(1.03, 1.03, 1.03)');
      setBoxShadow('0 20px 40px rgba(99, 102, 241, 0.25)');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    resetCard();
  };

  // Gyroscope tilt handling for mobile devices
  useEffect(() => {
    if (!enableGyroscope || reducedMotion) return;

    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null && cardRef.current) {
        const tiltX = Math.max(-maxTilt, Math.min(maxTilt, e.beta / 3));
        const tiltY = Math.max(-maxTilt, Math.min(maxTilt, e.gamma / 3));

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
          setTransform(`perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`);
        });
      }
    };

    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [enableGyroscope, maxTilt, reducedMotion]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={resetCard}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetCard}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={onClick}
      role="region"
      aria-label="Interactive 3D Card"
      className={`interactive-3d-card ${isFocused ? 'keyboard-focused' : ''} ${className}`}
      style={{
        transform,
        boxShadow,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease, border-color 0.2s ease',
        transformStyle: 'preserve-3d',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform, box-shadow',
        borderRadius: 'inherit',
        outline: isFocused ? '2px solid #6366f1' : 'none',
        outlineOffset: '4px',
        ...style,
      }}
    >
      {/* Vercel/Stripe Style Animated Border Glow Following Cursor */}
      {enableBorderGlow && (
        <div
          className="border-glow-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1.5px',
            background: `linear-gradient(${cursorAngle}deg, rgba(255, 107, 53, 0.8) 0%, rgba(99, 102, 241, 0.8) 50%, rgba(16, 185, 129, 0) 100%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            opacity: glarePos.opacity ? 0.9 : 0.2,
            transition: 'opacity 0.25s ease',
            zIndex: 12,
          }}
        />
      )}

      {/* 3D Specular Glare Reflection */}
      <div
        className="card-glare-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor} 0%, rgba(255, 255, 255, 0) 70%)`,
          opacity: glarePos.opacity,
          transition: 'opacity 0.2s ease',
          zIndex: 10,
        }}
      />

      {/* Elevated 3D Content Container */}
      <div style={{ transform: `translateZ(${depth}px)`, transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}
