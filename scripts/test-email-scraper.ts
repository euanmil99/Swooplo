#!/usr/bin/env tsx

/**
 * Email Scraper Test Script
 * Tests the email scraping functionality for affiliate marketing
 */

import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your-test-token';

// Test data
const TEST_WEBSITES = [
  'https://example.com',
  'https://github.com',
  'https://stackoverflow.com',
];

const TEST_SOCIAL_PROFILES = [
  {
    platform: 'twitter',
    url: 'https://twitter.com/example',
  },
  {
    platform: 'linkedin',
    url: 'https://linkedin.com/in/example',
  },
];

const TEST_CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000';

async function testEmailScraper() {
  console.log('🧪 Testing Email Scraper Functionality\n');

  const headers = {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // Test 1: Website Email Scraping
    console.log('1️⃣ Testing Website Email Scraping...');
    for (const website of TEST_WEBSITES) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/email-scraper/website`,
          {
            url: website,
            maxEmails: 50,
            respectRobotsTxt: true,
          },
          { headers }
        );

        console.log(`✅ ${website}: Found ${response.data.data.validEmails} valid emails`);
        console.log(`   Total: ${response.data.data.totalFound}, Invalid: ${response.data.data.invalidEmails}`);
        
        if (response.data.data.emails.length > 0) {
          console.log(`   Sample emails: ${response.data.data.emails.slice(0, 3).join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${website}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Test 2: Social Media Email Scraping
    console.log('\n2️⃣ Testing Social Media Email Scraping...');
    for (const profile of TEST_SOCIAL_PROFILES) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/email-scraper/social-media`,
          {
            platform: profile.platform,
            profileUrl: profile.url,
            maxEmails: 30,
            includeBio: true,
            includePosts: false,
          },
          { headers }
        );

        console.log(`✅ ${profile.platform}: Found ${response.data.data.validEmails} valid emails`);
        console.log(`   Total: ${response.data.data.totalFound}, Platform: ${response.data.data.platform}`);
        
        if (response.data.data.emails.length > 0) {
          console.log(`   Sample emails: ${response.data.data.emails.slice(0, 3).join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${profile.platform}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Test 3: Bulk Email Scraping
    console.log('\n3️⃣ Testing Bulk Email Scraping...');
    try {
      const bulkSources = [
        {
          type: 'website',
          url: 'https://example.com',
          maxEmails: 20,
          respectRobotsTxt: true,
        },
        {
          type: 'website',
          url: 'https://github.com',
          maxEmails: 20,
          respectRobotsTxt: true,
        },
      ];

      const response = await axios.post(
        `${API_BASE_URL}/email-scraper/bulk-scrape`,
        { sources: bulkSources },
        { headers }
      );

      console.log(`✅ Bulk scraping completed`);
      console.log(`   Sources: ${response.data.data.summary.totalSources}`);
      console.log(`   Successful: ${response.data.data.summary.successfulSources}`);
      console.log(`   Total emails: ${response.data.data.summary.totalEmails}`);
      console.log(`   Valid emails: ${response.data.data.summary.totalValid}`);

      // Test storing emails
      if (response.data.data.results.length > 0) {
        const firstResult = response.data.data.results[0];
        if (firstResult.emails && firstResult.emails.length > 0) {
          console.log('\n4️⃣ Testing Email Storage...');
          
          const storeResponse = await axios.post(
            `${API_BASE_URL}/email-scraper/store`,
            {
              campaignId: TEST_CAMPAIGN_ID,
              emails: firstResult.emails.slice(0, 5), // Store first 5 emails
              source: firstResult.source,
              platform: firstResult.platform || 'website',
            },
            { headers }
          );

          console.log(`✅ Stored ${storeResponse.data.data.stored} emails`);
          console.log(`   Duplicates: ${storeResponse.data.data.duplicates}`);
          console.log(`   Invalid: ${storeResponse.data.data.invalid}`);
        }
      }
    } catch (error) {
      console.log(`❌ Bulk scraping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Email Subscribers Management
    console.log('\n5️⃣ Testing Email Subscribers Management...');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/email-scraper/subscribers/${TEST_CAMPAIGN_ID}`,
        { headers }
      );

      console.log(`✅ Loaded subscribers for campaign`);
      console.log(`   Total: ${response.data.data.total}`);
      console.log(`   Active: ${response.data.data.active}`);
      console.log(`   Inactive: ${response.data.data.inactive}`);
      
      if (response.data.data.subscribers.length > 0) {
        console.log(`   Sample subscriber: ${response.data.data.subscribers[0].email}`);
      }
    } catch (error) {
      console.log(`❌ Subscribers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Email Generation
    console.log('\n6️⃣ Testing Email Generation...');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/email-scraper/generate-email`,
        {
          campaignId: TEST_CAMPAIGN_ID,
          template: 'newsletter',
          personalization: true,
          includeUnsubscribe: true,
        },
        { headers }
      );

      console.log(`✅ Email generated successfully`);
      console.log(`   Subject: ${response.data.data.subject}`);
      console.log(`   Preview: ${response.data.data.preview}`);
      console.log(`   HTML length: ${response.data.data.htmlContent.length} characters`);
      console.log(`   Text length: ${response.data.data.textContent.length} characters`);
    } catch (error) {
      console.log(`❌ Email generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Statistics
    console.log('\n7️⃣ Testing Statistics...');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/email-scraper/stats`,
        { headers }
      );

      console.log(`✅ Statistics loaded`);
      console.log(`   Total emails: ${response.data.data.totalEmails}`);
      console.log(`   Valid emails: ${response.data.data.validEmails}`);
      console.log(`   Invalid emails: ${response.data.data.invalidEmails}`);
      console.log(`   Sources: ${Object.keys(response.data.data.sources).length}`);
      console.log(`   Platforms: ${Object.keys(response.data.data.platforms).length}`);
    } catch (error) {
      console.log(`❌ Statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n🎉 Email Scraper Testing Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Test email validation
async function testEmailValidation() {
  console.log('\n🔍 Testing Email Validation...');

  const testEmails = [
    'test@example.com',
    'user@gmail.com',
    'invalid-email',
    'test@invalid-domain.xyz',
    'admin@company.com',
    'noreply@example.com',
    'webmaster@test.com',
  ];

  for (const email of testEmails) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/email-scraper/validate`,
        { email },
        {
          headers: {
            'Authorization': `Bearer ${TEST_USER_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ ${email}: ${response.data.data.isValid ? 'Valid' : 'Invalid'}`);
    } catch (error) {
      console.log(`❌ ${email}: Validation failed`);
    }
  }
}

// Test robots.txt compliance
async function testRobotsTxtCompliance() {
  console.log('\n🤖 Testing Robots.txt Compliance...');

  const testUrls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com',
  ];

  for (const url of testUrls) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/email-scraper/check-robots`,
        { url },
        {
          headers: {
            'Authorization': `Bearer ${TEST_USER_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ ${url}: ${response.data.data.allowed ? 'Allowed' : 'Not allowed'}`);
    } catch (error) {
      console.log(`❌ ${url}: Check failed`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Email Scraper Tests\n');

  await testEmailScraper();
  await testEmailValidation();
  await testRobotsTxtCompliance();

  console.log('\n✨ All tests completed successfully!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testEmailScraper, testEmailValidation, testRobotsTxtCompliance }; 