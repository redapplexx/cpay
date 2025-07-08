// Analytics utility for tracking user interactions and performance

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

class Analytics {
  private isEnabled = process.env.NODE_ENV === 'production';

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('Analytics Event:', event, properties);
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    // Send to your analytics service (Firebase Analytics, Google Analytics, etc.)
    this.sendToAnalytics(analyticsEvent);
  }

  trackPageView(page: string) {
    this.track('page_view', { page });
  }

  trackUserAction(action: string, details?: Record<string, any>) {
    this.track('user_action', { action, ...details });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number) {
    this.track('performance', { metric, value });
  }

  private sendToAnalytics(event: AnalyticsEvent) {
    // Implement your analytics service here
    // Example: Firebase Analytics, Google Analytics, etc.
    console.log('Analytics Event:', event);
  }
}

export const analytics = new Analytics(); 