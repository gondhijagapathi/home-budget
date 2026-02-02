/**
 * Highcharts theme options aligned with shadcn UI (dark and light).
 * Colors match shadcn CSS variables for background, foreground, muted, border, primary.
 */

// Shadcn dark theme (from index.css .dark)
const dark = {
  chart: {
    backgroundColor: 'hsl(222.2, 84%, 4.9%)',  // --background
    borderColor: 'hsl(217.2, 32.6%, 17.5%)',   // --border
    borderWidth: 1,
    borderRadius: 8,
    style: {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  title: {
    style: {
      color: 'hsl(210, 40%, 98%)',  // --foreground
      fontSize: '1.125rem',
      fontWeight: 600,
    },
  },
  subtitle: {
    style: {
      color: 'hsl(215, 20.2%, 65.1%)',  // --muted-foreground
    },
  },
  xAxis: {
    gridLineColor: 'hsl(217.2, 32.6%, 17.5%)',
    labels: {
      style: {
        color: 'hsl(215, 20.2%, 65.1%)',
        fontSize: '0.75rem',
      },
    },
    lineColor: 'hsl(217.2, 32.6%, 17.5%)',
    tickColor: 'hsl(217.2, 32.6%, 17.5%)',
    title: {
      style: {
        color: 'hsl(210, 40%, 98%)',
      },
    },
  },
  yAxis: {
    gridLineColor: 'hsl(217.2, 32.6%, 17.5%)',
    labels: {
      style: {
        color: 'hsl(215, 20.2%, 65.1%)',
        fontSize: '0.75rem',
      },
    },
    lineColor: 'hsl(217.2, 32.6%, 17.5%)',
    tickColor: 'hsl(217.2, 32.6%, 17.5%)',
    title: {
      style: {
        color: 'hsl(210, 40%, 98%)',
      },
    },
  },
  legend: {
    itemStyle: {
      color: 'hsl(210, 40%, 98%)',
      fontSize: '0.875rem',
    },
    itemHoverStyle: {
      color: 'hsl(215, 20.2%, 65.1%)',
    },
  },
  tooltip: {
    backgroundColor: 'hsl(222.2, 84%, 4.9%)',
    borderColor: 'hsl(217.2, 32.6%, 17.5%)',
    style: {
      color: 'hsl(210, 40%, 98%)',
      fontSize: '0.875rem',
    },
  },
  credits: {
    style: {
      color: 'hsl(215, 20.2%, 65.1%)',
    },
  },
  // Palette: primary-like and accent colors that work on dark background
  colors: [
    'hsl(217, 91%, 60%)',   // blue
    'hsl(142, 71%, 45%)',   // green
    'hsl(38, 92%, 50%)',    // amber
    'hsl(0, 84%, 60%)',     // red
    'hsl(263, 70%, 50%)',   // violet
    'hsl(199, 89%, 48%)',   // cyan
  ],
};

// Shadcn light theme (from index.css :root)
const light = {
  chart: {
    backgroundColor: 'hsl(0, 0%, 100%)',       // --background
    borderColor: 'hsl(214.3, 31.8%, 91.4%)',   // --border
    borderWidth: 1,
    borderRadius: 8,
    style: {
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    },
  },
  title: {
    style: {
      color: 'hsl(222.2, 84%, 4.9%)',  // --foreground
      fontSize: '1.125rem',
      fontWeight: 600,
    },
  },
  subtitle: {
    style: {
      color: 'hsl(215.4, 16.3%, 46.9%)',  // --muted-foreground
    },
  },
  xAxis: {
    gridLineColor: 'hsl(214.3, 31.8%, 91.4%)',
    labels: {
      style: {
        color: 'hsl(215.4, 16.3%, 46.9%)',
        fontSize: '0.75rem',
      },
    },
    lineColor: 'hsl(214.3, 31.8%, 91.4%)',
    tickColor: 'hsl(214.3, 31.8%, 91.4%)',
    title: {
      style: {
        color: 'hsl(222.2, 84%, 4.9%)',
      },
    },
  },
  yAxis: {
    gridLineColor: 'hsl(214.3, 31.8%, 91.4%)',
    labels: {
      style: {
        color: 'hsl(215.4, 16.3%, 46.9%)',
        fontSize: '0.75rem',
      },
    },
    lineColor: 'hsl(214.3, 31.8%, 91.4%)',
    tickColor: 'hsl(214.3, 31.8%, 91.4%)',
    title: {
      style: {
        color: 'hsl(222.2, 84%, 4.9%)',
      },
    },
  },
  legend: {
    itemStyle: {
      color: 'hsl(222.2, 84%, 4.9%)',
      fontSize: '0.875rem',
    },
    itemHoverStyle: {
      color: 'hsl(215.4, 16.3%, 46.9%)',
    },
  },
  tooltip: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderColor: 'hsl(214.3, 31.8%, 91.4%)',
    style: {
      color: 'hsl(222.2, 84%, 4.9%)',
      fontSize: '0.875rem',
    },
  },
  credits: {
    style: {
      color: 'hsl(215.4, 16.3%, 46.9%)',
    },
  },
  colors: [
    'hsl(222.2, 47.4%, 11.2%)',  // primary
    'hsl(217, 91%, 60%)',
    'hsl(142, 71%, 45%)',
    'hsl(38, 92%, 50%)',
    'hsl(0, 84%, 60%)',
    'hsl(263, 70%, 50%)',
  ],
};

/**
 * @param {'dark'|'light'} theme
 * @returns {Object} Highcharts options to merge (chart, title, xAxis, yAxis, legend, tooltip, colors, etc.)
 */
export function getHighchartsTheme(theme) {
  return theme === 'dark' ? { ...dark } : { ...light };
}
