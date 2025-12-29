import { Film, Calendar } from 'lucide-react';

const NavigationTabs = ({ activeStep, setActiveStep }) => {
  const steps = [
    { id: 'period', label: 'Reporting Period', icon: Calendar },
    { id: 'data-entry', label: 'Waste Data Entry', icon: Film },
  ];

  return (
    <div style={{
      background: '#e5f4e2ff',
      marginTop: '55px',
      width: '420px',
      paddingTop: '6px',
      paddingLeft: '6px',
      paddingRight: '6px',
      marginLeft: '70px',
      borderRadius: '8px',
      paddingBottom: '6px',
    }}>
      <nav style={{
        width: '100%',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '6px',
        }}>
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1,
                  width: '10px !important',
                  padding: '8px 10px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: isActive ? '#194d2a' : '#6b7a6f',
                  background: isActive ? '#fefffa' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 8px rgba(25, 77, 42, 0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(254, 255, 250, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon 
                  size={16} 
                  strokeWidth={2}
                  style={{
                    color: isActive ? '#194d2a' : '#6b7a6f',
                  }}
                />
                {step.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default NavigationTabs;