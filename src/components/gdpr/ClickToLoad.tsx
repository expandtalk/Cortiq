import React from 'react';

interface ClickToLoadProps {
  category: 'functional' | 'marketing' | 'analytics';
  src: string;
  title: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  allowFullscreen?: boolean;
  children?: React.ReactNode;
}

export function ClickToLoad({
  category,
  src,
  title,
  width = '100%',
  height = '400px',
  className = '',
  allowFullscreen = false,
  children
}: ClickToLoadProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [hasConsent, setHasConsent] = React.useState(false);

  React.useEffect(() => {
    // Check if user has consent for this category
    const checkConsent = () => {
      try {
        const stored = localStorage.getItem('heatmap_consent');
        if (stored) {
          const data = JSON.parse(stored);
          setHasConsent(data.choices[category] === true);
        }
      } catch {
        setHasConsent(false);
      }
    };

    checkConsent();

    // Listen for consent updates
    const handleConsentUpdate = () => checkConsent();
    window.addEventListener('consent:updated', handleConsentUpdate);
    
    return () => window.removeEventListener('consent:updated', handleConsentUpdate);
  }, [category]);

  React.useEffect(() => {
    if (hasConsent) {
      setLoaded(true);
    }
  }, [hasConsent]);

  const handleClick = () => {
    setLoaded(true);
  };

  if (loaded || hasConsent) {
    return (
      <iframe
        src={src}
        title={title}
        width={width}
        height={height}
        className={className}
        allowFullScreen={allowFullscreen}
        loading="lazy"
        style={{ border: 0 }}
      />
    );
  }

  const getCategoryName = () => {
    switch (category) {
      case 'functional': return 'funktionella cookies';
      case 'marketing': return 'marknadsföringscookies';
      case 'analytics': return 'analytiska cookies';
      default: return 'cookies';
    }
  };

  return (
    <div 
      className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
      style={{ width, height }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Ladda ${title} genom att acceptera ${getCategoryName()}`}
    >
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-4xl">🔒</div>
        <h3 className="text-lg font-semibold text-gray-800">
          Externt innehåll blockerat
        </h3>
        <p className="text-sm text-gray-600 max-w-md">
          För att visa detta innehåll ({title}) behöver du acceptera {getCategoryName()}.
        </p>
        {children && <div className="text-xs text-gray-500">{children}</div>}
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          Ladda innehåll
        </button>
        <p className="text-xs text-gray-400">
          Klicka för att ladda en gång, eller ändra dina cookie-inställningar för att alltid tillåta.
        </p>
      </div>
    </div>
  );
}