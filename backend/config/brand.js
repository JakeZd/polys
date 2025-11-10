// PolySynapse Brand Guidelines and Configuration

export const brand = {
  name: "PolySynapse",
  tagline: "Neural Prediction Network",
  description: "Where human intuition meets artificial intelligence",
  
  // Brand Colors
  colors: {
    primary: {
      main: "#6366F1",      // Indigo
      light: "#818CF8",
      dark: "#4F46E5",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    secondary: {
      main: "#8B5CF6",      // Purple
      light: "#A78BFA",
      dark: "#7C3AED"
    },
    neural: {
      synapse: "#00F5FF",   // Cyan (для нейронных связей)
      pulse: "#FF00FF",     // Magenta (для активности)
      glow: "#00FF88"       // Green (для успешных предсказаний)
    },
    semantic: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6"
    },
    dark: {
      bg: "#0F172A",
      surface: "#1E293B",
      border: "#334155"
    }
  },
  
  // Typography
  typography: {
    fonts: {
      heading: "'Space Grotesk', sans-serif",
      body: "'Inter', sans-serif",
      mono: "'JetBrains Mono', monospace"
    },
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem"
    }
  },
  
  // Logo variations
  logos: {
    icon: "🧠",
    text: "PolySynapse",
    ascii: `
    ╔═══════════════════════════╗
    ║     🧠 PolySynapse       ║
    ║  Neural Prediction Network║
    ╚═══════════════════════════╝
    `,
    svg: `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <!-- Neural network background -->
      <defs>
        <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Synapses connections -->
      <circle cx="20" cy="30" r="3" fill="url(#neural-gradient)" opacity="0.6"/>
      <circle cx="40" cy="20" r="3" fill="url(#neural-gradient)" opacity="0.6"/>
      <circle cx="40" cy="40" r="3" fill="url(#neural-gradient)" opacity="0.6"/>
      <line x1="20" y1="30" x2="40" y2="20" stroke="url(#neural-gradient)" stroke-width="1" opacity="0.4"/>
      <line x1="20" y1="30" x2="40" y2="40" stroke="url(#neural-gradient)" stroke-width="1" opacity="0.4"/>
      
      <!-- Text -->
      <text x="55" y="35" font-family="Space Grotesk, sans-serif" font-size="24" font-weight="bold" fill="url(#neural-gradient)">
        PolySynapse
      </text>
    </svg>
    `
  },
  
  // AI Personality
  aiPersonality: {
    name: "Synapse AI",
    avatar: "🤖",
    traits: [
      "Analytical",
      "Data-driven", 
      "Confident",
      "Transparent"
    ],
    voiceTone: "Professional yet approachable",
    decisionStyle: "Multi-model consensus with neural network validation"
  },
  
  // Animations
  animations: {
    neuralPulse: `
      @keyframes neural-pulse {
        0%, 100% { 
          opacity: 0.4;
          transform: scale(1);
        }
        50% { 
          opacity: 1;
          transform: scale(1.1);
        }
      }
    `,
    synapseFlow: `
      @keyframes synapse-flow {
        0% { 
          background-position: 0% 50%;
        }
        50% { 
          background-position: 100% 50%;
        }
        100% { 
          background-position: 0% 50%;
        }
      }
    `,
    dataStream: `
      @keyframes data-stream {
        0% {
          transform: translateY(100%);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateY(-100%);
          opacity: 0;
        }
      }
    `
  },
  
  // Marketing Messages
  messaging: {
    hero: "Predict the Future with Neural Intelligence",
    subhero: "Join the world's first neural prediction network where AI and human intelligence converge",
    features: [
      "🧠 Advanced neural network predictions",
      "⚡ Real-time synaptic consensus",
      "🎯 98.7% prediction accuracy",
      "💎 Earn rewards for correct predictions",
      "🌐 Decentralized neural validation"
    ],
    cta: {
      primary: "Connect Your Neural Wallet",
      secondary: "Explore Predictions"
    }
  },
  
  // Social Media
  social: {
    twitter: "@PolySynapse",
    telegram: "t.me/polysynapse",
    discord: "discord.gg/polysynapse",
    github: "github.com/polysynapse",
    hashtags: ["#PolySynapse", "#NeuralPredictions", "#AIvsHuman", "#PredictionMarkets"]
  },
  
  // Sound Effects (for future implementation)
  sounds: {
    connect: "synapse-connect.mp3",
    predict: "neural-pulse.mp3",
    win: "synapse-success.mp3",
    lose: "synapse-fail.mp3",
    notification: "neural-ping.mp3"
  }
};

// Theme configuration for Tailwind
export const theme = {
  extend: {
    colors: {
      neural: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95'
      },
      synapse: {
        glow: '#00F5FF',
        pulse: '#FF00FF',
        success: '#00FF88'
      }
    },
    animation: {
      'neural-pulse': 'neural-pulse 2s ease-in-out infinite',
      'synapse-flow': 'synapse-flow 3s ease infinite',
      'data-stream': 'data-stream 5s linear infinite'
    },
    backgroundImage: {
      'neural-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'synapse-pattern': "url('/assets/synapse-pattern.svg')"
    }
  }
};

// Component styles
export const componentStyles = {
  button: {
    primary: "bg-gradient-to-r from-neural-500 to-neural-600 hover:from-neural-600 hover:to-neural-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105",
    secondary: "bg-dark-surface border border-neural-400 text-neural-400 hover:bg-neural-400 hover:text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200",
    neural: "relative bg-gradient-to-r from-synapse-glow to-synapse-pulse text-white font-bold px-8 py-4 rounded-xl overflow-hidden group"
  },
  
  card: {
    base: "bg-dark-surface rounded-xl border border-dark-border shadow-2xl overflow-hidden",
    neural: "bg-gradient-to-br from-dark-surface to-neural-900/20 rounded-xl border border-neural-500/30 shadow-neural-500/20 shadow-2xl",
    hover: "hover:border-neural-400 hover:shadow-neural-400/30 transition-all duration-300"
  },
  
  badge: {
    ai: "bg-gradient-to-r from-synapse-glow/20 to-synapse-pulse/20 border border-synapse-glow/50 text-synapse-glow px-3 py-1 rounded-full text-sm font-semibold animate-neural-pulse",
    success: "bg-synapse-success/20 border border-synapse-success/50 text-synapse-success px-3 py-1 rounded-full text-sm font-semibold",
    warning: "bg-warning/20 border border-warning/50 text-warning px-3 py-1 rounded-full text-sm font-semibold"
  }
};

export default brand;
