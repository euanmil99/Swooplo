#!/usr/bin/env tsx

import { AmazonAssociatesService } from '../server/services/amazonAssociates';

/**
 * Test script to verify Amazon affiliate link generation
 * Uses the user's UK affiliate tag: euanmil9901-21
 */

async function testAffiliateLinkGeneration() {
  console.log('🧪 Testing Amazon Affiliate Link Generation...\n');

  // Test product URLs
  const testUrls = [
    'https://www.amazon.co.uk/dp/B08N5WRWNW', // Example UK product
    'https://www.amazon.co.uk/Apple-iPhone-13-128GB-Blue/dp/B09G9HD6PD',
    'https://www.amazon.co.uk/Samsung-Galaxy-S21-Smartphone-Phantom/dp/B08N5WRWNW'
  ];

  console.log('📋 Test Configuration:');
  console.log('  - Region: UK');
  console.log('  - Affiliate Tag: euanmil9901-21');
  console.log('  - Domain: amazon.co.uk\n');

  for (let i = 0; i < testUrls.length; i++) {
    const originalUrl = testUrls[i];
    console.log(`🔗 Test ${i + 1}: ${originalUrl}`);
    
    try {
      // Test URL validation
      const isValid = AmazonAssociatesService.validateProductUrl(originalUrl);
      console.log(`   ✅ URL Validation: ${isValid ? 'PASS' : 'FAIL'}`);
      
      if (isValid) {
        // Extract product ID
        const productId = AmazonAssociatesService['extractProductId'](originalUrl);
        console.log(`   📦 Product ID: ${productId}`);
        
        // Generate affiliate URL (simulated)
        const domain = 'amazon.co.uk';
        const tag = 'euanmil9901-21';
        const trackingId = 'test-tracking-id';
        
        const affiliateUrl = AmazonAssociatesService['buildAffiliateUrl'](
          domain, 
          productId!, 
          trackingId, 
          tag
        );
        
        console.log(`   🎯 Generated Affiliate URL:`);
        console.log(`      ${affiliateUrl}`);
        
        // Verify UK-specific parameters
        const url = new URL(affiliateUrl);
        const hasCorrectTag = url.searchParams.get('tag') === 'euanmil9901-21';
        const hasCorrectLinkCode = url.searchParams.get('linkCode') === 'll2';
        const hasCorrectLanguage = url.searchParams.get('language') === 'en_GB';
        const hasLinkId = url.searchParams.has('linkId');
        
        console.log(`   ✅ Tag Parameter: ${hasCorrectTag ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Link Code: ${hasCorrectLinkCode ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Language: ${hasCorrectLanguage ? 'PASS' : 'FAIL'}`);
        console.log(`   ✅ Link ID: ${hasLinkId ? 'PASS' : 'FAIL'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
  }

  // Test supported regions
  console.log('🌍 Supported Amazon Regions:');
  const regions = AmazonAssociatesService.getSupportedRegions();
  Object.entries(regions).forEach(([region, domain]) => {
    console.log(`   ${region}: ${domain}`);
  });

  console.log('\n✅ Test completed!');
}

// Run the test
testAffiliateLinkGeneration().catch(console.error); 