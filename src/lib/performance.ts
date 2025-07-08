// Performance monitoring utility

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  trackPageLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
          this.recordMetric('first_paint', performance.getEntriesByName('first-paint')[0]?.startTime || 0, 'ms');
          this.recordMetric('first_contentful_paint', performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, 'ms');
        }
      });
    }
  }

  trackApiCall(endpoint: string, duration: number) {
    this.recordMetric(`api_call_${endpoint}`, duration, 'ms');
  }

  trackUserInteraction(action: string, duration: number) {
    this.recordMetric(`user_interaction_${action}`, duration, 'ms');
  }

  private recordMetric(name: string, value: number, unit: string) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to your analytics service
    console.log('Performance Metric:', metric);
  }

  getMetrics() {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor(); 