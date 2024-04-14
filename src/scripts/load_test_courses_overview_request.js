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
        'http_req_duration{type:courseOverview}': ['p(95)<1500'],  // Specific threshold
    },
};

function testCourseOverview(endpoint, tag) {
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
    testCourseOverview(`/api/externalCourses/course/course-v1:CyberWarrior+ESAD109+2022_ESAD109`, 'courseOverview');
    testCourseOverview(`/api/externalCourses/course/course-v1:CyberWarrior+ETCF1060+2022_T2`, 'courseOverview');
    testCourseOverview(`/api/externalCourses/course/course-v1:CyberWarrior+ETLF101+2022_T2`, 'courseOverview');
}
