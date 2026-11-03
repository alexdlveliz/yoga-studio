import serverless from 'serverless-http';
import {createApp} from '../../dist/app.js';
export const handler=serverless(createApp());
