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
        // Global threshold
        'http_req_duration': ['p(95)<3000'],

        // Specific thresholds for tagged requests
        'http_req_duration{type:pathways}': ['p(95)<2000'],
        'http_req_duration{type:enrolled}': ['p(95)<2500'],
        'http_req_duration{type:percentage}': ['p(95)<1500'],
        'http_req_duration{type:userinfo}': ['p(95)<1000'],
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

function visitDashboard() {
    let response;

    // Repeated and other single requests executed in sequence
    let url = `${config.BASE_URL}/api/externalCourses/programsInProcess/pathways`;
    for (let i = 0; i < 3; i++) {
        let params = { headers: HEADERS };
        response = http.get(url, params);
        if (response.status !== 200) {
            console.log(`Failed request to ${url}: ${response.status} ${response.error}`);
        }
        check(response, { 'dashboard pathways status was 200': r => r.status === 200 });
    }

    let params = { headers: HEADERS };
    response = http.get(`${config.BASE_URL}/api/externalCourses/enrolled/`, params);
    check(response, { 'dashboard enrolled status was 200': r => r.status === 200 });
}

export default function () {
    testEndpoint('/api/externalCourses/programsInProcess/pathways', 'pathways');
    testEndpoint('/api/externalCourses/enrolled/', 'enrolled');
    testEndpoint('/api/user/percentage', 'percentage');
    testEndpoint('/api/user/userinfo?language=es-ES', 'userinfo');
}
