import { sleep, check, group, fail } from 'k6'
import http from 'k6/http'
import jsonpath from 'https://jslib.k6.io/jsonpath/1.0.2/index.js'

export const options = {
  cloud: {
    distribution: { 'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 } },
    apm: [],
  },
  thresholds: {},
  scenarios: {
    Scenario_1: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 5, duration: '30s' },
        { target: 15, duration: '1m' },
        { target: 10, duration: '30s' },
      ],
      gracefulRampDown: '30s',
      exec: 'scenario_1',
    },
    Imported_HAR: {
      executor: 'ramping-vus',
      gracefulStop: '30s',
      stages: [
        { target: 20, duration: '1m' },
        { target: 20, duration: '3m30s' },
        { target: 0, duration: '1m' },
      ],
      gracefulRampDown: '30s',
      exec: 'imported_HAR',
    },
  },
}

// Scenario: Scenario_1 (executor: ramping-vus)

export function scenario_1() {
  let response

  // Automatically added sleep
  sleep(1)
}

// Scenario: Imported_HAR (executor: ramping-vus)

export function imported_HAR() {
  let response

  const vars = {}

  group('page_1 - https://pizza.deeruns.click/', function () {
    // Login
    response = http.put(
      'https://pizza-service.deeruns.click/api/auth',
      '{"email":"a@jwt.com","password":"admin"}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.deeruns.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    check(response, { 'status equals 200': response => response.status.toString() === '200' })
    
    if (!check(response, { 'status equals 200': response => response.status.toString() === '200' })) {
    console.log(response.body);
    fail('Login was *not* 200');
    }

    vars['token'] = jsonpath.query(response.json(), '$.token')[0]

    sleep(14.6)

    response = http.get('https://pizza-service.deeruns.click/api/order/menu', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        authorization: `Bearer ${vars['token']}`,
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"1fc-cgG/aqJmHhElGCplQPSmgl2Gwk0"',
        origin: 'https://pizza.deeruns.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(1)

    response = http.get('https://pizza-service.deeruns.click/api/franchise', {
      headers: {
        accept: '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        authorization: `Bearer ${vars['token']}`,
        'content-type': 'application/json',
        dnt: '1',
        'if-none-match': 'W/"40-EPPawbPn0KtYVCL5qBynMCqA1xo"',
        origin: 'https://pizza.deeruns.click',
        priority: 'u=1, i',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
    })
    sleep(18.2)

    response = http.post(
      'https://pizza-service.deeruns.click/api/order',
      '{"items":[{"menuId":2,"description":"Pepperoni","price":0.0042},{"menuId":3,"description":"Margarita","price":0.0042}],"storeId":"1","franchiseId":1}',
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${vars['token']}`,
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.deeruns.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
        },
      }
    )
    check(response, { 'status equals 200': (r) => r.status.toString() === '200' });
    if (!check(response, { 'status equals 200': (r) => r.status.toString() === '200' })) {
      console.log(response.body);
      fail('Order placement failed');
    }

    // Extract the JWT from the order response (assuming it's in the response body as 'jwt')
    vars['pizzaJwt'] = jsonpath.query(response.json(), '$.jwt')[0];
    if (!vars['pizzaJwt']) {
      console.log('Failed to extract pizza JWT from order response:', response.body);
      fail('Pizza JWT not found in order response');
    }
    sleep(3)


    response = http.post(
      'https://pizza-factory.cs329.click/api/order/verify',
      JSON.stringify({ jwt: vars['pizzaJwt'] }),
      {
        headers: {
          accept: '*/*',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9',
          authorization: `Bearer ${vars['token']}`,
          'content-type': 'application/json',
          dnt: '1',
          origin: 'https://pizza.deeruns.click',
          priority: 'u=1, i',
          'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-storage-access': 'active',
        },
      }
    )
    check(response, { 'status equals 200': (r) => r.status.toString() === '200' });
    if (!check(response, { 'status equals 200': (r) => r.status.toString() === '200' })) {
      console.log('Verification failed with body:', response.body);
      fail('Pizza verification failed');
    }
  })
}