import http from 'k6/http';
import { sleep, check } from 'k6';
import * as config from './config.js';

export let options = {
    stages: [
        { duration: '5s', target: 5 },
        { duration: '30s', target: 5 },
        { duration: '5s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '5s', target: 5 },
        { duration: '30s', target: 5 },
        { duration: '5s', target: 0 },
    ],
    thresholds: {
        'http_req_duration': ['p(95)<3000'],  // Global threshold
        'http_req_duration{type:coursesEnrolled}': ['p(95)<2500'],
        'http_req_duration{type:coursesPathways}': ['p(95)<2000'],
        'http_req_duration{type:courses}': ['p(95)<2500'],
    },
};

function testEndpoint(endpoint, tag) {
    let params = {
        headers: {
            'Authorization': `Bearer ${config.TOKEN}`,
            'Content-Type': 'application/json',
        },
        tags: { type: tag }
    };

    let url = `${config.BASE_URL}${endpoint}`;
    let response = http.get(url, params);
    if (response.status !== 200) {
        console.log(`Failed request to ${url}: ${response.status} ${response.error}`);
    }
    check(response, { 'status was 200': r => r.status === 200 });
    sleep(1); // Add a short delay between requests
}

export default function () {
    testEndpoint('/api/externalCourses/enrolled/', 'coursesEnrolled');
    testEndpoint('/api/externalCourses/programs/pathways?Language=en&PageIndex=1', 'coursesPathways');
    testEndpoint('/api/externalCourses?Language=en&PageIndex=1', 'courses');
}
