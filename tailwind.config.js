export default {content:["./source/**/*.{html,tsx,ts}"],...{
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              orbitron: ['Orbitron', 'sans-serif'],
              mono: ['Fira Code', 'monospace'],
              cowboy: ['Rye', 'cursive'],
              marker: ['Permanent Marker', 'cursive'],
              fantasy: ['Cinzel', 'serif'],
              scroll: ['Almendra', 'serif'],
              anime: ['Ma Shan Zheng', 'cursive'],
            },
            colors: {
              input: 'var(--bg-input)',
              navActive: 'var(--bg-nav-active)',
              slate: {
                700: 'var(--bg-card)',
                750: 'var(--bg-card)',
                800: 'var(--bg-container)',
                850: 'var(--bg-app)',
                600: 'var(--border-color)',
              },
              sky: {
                300: 'var(--text-accent)',
                400: 'var(--text-accent)',
                500: 'var(--btn-secondary)',
                600: 'var(--btn-secondary)',
                700: 'var(--btn-secondary-hover)',
              },
              indigo: {
                600: 'var(--btn-to)',
                700: 'var(--btn-to-hover)',
              },
              purple: {
                600: 'var(--btn-from)',
                700: 'var(--btn-from-hover)',
              }
            }
          }
        }
      }};
