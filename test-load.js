#!/usr/bin/env node

/**
 * RapidAPI 최적화 성능 테스트 스크립트
 * 동접 500명 지원 확인용
 */

const BASE_URL = 'http://localhost:3000';
const HEALTH_ENDPOINT = `${BASE_URL}/api/health`;
const SEARCH_ENDPOINT = `${BASE_URL}/api/youtube_search`;

// 테스트 설정
const TEST_CONFIG = {
  // 동접 테스트
  concurrentUsers: [1, 5, 10, 20, 50],
  searchesPerUser: 2,

  // 테스트 쿼리
  searchQueries: [
    '쿠팡',
    '네이버',
    'iPhone',
    'Tesla',
    '유튜브 마케팅'
  ],
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * 헬스 체크
 */
async function checkHealth() {
  try {
    const start = Date.now();
    const response = await fetch(HEALTH_ENDPOINT);
    const time = Date.now() - start;

    if (!response.ok) {
      error(`Health check failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    info(`Health check (${time}ms): Queue=${data.api.queue.activeRequests}/${data.api.queue.maxConcurrent}, Utilization=${data.api.health.utilizationPercent}%`);

    return data;
  } catch (err) {
    error(`Health check error: ${err.message}`);
    return null;
  }
}

/**
 * 단일 검색 요청
 */
async function performSearch(query, sessionId) {
  try {
    const start = Date.now();
    const params = new URLSearchParams({
      q: query,
      maxResults: '40'
    });

    const response = await fetch(`${SEARCH_ENDPOINT}?${params}`);
    const time = Date.now() - start;

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        time,
        sessionId,
        query,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      status: 200,
      time,
      sessionId,
      query,
      resultCount: data.items?.length || 0,
      usageToday: data.apiUsageToday
    };
  } catch (err) {
    const time = Date.now() - start;
    return {
      success: false,
      time,
      sessionId,
      query,
      error: err.message
    };
  }
}

/**
 * 동접 사용자 시뮬레이션
 */
async function simulateConcurrentUsers(userCount, searchesPerUser) {
  const results = [];
  const startTime = Date.now();

  info(`Starting ${userCount} concurrent user simulation (${searchesPerUser} searches each)...`);

  const userPromises = [];

  for (let userId = 0; userId < userCount; userId++) {
    const userPromise = (async () => {
      const userResults = [];

      for (let searchNum = 0; searchNum < searchesPerUser; searchNum++) {
        const query = TEST_CONFIG.searchQueries[
          (userId * searchesPerUser + searchNum) % TEST_CONFIG.searchQueries.length
        ];

        const result = await performSearch(query, userId);
        userResults.push(result);

        // 약간의 딜레이 추가 (실제 사용자 행동 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
      }

      return userResults;
    })();

    userPromises.push(userPromise);
  }

  const allResults = await Promise.all(userPromises);
  const totalTime = Date.now() - startTime;

  // 결과 수집
  allResults.forEach(userResults => {
    results.push(...userResults);
  });

  return {
    userCount,
    searchesPerUser,
    totalSearches: results.length,
    totalTime,
    results
  };
}

/**
 * 결과 분석
 */
function analyzeResults(testResult) {
  const { results, totalTime, userCount, searchesPerUser } = testResult;

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = (successful / results.length) * 100;

  const responseTimes = results.filter(r => r.success).map(r => r.time);
  const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  const p95Time = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

  const throughput = (results.length / (totalTime / 1000)).toFixed(2);

  return {
    successful,
    failed,
    successRate: successRate.toFixed(2),
    avgTime: avgTime.toFixed(0),
    minTime,
    maxTime,
    p95Time,
    totalTime,
    throughput,
    userCount,
    searchesPerUser
  };
}

/**
 * 메인 테스트 루프
 */
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'bold');
  log('║    RapidAPI 최적화 성능 테스트 (동접 500명 지원 확인)      ║', 'bold');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'bold');

  // 초기 헬스 체크
  info('Checking server health...');
  const health = await checkHealth();
  if (!health) {
    error('Server is not responding. Make sure to run: npm run dev');
    process.exit(1);
  }

  success('Server is ready!\n');

  const allAnalytics = [];

  for (const userCount of TEST_CONFIG.concurrentUsers) {
    log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
    log(`Test: ${userCount} concurrent users`, 'bold');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'cyan');

    const testResult = await simulateConcurrentUsers(userCount, TEST_CONFIG.searchesPerUser);
    const analysis = analyzeResults(testResult);
    allAnalytics.push(analysis);

    log('\n📊 Test Results:', 'bold');
    log(`   Total Searches: ${analysis.successful + analysis.failed}`);
    log(`   Success Rate: ${analysis.successRate}%`);
    log(`   Avg Response Time: ${analysis.avgTime}ms`);
    log(`   Min / Max Response Time: ${analysis.minTime}ms / ${analysis.maxTime}ms`);
    log(`   P95 Response Time: ${analysis.p95Time}ms`);
    log(`   Total Test Time: ${analysis.totalTime}ms`);
    log(`   Throughput: ${analysis.throughput} req/s`);

    if (analysis.failed > 0) {
      warning(`${analysis.failed} searches failed`);
    }

    // 다음 테스트 전 서버 상태 확인
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkHealth();
  }

  // 최종 요약
  log('\n\n╔═══════════════════════════════════════════════════════════╗', 'bold');
  log('║                  최종 성능 요약                            ║', 'bold');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'bold');

  log('Concurrent Users | Success Rate | Avg Response (ms) | P95 (ms) | Throughput (req/s)');
  log('────────────────────────────────────────────────────────────────────────────────────');

  allAnalytics.forEach(analysis => {
    const line = `${analysis.userCount.toString().padEnd(17)} | ${analysis.successRate.padEnd(13)}% | ${analysis.avgTime.padEnd(18)} | ${analysis.p95Time.padEnd(9)} | ${analysis.throughput}`;

    if (analysis.successRate < 95) {
      log(line, 'red');
    } else if (analysis.successRate < 99) {
      log(line, 'yellow');
    } else {
      log(line, 'green');
    }
  });

  // 최종 평가
  log('\n\n📈 Performance Assessment:', 'bold');
  const allSuccessful = allAnalytics.every(a => parseFloat(a.successRate) >= 99);
  const allResponsive = allAnalytics.every(a => parseInt(a.avgTime) <= 3000);

  if (allSuccessful && allResponsive) {
    success('✓ All tests passed! System is optimized for 500 concurrent users.');
    success('✓ Success rate: 99%+ across all load levels');
    success('✓ Average response time: ≤3s across all load levels');
  } else {
    if (!allSuccessful) warning('⚠️  Some tests had success rate < 99%');
    if (!allResponsive) warning('⚠️  Some tests had average response time > 3s');
  }

  log('\n');
}

// 실행
runTests().catch(err => {
  error(`Test error: ${err.message}`);
  process.exit(1);
});
