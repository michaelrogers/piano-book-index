#!/usr/bin/env node
import { readFileSync } from 'fs';

const file = process.argv[2] || '/tmp/yt_data.json';
const d = JSON.parse(readFileSync(file, 'utf8'));

function find(obj, depth = 0) {
  if (obj === null || obj === undefined || typeof obj !== 'object' || depth > 25) return;
  if (obj.lockupViewModel) {
    const vm = obj.lockupViewModel;
    const meta = vm.metadata?.lockupMetadataViewModel;
    const title = meta?.title?.content || '';
    const contentId = vm.contentId || '';
    if (contentId && title) console.log(contentId + '|' + title);
  }
  if (Array.isArray(obj)) obj.forEach(i => find(i, depth + 1));
  else Object.keys(obj).forEach(k => find(obj[k], depth + 1));
}
find(d);
