import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { db } from '../database/index.js';
import { affiliateLinks, clicks } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Handle affiliate network webhooks
router.post('/affiliate/:network', asyncHandler(async (req: Request, res: Response) => {
  const { network } = req.params;
  const webhookData = req.body;

  console.log(`Received webhook from ${network}:`, webhookData);

  // Handle different affiliate networks
  switch (network) {
    case 'clickbank':
      await handleClickBankWebhook(webhookData);
      break;
    case 'amazon':
      await handleAmazonWebhook(webhookData);
      break;
    case 'shareasale':
      await handleShareASaleWebhook(webhookData);
      break;
    default:
      console.log(`Unknown affiliate network: ${network}`);
  }

  res.json({ success: true });
}));

// Handle social media platform webhooks
router.post('/social/:platform', asyncHandler(async (req: Request, res: Response) => {
  const { platform } = req.params;
  const webhookData = req.body;

  console.log(`Received social media webhook from ${platform}:`, webhookData);

  // Handle different social platforms
  switch (platform) {
    case 'instagram':
      await handleInstagramWebhook(webhookData);
      break;
    case 'twitter':
      await handleTwitterWebhook(webhookData);
      break;
    case 'linkedin':
      await handleLinkedInWebhook(webhookData);
      break;
    default:
      console.log(`Unknown social platform: ${platform}`);
  }

  res.json({ success: true });
}));

// Handle Stripe webhooks
router.post('/stripe', asyncHandler(async (req: Request, res: Response) => {
  const webhookData = req.body;

  console.log('Received Stripe webhook:', webhookData);

  // Handle different Stripe events
  switch (webhookData.type) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(webhookData.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(webhookData.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(webhookData.data.object);
      break;
    default:
      console.log(`Unhandled Stripe event: ${webhookData.type}`);
  }

  res.json({ success: true });
}));

// Click tracking endpoint
router.get('/r/:shortCode', asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const referrer = req.get('Referrer') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';

  // Find the affiliate link
  const link = await db
    .select()
    .from(affiliateLinks)
    .where(eq(affiliateLinks.shortCode, shortCode))
    .limit(1);

  if (link.length === 0) {
    return res.status(404).json({ error: 'Link not found' });
  }

  const affiliateLink = link[0];

  // Check if link is active and not expired
  if (!affiliateLink.isActive || affiliateLink.isExpired) {
    return res.status(410).json({ error: 'Link is no longer active' });
  }

  // Record the click
  await db
    .insert(clicks)
    .values({
      affiliateLinkId: affiliateLink.id,
      ipAddress,
      userAgent,
      referrer,
      clickedAt: new Date()
    });

  // Update click count
  await db
    .update(affiliateLinks)
    .set({
      clickCount: (affiliateLink.clickCount || 0) + 1,
      updatedAt: new Date()
    })
    .where(eq(affiliateLinks.id, affiliateLink.id));

  // Redirect to the original URL
  res.redirect(affiliateLink.originalUrl);
}));

// Helper functions for webhook handling
async function handleClickBankWebhook(data: any) {
  // Handle ClickBank conversion data
  if (data.transactionType === 'SALE') {
    // Update affiliate link with conversion
    console.log('ClickBank sale recorded:', data);
  }
}

async function handleAmazonWebhook(data: any) {
  // Handle Amazon Associates conversion data
  console.log('Amazon webhook received:', data);
}

async function handleShareASaleWebhook(data: any) {
  // Handle ShareASale conversion data
  console.log('ShareASale webhook received:', data);
}

async function handleInstagramWebhook(data: any) {
  // Handle Instagram engagement data
  console.log('Instagram webhook received:', data);
}

async function handleTwitterWebhook(data: any) {
  // Handle Twitter engagement data
  console.log('Twitter webhook received:', data);
}

async function handleLinkedInWebhook(data: any) {
  // Handle LinkedIn engagement data
  console.log('LinkedIn webhook received:', data);
}

async function handlePaymentSucceeded(data: any) {
  // Handle successful payment
  console.log('Payment succeeded:', data);
}

async function handlePaymentFailed(data: any) {
  // Handle failed payment
  console.log('Payment failed:', data);
}

async function handleSubscriptionUpdated(data: any) {
  // Handle subscription updates
  console.log('Subscription updated:', data);
}

export { router as webhookRoutes }; 