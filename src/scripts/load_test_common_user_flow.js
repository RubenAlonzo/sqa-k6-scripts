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
        'http_req_duration': ['p(95)<3000'], // 95% of requests must complete below 500ms
    },
};

const HEADERS = {
    headers: {
        'Authorization': `Bearer ${config.TOKEN}`,
        'Content-Type': 'application/json',
    },
};

function visitDashboard() {
    let response;

    // Repeated and other single requests executed in sequence
    let url = `${config.BASE_URL}/api/externalCourses/programsInProcess/pathways`;
    for (let i = 0; i < 3; i++) {
        response = http.get(url, HEADERS);
        if (response.status !== 200) {
            console.log(`Failed request to ${url}: ${response.status} ${response.error}`);
        }
        check(response, { 'dashboard pathways status was 200': r => r.status === 200 });
    }

    response = http.get(`${config.BASE_URL}/api/externalCourses/enrolled/`, HEADERS);
    check(response, { 'dashboard enrolled status was 200': r => r.status === 200 });

    response = http.get(`${config.BASE_URL}/api/user/percentage`, HEADERS);
    check(response, { 'dashboard percentage status was 200': r => r.status === 200 });

    response = http.get(`${config.BASE_URL}/api/user/userinfo?language=es-ES`, HEADERS);
    check(response, { 'dashboard userinfo status was 200': r => r.status === 200 });

    for (let i = 0; i < 2; i++) {
        response = http.get(`${config.BASE_URL}/api/externalCourses/enrolled/`, HEADERS);
        check(response, { 'dashboard enrolled status was 200': r => r.status === 200 });
    }
}

function visitCourses() {
    let response = http.get(`${config.BASE_URL}/api/externalCourses/enrolled/`, HEADERS);
    check(response, { 'courses enrolled status was 200': r => r.status === 200 });

    response = http.get(`${config.BASE_URL}/api/externalCourses/programs/pathways?Language=en&PageIndex=1`, HEADERS);
    check(response, { 'courses programs pathways status was 200': r => r.status === 200 });

    // Repeat the request for pathways as needed
    for (let i = 0; i < 2; i++) {
        response = http.get(`${config.BASE_URL}/api/externalCourses/programs/pathways?Language=en&PageIndex=1`, HEADERS);
        check(response, { 'courses repeated pathways status was 200': r => r.status === 200 });
    }
}

function visitCourseOverview(courseId) {
    let response = http.get(`${config.BASE_URL}/api/externalCourses/course/${courseId}`, HEADERS);
    check(response, { 'course overview status was 200': r => r.status === 200 });
}

export default function () {
    visitDashboard();
    sleep(1); // Simulate think time
    visitCourses();
    sleep(1); // Simulate think time

    // Example of visiting a specific course overview
    visitCourseOverview(config.COURSE_ID);
    sleep(1); // Simulate end of session
}
