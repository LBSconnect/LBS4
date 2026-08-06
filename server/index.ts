import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { getUncachableStripeClient } from './stripeClient';
import { WebhookHandlers, StripeWebhookNotConfiguredError } from './webhookHandlers';
import { seedStripeProducts } from './seedProducts';
import { storage } from './storage';
import { createI9SessionMiddleware } from './i9Auth';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not set, Stripe features will be disabled');
    return;
  }

  try {
    console.log('Initializing Stripe...');
    const stripe = await getUncachableStripeClient();

    // Verify Stripe connection
    await stripe.products.list({ limit: 1 });
    console.log('Stripe connection verified');

    // Sync products and correct prices
    await seedStripeProducts();
    console.log('Stripe products synced');
  } catch (error: any) {
    console.error('Failed to initialize Stripe:', error.message);
    // Don't throw - allow server to start without Stripe
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer.');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      const rawBody = req.body as Buffer;

      await WebhookHandlers.processWebhook(rawBody, sig);

      res.status(200).json({ received: true });
    } catch (error: any) {
      if (error instanceof StripeWebhookNotConfiguredError) {
        console.error('STRIPE WEBHOOK: rejected — STRIPE_WEBHOOK_SECRET is not configured, refusing to process an unverified event.');
        return res.status(503).json({ error: 'Webhook processing unavailable: STRIPE_WEBHOOK_SECRET is not configured.' });
      }
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

// Health check endpoint for Render
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 301 redirects for discontinued services (Printing & Copies, Scanning,
// Faxing, Resume Services) — send visitors and search engines to the
// current services listing instead of a dead page. Also covers services
// that moved from a generic /services/:slug URL to a dedicated,
// keyword-focused SEO landing page.
const DISCONTINUED_SERVICE_REDIRECTS: Record<string, string> = {
  '/services/printing-copies': '/services',
  '/services/scanning': '/services',
  '/services/faxing': '/services',
  '/services/resume-services': '/services',
  '/services/notary-service': '/notary-houston-77090',
  '/services/passport-photos': '/passport-photos-houston-77090',
  '/services/certification-exam-testing': '/certiport-testing-center-houston',
};
app.use((req, res, next) => {
  const target = DISCONTINUED_SERVICE_REDIRECTS[req.path];
  if (target) {
    return res.redirect(301, target);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust the platform's reverse proxy (Render, etc.) so req.ip and secure
// cookies (used by the I-9 portal session) work correctly in production.
app.set("trust proxy", 1);
app.use(createI9SessionMiddleware());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await storage.runMigrations();
  await initStripe();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
