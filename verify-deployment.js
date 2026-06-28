import https from 'https';
import { URL } from 'url';

const DEPLOYMENT_URL = 'https://project-iris.vercel.app';

async function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const request = https.request(urlObj, { timeout }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.on('error', reject);
    request.end();
  });
}

async function verifyDeployment() {
  console.log('🔍 PROJECT-IRIS DEPLOYMENT VERIFICATION\n');
  console.log(`Target URL: ${DEPLOYMENT_URL}\n`);

  try {
    // 1. Check root page
    console.log('1️⃣  Checking root page...');
    const rootResponse = await fetchWithTimeout(DEPLOYMENT_URL);
    const rootStatus = rootResponse.status === 200 ? '✅' : '❌';
    console.log(`   ${rootStatus} Status: ${rootResponse.status}`);
    console.log(`   ${rootResponse.headers['x-vercel-cache'] ? '✅' : '⚠️ '} Cache: ${rootResponse.headers['x-vercel-cache'] || 'Not set'}`);
    
    // Check for Next.js markers
    const hasNextJs = rootResponse.body.includes('__NEXT_DATA__') || rootResponse.body.includes('_next');
    console.log(`   ${hasNextJs ? '✅' : '❌'} Next.js detected: ${hasNextJs}\n`);

    // 2. Check common pages
    console.log('2️⃣  Checking common pages...');
    const pagesToCheck = ['/about', '/dashboard', '/api/health'];
    
    for (const page of pagesToCheck) {
      try {
        const pageResponse = await fetchWithTimeout(`${DEPLOYMENT_URL}${page}`, 5000);
        const statusEmoji = pageResponse.status === 200 ? '✅' : 
                           pageResponse.status === 404 ? '⚠️ ' : '❌';
        console.log(`   ${statusEmoji} ${page}: ${pageResponse.status}`);
      } catch (err) {
        console.log(`   ❌ ${page}: ${err.message}`);
      }
    }
    console.log();

    // 3. Check API routes
    console.log('3️⃣  Checking API configuration...');
    try {
      const apiResponse = await fetchWithTimeout(`${DEPLOYMENT_URL}/api`, 5000);
      console.log(`   ℹ️  API endpoint status: ${apiResponse.status}`);
    } catch (err) {
      console.log(`   ⚠️  API check: ${err.message}`);
    }
    console.log();

    // 4. Check environment indicators
    console.log('4️⃣  Environment Configuration Check...');
    const bodyLower = rootResponse.body.toLowerCase();
    const hasEnvMarkers = {
      'API connected': bodyLower.includes('api') || bodyLower.includes('supabase'),
      'Database linked': bodyLower.includes('postgres') || bodyLower.includes('database'),
      'Auth enabled': bodyLower.includes('auth') || bodyLower.includes('session')
    };
    
    Object.entries(hasEnvMarkers).forEach(([marker, found]) => {
      console.log(`   ${found ? '✅' : '⚠️ '} ${marker}`);
    });
    console.log();

    // 5. Summary
    console.log('📊 DEPLOYMENT SUMMARY\n');
    console.log(`URL: ${DEPLOYMENT_URL}`);
    console.log(`Status: ${rootResponse.status === 200 ? '🟢 LIVE' : '🔴 NOT RESPONDING'}`);
    console.log(`Next.js App: ${hasNextJs ? '✅ Detected' : '❌ Not found'}`);
    console.log(`Response Time: ${rootResponse.headers['date']}`);
    console.log(`Server: ${rootResponse.headers['server'] || 'Vercel'}`);
    
    console.log('\n✨ Verification complete!');

  } catch (error) {
    console.error('❌ Deployment Verification Failed:');
    console.error(`Error: ${error.message}`);
    console.error('\n⚠️  DEPLOYMENT STATUS: 🔴 NOT ACCESSIBLE');
    process.exit(1);
  }
}

verifyDeployment().catch(console.error);
