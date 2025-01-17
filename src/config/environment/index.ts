import { merge } from 'lodash';

import { development } from './development';
import { test } from './test';
import { production } from './production';

const all = {
  env: process.env.NODE_ENV,
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  ip: process.env.IP || '0.0.0.0',
  user_forgot_pass_key: '3ac1194d22d53db7e2425d8f',
  user_sessions: {
    // Secret to sign the session ID
    secret: process.env.USER_SESSION_SECRET,
    // Número de días a los que expirará la sesión
    expiration_days: 7,
    // Número máximo de sesiones activas concurrentemente
    max_active_sessions: 4,
    resave: false,
    saveUninitialized: false,
  }
};

export const config: any = merge(all, _getEnvironmentConfig());

function _getEnvironmentConfig() {
  if (process.env.NODE_ENV === 'test') {
    return test;
  } else if (process.env.NODE_ENV === 'production') {
    return production;
  }
  else {
    return development;
  }
}
