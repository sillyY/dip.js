const { src, dest, series } = require('gulp');
const notify = require('gulp-notify');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');
const babel = require('gulp-babel');

const tsProject = ts.createProject('tsconfig.json');
const babelConfig = require('./babel.config');

// notification helper
function notifier(msg) {
  return notify({
    title: '▲ Dip',
    message: msg,
    icon: false,
  });
}

async function clear(path) {
  await src(path, { read: false }).pipe(clean());
  notify(`clear ${path} files`);
}

function precombile() {}

function combile() {}

function build() {}

async function bin() {
  await src('./**/*.ts')
    .pipe(tsProject())
    .js.pipe(babel())
    .pipe(dest('dist'))
    .pipe(notify('combile bin files'));
}

async function cli() {
  await src('cli/**/*.ts')
  .pipe(tsProject())
  .js.pipe(babel())
  .pipe(dest('cli'))
  .pipe(notify('combile cli files'));
}

exports.default = async function () {
  // await clear('dist');
  await bin();
  // await cli();
};
