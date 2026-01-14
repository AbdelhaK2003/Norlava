
import jwt from 'jsonwebtoken';
import * as jwtStar from 'jsonwebtoken';

console.log('--- JWT Import Test ---');
console.log('Default Import:', jwt);
console.log('typeof default:', typeof jwt);
console.log('Start Import:', jwtStar);

try {
    if (typeof jwt.verify === 'function') {
        console.log('✅ jwt.verify is a function (Default Import)');
    } else {
        console.log('❌ jwt.verify is MISSING in Default Import');
    }
} catch (e) {
    console.log('❌ Error checking default import:', e);
}

try {
    // @ts-ignore
    if (typeof jwtStar.verify === 'function') {
        console.log('✅ jwtStar.verify is a function (Star Import)');
    } else {
        // @ts-ignore
        if (jwtStar.default && typeof jwtStar.default.verify === 'function') {
            console.log('✅ jwtStar.default.verify works (Star Import with .default)');
        } else {
            console.log('❌ jwtStar.verify is MISSING in Star Import');
        }
    }
} catch (e) {
    console.log('❌ Error checking star import:', e);
}
