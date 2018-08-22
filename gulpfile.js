const gulp = require('gulp');
const del = require('del');
const util = require('gulp-util');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');

//paths
const urls = {
    js: 'src/**/*.js',
    html: 'src/**/*.html',
    devManifest: 'src/**/package.dev.manifest',
    prodManifest: 'src/**/package.prod.manifest',
    dist: 'dist/',
    dest: 'dist/App_Plugins'
};

//config
const config = {
    folder: '/PrimitivePlaceholders',
    prod: !!util.env.production
};

gulp.task('clean', () =>
    del([`${urls.dist}/**`])
);

gulp.task('js', () =>
    gulp.src(urls.js)
    .pipe(config.prod ? babel() : util.noop())
    .pipe(config.prod ? concat('primitive-placeholders.min.js') : util.noop())
    .pipe(config.prod ? uglify() : util.noop())
    .pipe(gulp.dest(urls.dest))
);

gulp.task('manifest', () =>
    gulp.src(config.prod ? urls.prodManifest : urls.devManifest)
    .pipe(rename('package.manifest'))
    .pipe(gulp.dest(urls.dest + config.folder))
);

gulp.task('html', () => 
    gulp.src(urls.html)
        .pipe(gulp.dest(urls.dest))
);

gulp.task('export', done => {
    const i = process.argv.indexOf('--dest');

    if (i === -1) {
        done();
    }

    const exportTo = process.argv[i + 1];

    if (exportTo) {
        del.sync(exportTo + config.folder, {
            force: true
        });

        gulp.src(`${urls.dest}/**`)
            .pipe(gulp.dest(exportTo));
    }

    done();
});

//  gulp watch --dest '../umbraco.7.9/umbraco790/app_plugins'
gulp.task('watch', () => {
    gulp.watch([urls.js, urls.html, urls.devManifest], gulp.series('default'));
});

gulp.task('default', gulp.series('clean', 'js', 'html', 'manifest', 'export'));
