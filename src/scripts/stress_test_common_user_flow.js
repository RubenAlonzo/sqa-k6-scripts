import http from 'k6/http';
import { sleep, check } from 'k6';
import * as config from './config.js';

export let options = {
    stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 0 },
    ],
};

const HEADERS = {
    headers: {
        'Authorization': `Bearer ${config.TOKEN}`,
        'Content-Type': 'application/json',
    },
};

function logFailure(response, url) {
    if (response.status !== 200) {
        console.error(`Failed request to ${url}: ${response.status} ${response.body}`);
    }
    return check(response, { 'status was 200': r => r.status === 200 });
}

function visitDashboard() {
    const paths = [
        '/api/externalCourses/programsInProcess/pathways',
        '/api/externalCourses/enrolled/',
        '/api/user/percentage',
        '/api/user/userinfo?language=es-ES',
    ];
    paths.forEach(path => {
        const response = http.get(`${config.BASE_URL}${path}`, HEADERS);
        logFailure(response, path);
    });
}

function visitCourses() {
    const paths = [
        '/api/externalCourses/enrolled/',
        '/api/externalCourses/programs/pathways?Language=en&PageIndex=1',
    ];
    paths.forEach(path => {
        const response = http.get(`${config.BASE_URL}${path}`, HEADERS);
        logFailure(response, path);
    });
}

function visitCourseOverview(courseId) {
    const path = `/api/externalCourses/course/${courseId}`;
    const response = http.get(`${config.BASE_URL}${path}`, HEADERS);
    logFailure(response, path);
}

export default function () {
    visitDashboard();
    sleep(1);
    visitCourses();
    sleep(1);
    visitCourseOverview(config.COURSE_ID);
    sleep(1);
}

